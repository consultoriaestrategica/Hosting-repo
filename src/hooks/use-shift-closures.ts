"use client"

import { useCallback } from "react"
import { db } from "@/lib/firebase"
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore"
import type { ShiftType, VitalReading } from "@/lib/shift-coverage"
import type { CreatedByInfo } from "./use-logs"

export type ShiftClosure = {
  id: string
  residentId: string
  shiftType: ShiftType
  shiftDate: string
  shiftStart: string
  shiftEnd: string
  closedBy: CreatedByInfo
  closedAt: Date | null
  isLate: boolean
  lastVitalsSnapshot: VitalReading | null
  closingNote: string
  fieldsCovered: string[]
  requiresNightFollowUp?: boolean
}

export type ShiftClosureCursor = QueryDocumentSnapshot<DocumentData>

export type ListShiftClosuresParams = {
  residentId: string
  pageSize?: number
  cursor?: ShiftClosureCursor | null
}

export type ListShiftClosuresResult = {
  closures: ShiftClosure[]
  nextCursor: ShiftClosureCursor | null
  hasMore: boolean
}

export type CloseShiftInput = {
  residentId: string
  shiftType: ShiftType
  shiftDate: string
  shiftStart: string
  shiftEnd: string
  closedBy: CreatedByInfo
  isLate: boolean
  lastVitalsSnapshot: VitalReading | null
  closingNote: string
  fieldsCovered: string[]
  // Solo tiene sentido en un cierre de turno dia; se omite del todo
  // (no se manda `undefined`) en cualquier otro caso.
  requiresNightFollowUp?: boolean
  // Todos los logs (medicos + suministro) que calculateShiftCoverage
  // encontro en la ventana de este turno — son los que quedan
  // lockedInClosure en el mismo batch que crea el cierre.
  logIds: string[]
}

// Quita las claves `undefined` de un objeto antes de mandarlo a
// Firestore. lastVitalsSnapshot puede traer signos vitales parciales
// (ej. solo temperatura) y Firestore rechaza cualquier `undefined`
// explicito dentro de un mapa, igual que ya paso con arrayUnion() en
// partial-evolution-form.tsx — mismo problema, mismo fix.
function omitUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) out[key] = value
  }
  return out
}

// Mapeo compartido Firestore doc -> ShiftClosure, usado tanto por la
// consulta puntual (getShiftClosure) como por el listado paginado
// (listShiftClosures) para que no queden dos copias del mismo mapeo.
function mapShiftClosureDoc(docSnap: QueryDocumentSnapshot<DocumentData>): ShiftClosure {
  const raw = docSnap.data() as Record<string, any>
  return {
    id: docSnap.id,
    residentId: raw.residentId,
    shiftType: raw.shiftType,
    shiftDate: raw.shiftDate,
    shiftStart: raw.shiftStart,
    shiftEnd: raw.shiftEnd,
    closedBy: raw.closedBy,
    closedAt: raw.closedAt?.toDate?.() ?? null,
    isLate: raw.isLate ?? false,
    lastVitalsSnapshot: raw.lastVitalsSnapshot ?? null,
    closingNote: raw.closingNote ?? "",
    fieldsCovered: raw.fieldsCovered ?? [],
    requiresNightFollowUp: raw.requiresNightFollowUp,
  }
}

export function useShiftClosures() {
  // Busca si ya existe un cierre para este residente/fecha/turno.
  // Se usa tanto para mostrar la vista de solo lectura de un turno ya
  // cerrado, como para que el cierre de turno noche lea el
  // requiresNightFollowUp del cierre de turno dia del mismo shiftDate.
  const getShiftClosure = useCallback(
    async (residentId: string, shiftDate: string, shiftType: ShiftType): Promise<ShiftClosure | null> => {
      const ref = collection(db, "shiftClosures")
      const q = query(
        ref,
        where("residentId", "==", residentId),
        where("shiftDate", "==", shiftDate),
        where("shiftType", "==", shiftType),
        limit(1)
      )
      const snapshot = await getDocs(q)
      if (snapshot.empty) return null

      return mapShiftClosureDoc(snapshot.docs[0])
    },
    []
  )

  // Historial paginado de cierres de un residente, mas reciente
  // primero. Usa el patron estandar de Firestore para paginacion por
  // cursor (query() + orderBy() + startAfter() con el ultimo
  // QueryDocumentSnapshot de la pagina anterior) — no hay precedente de
  // esto en el proyecto todavia (Registro Diario pagina del lado del
  // cliente sobre un array ya cargado), asi que este es el primero;
  // usarlo tambien para Registro Diario en el futuro es un cambio
  // aparte, no se toco ese paginado existente aca.
  //
  // Pide una fila de mas (pageSize + 1) para saber si hay siguiente
  // pagina sin necesitar una segunda consulta.
  const listShiftClosures = useCallback(
    async ({ residentId, pageSize = 10, cursor = null }: ListShiftClosuresParams): Promise<ListShiftClosuresResult> => {
      const ref = collection(db, "shiftClosures")
      const base = query(ref, where("residentId", "==", residentId), orderBy("shiftStart", "desc"))
      const paged = cursor ? query(base, startAfter(cursor), limit(pageSize + 1)) : query(base, limit(pageSize + 1))

      const snapshot = await getDocs(paged)
      const hasMore = snapshot.docs.length > pageSize
      const pageDocs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs

      return {
        closures: pageDocs.map(mapShiftClosureDoc),
        nextCursor: hasMore ? pageDocs[pageDocs.length - 1] : null,
        hasMore,
      }
    },
    []
  )

  // Crea el cierre y bloquea (lockedInClosure) todos los logs del
  // turno en un unico batch atomico — o se crean los dos, o no se crea
  // ninguno. El bloqueo es lo que hace que el cierre sea de verdad
  // irreversible: ver la regla de Firestore sobre `logs`/`dailyLogs`.
  const closeShift = useCallback(async (input: CloseShiftInput): Promise<string> => {
    const batch = writeBatch(db)
    const closureRef = doc(collection(db, "shiftClosures"))

    const payload: Record<string, unknown> = {
      residentId: input.residentId,
      shiftType: input.shiftType,
      shiftDate: input.shiftDate,
      shiftStart: input.shiftStart,
      shiftEnd: input.shiftEnd,
      closedBy: input.closedBy,
      closedAt: serverTimestamp(),
      isLate: input.isLate,
      lastVitalsSnapshot: input.lastVitalsSnapshot
        ? omitUndefined(input.lastVitalsSnapshot as unknown as Record<string, unknown>)
        : null,
      closingNote: input.closingNote,
      fieldsCovered: input.fieldsCovered,
    }
    if (input.shiftType === "dia" && input.requiresNightFollowUp !== undefined) {
      payload.requiresNightFollowUp = input.requiresNightFollowUp
    }

    batch.set(closureRef, payload)

    for (const logId of input.logIds) {
      batch.update(doc(db, "logs", logId), { lockedInClosure: closureRef.id })
    }

    await batch.commit()
    return closureRef.id
  }, [])

  return { getShiftClosure, listShiftClosures, closeShift }
}
