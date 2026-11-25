"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, Timestamp } from "firebase/firestore"
import { useAuth } from "@/hooks/use-auth"

// Mismas constantes y mismo patrón que use-log-draft.ts (debounce,
// timeout de guardado, TTL) — ver ese archivo para el razonamiento
// completo de cada una.
const DEBOUNCE_MS = 2_000
const DRAFT_SAVE_TIMEOUT_MS = 5_000
const DRAFT_TTL_DAYS = 7

export type DraftSaveStatus = "idle" | "saving" | "saved" | "offline" | "error"

export interface ResidentDraftRecord {
  values: Record<string, unknown>
  activeTab: string | null
  // updatedAt del residente capturado al EMPEZAR el borrador de
  // edición (null en modo create, o si el residente nunca se había
  // actualizado) — se compara contra el updatedAt actual del
  // residente al reabrir el formulario para avisar si alguien más lo
  // modificó mientras tanto. Se preserva igual mientras el borrador
  // siga vivo (no se recaptura en cada autoguardado).
  residentUpdatedAtSnapshot: string | null
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

function omitUndefinedShallow(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) out[key] = value
  }
  return out
}

/**
 * Borrador en la nube de resident-form.tsx, por usuario + caso
 * (alta nueva o edición de un residente puntual). El id es
 * determinista: `${uid}_new` en modo create, `${uid}_${residentId}`
 * en modo edit — solo puede existir un borrador a la vez por caso.
 *
 * NO incluye archivos/blobs — eso se filtra en el llamador (los
 * documentos adjuntados viven en estado aparte en resident-form.tsx,
 * fuera de los valores del formulario, así que nunca llegan aquí).
 */
export function useResidentDraft(mode: "create" | "edit", residentId: string | undefined) {
  const { user: authUser } = useAuth()
  const [status, setStatus] = useState<DraftSaveStatus>("idle")
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedJsonRef = useRef<string | null>(null)

  const draftId =
    authUser && (mode === "create" || residentId)
      ? `${authUser.uid}_${mode === "create" ? "new" : residentId}`
      : null

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const loadDraft = useCallback(async (): Promise<ResidentDraftRecord | null> => {
    if (!draftId) return null
    try {
      const snap = await getDoc(doc(db, "residentDrafts", draftId))
      if (!snap.exists()) return null
      const data = snap.data() as Record<string, any>
      return {
        values: data.values ?? {},
        activeTab: data.activeTab ?? null,
        residentUpdatedAtSnapshot: data.residentUpdatedAtSnapshot ?? null,
        updatedAt: data.updatedAt?.toDate?.() ?? null,
      }
    } catch (error) {
      console.error("Error al cargar el borrador del residente:", error)
      return null
    }
  }, [draftId])

  // Debounce de ~2s desde la última edición; no vuelve a escribir si
  // el contenido es exactamente el mismo que el último guardado.
  const saveDraft = useCallback(
    (values: Record<string, unknown>, activeTab: string, residentUpdatedAtSnapshot: string | null) => {
      if (!draftId || !authUser) return

      const snapshot = JSON.stringify({ values, activeTab, residentUpdatedAtSnapshot })
      if (snapshot === lastSavedJsonRef.current) return

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        setStatus("saving")
        try {
          const payload = omitUndefinedShallow({
            userId: authUser.uid,
            mode,
            residentId: mode === "edit" ? residentId : undefined,
            values: omitUndefinedShallow(values),
            activeTab,
            residentUpdatedAtSnapshot,
            updatedAt: serverTimestamp(),
            expiresAt: Timestamp.fromDate(new Date(Date.now() + DRAFT_TTL_DAYS * 24 * 60 * 60 * 1000)),
          })

          await withTimeout(setDoc(doc(db, "residentDrafts", draftId), payload), DRAFT_SAVE_TIMEOUT_MS)

          lastSavedJsonRef.current = snapshot
          setStatus("saved")
          setLastSavedAt(new Date())
        } catch (error) {
          console.error("Error al guardar el borrador del residente:", error)
          setStatus("offline")
        }
      }, DEBOUNCE_MS)
    },
    [draftId, authUser, mode, residentId]
  )

  const clearDraft = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    if (!draftId) return
    try {
      await deleteDoc(doc(db, "residentDrafts", draftId))
    } catch (error) {
      console.error("Error al borrar el borrador del residente:", error)
    }
    lastSavedJsonRef.current = null
  }, [draftId])

  return { status, lastSavedAt, loadDraft, saveDraft, clearDraft }
}
