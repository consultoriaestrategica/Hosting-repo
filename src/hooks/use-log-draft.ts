"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, Timestamp } from "firebase/firestore"
import { useAuth } from "@/hooks/use-auth"
import type { ShiftType } from "@/lib/shift-coverage"

const DEBOUNCE_MS = 2_000
// Si el guardado del borrador no se confirma en este tiempo, lo mas
// probable es que no haya conexion — mismo criterio que SAVE_TIMEOUT_MS
// en new-log-form.tsx, mas corto porque esto es en segundo plano, no
// algo que el usuario este esperando activamente.
const DRAFT_SAVE_TIMEOUT_MS = 5_000
const DRAFT_TTL_DAYS = 7

export type DraftSaveStatus = "idle" | "saving" | "saved" | "offline" | "error"

export interface LogDraftShiftInfo {
  shiftDate: string
  shiftType: ShiftType
  entryTimeOfDay?: string
}

export interface LogDraftRecord {
  values: Record<string, unknown>
  shift: LogDraftShiftInfo | null
  updatedAt: Date | null
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}

// Quita claves `undefined` recursivamente (un nivel de objetos
// anidados basta en la practica para los valores de este formulario) —
// mismo problema que en new-log-form.tsx: Firestore rechaza cualquier
// `undefined` explicito.
function omitUndefinedShallow(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) out[key] = value
  }
  return out
}

/**
 * Borrador en la nube de un registro en curso (new-log-form.tsx), por
 * usuario + residente + tipo de reporte. El id es determinista
 * (`${uid}_${residentId}_${reportType}`) para que solo pueda existir
 * un borrador a la vez por esa combinación — guardar de nuevo
 * simplemente sobreescribe el anterior.
 *
 * NO incluye fotos/blobs — eso se filtra en el llamador antes de
 * pasar `values` a saveDraft(), el hook no conoce el schema del
 * formulario.
 */
export function useLogDraft(residentId: string | undefined, reportType: "medico" | "suministro" | undefined) {
  const { user: authUser } = useAuth()
  const [status, setStatus] = useState<DraftSaveStatus>("idle")
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedJsonRef = useRef<string | null>(null)

  const draftId =
    authUser && residentId && reportType ? `${authUser.uid}_${residentId}_${reportType}` : null

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const loadDraft = useCallback(async (): Promise<LogDraftRecord | null> => {
    if (!draftId) return null
    try {
      const snap = await getDoc(doc(db, "logDrafts", draftId))
      if (!snap.exists()) return null
      const data = snap.data() as Record<string, any>
      return {
        values: data.values ?? {},
        shift: data.shiftDate && data.shiftType
          ? { shiftDate: data.shiftDate, shiftType: data.shiftType, entryTimeOfDay: data.entryTimeOfDay }
          : null,
        updatedAt: data.updatedAt?.toDate?.() ?? null,
      }
    } catch (error) {
      console.error("Error al cargar el borrador:", error)
      return null
    }
  }, [draftId])

  // Debounce de ~2s desde la ultima edicion; no vuelve a escribir si
  // el contenido es exactamente el mismo que el ultimo guardado.
  const saveDraft = useCallback(
    (values: Record<string, unknown>, shift: LogDraftShiftInfo) => {
      if (!draftId || !authUser || !residentId || !reportType) return

      const snapshot = JSON.stringify({ values, shift })
      if (snapshot === lastSavedJsonRef.current) return

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        setStatus("saving")
        try {
          const payload = omitUndefinedShallow({
            userId: authUser.uid,
            residentId,
            reportType,
            values: omitUndefinedShallow(values),
            shiftDate: shift.shiftDate,
            shiftType: shift.shiftType,
            entryTimeOfDay: shift.entryTimeOfDay,
            updatedAt: serverTimestamp(),
            expiresAt: Timestamp.fromDate(new Date(Date.now() + DRAFT_TTL_DAYS * 24 * 60 * 60 * 1000)),
          })

          await withTimeout(setDoc(doc(db, "logDrafts", draftId), payload), DRAFT_SAVE_TIMEOUT_MS)

          lastSavedJsonRef.current = snapshot
          setStatus("saved")
          setLastSavedAt(new Date())
        } catch (error) {
          console.error("Error al guardar el borrador:", error)
          // No distinguimos el motivo exacto (red vs. permisos) porque
          // el borrador es secundario: la UI solo necesita saber que
          // sigue intentando en segundo plano, no bloquear al usuario.
          setStatus("offline")
        }
      }, DEBOUNCE_MS)
    },
    [draftId, authUser, residentId, reportType]
  )

  const clearDraft = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    if (!draftId) return
    try {
      await deleteDoc(doc(db, "logDrafts", draftId))
    } catch (error) {
      // El borrador vencerá solo por expiresAt (TTL) si esto falla —
      // no es crítico bloquear ni reintentar el borrado.
      console.error("Error al borrar el borrador:", error)
    }
    lastSavedJsonRef.current = null
  }, [draftId])

  return { status, lastSavedAt, loadDraft, saveDraft, clearDraft }
}
