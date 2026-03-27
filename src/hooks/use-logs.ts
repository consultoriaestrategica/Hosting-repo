"use client"

import { useEffect, useState, useCallback } from "react"
import { db, auth } from "@/lib/firebase"
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  Timestamp,
  serverTimestamp,
  arrayUnion,
  orderBy,
  limit,
} from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

// =====================================================
// TIPOS
// =====================================================

export type EvolutionEntry = {
  id: string
  createdAt: string
  createdTimeLabel: string
  professionalName?: string
  visitType?: string
  note: string
  heartRate?: number
  respiratoryRate?: number
  spo2?: number
  bloodPressureSys?: number
  bloodPressureDia?: number
  temperature?: number
}

export type BaseLog = {
  id: string
  residentId: string
  startDate: string
  endDate: string
  reportType: "medico" | "suministro"
  notes?: string
  createdAt?: Date | null
  updatedAt?: Date | null
}

export type MedicalLogFields = {
  reportType: "medico"
  heartRate?: number
  respiratoryRate?: number
  spo2?: number
  feedingType?: string
  visitType?: string
  professionalName?: string
  evolutionNotes?: string[]
  photoEvidence?: any[]
  finalComment?: string
  pendingTasks?: string
  evolutionEntries?: EvolutionEntry[]
}

export type SupplyLogFields = {
  reportType: "suministro"
  supplierName?: string
  supplyDate?: string
  supplyDescription?: string
  supplyNotes?: string
  supplyPhotoEvidence?: any[]
}

export type Log = BaseLog & (MedicalLogFields | SupplyLogFields)

export type NewLogInput = Omit<Log, "id" | "createdAt" | "updatedAt">

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function useLogs() {
  const [logs, setLogs] = useState<Log[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    let unsubSnapshot: (() => void) | null = null

    // ========================================================
    // FIX: Esperar autenticación antes de suscribirse.
    // Además, usar orderBy + limit para evitar cargar TODOS
    // los logs de golpe (mejora de performance).
    // ========================================================
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // Limpiar suscripción anterior
      if (unsubSnapshot) {
        unsubSnapshot()
        unsubSnapshot = null
      }

      if (!user) {
        setLogs([])
        setIsLoading(false)
        setError(null)
        return
      }

      setIsLoading(true)
      const logsColRef = collection(db, "logs")

      // Limitar a los últimos 200 logs para evitar congelamiento
      // con colecciones grandes. Si necesitas más, implementar paginación.
      const q = query(logsColRef, orderBy("endDate", "desc"), limit(200))

      unsubSnapshot = onSnapshot(
        q,
        (snapshot) => {
          const data: Log[] = snapshot.docs.map((docSnap) => {
            const raw = docSnap.data() as any
            return {
              id: docSnap.id,
              ...raw,
              createdAt: raw.createdAt?.toDate?.() ?? null,
              updatedAt: raw.updatedAt?.toDate?.() ?? null,
            } as Log
          })

          // Ya viene ordenado por Firestore, no necesitamos sort en cliente
          setLogs(data)
          setIsLoading(false)
          setError(null)
        },
        (err) => {
          console.error("❌ useLogs: error al obtener logs:", err)
          setError("Error al cargar los registros")
          setIsLoading(false)
        }
      )
    })

    return () => {
      unsubAuth()
      if (unsubSnapshot) unsubSnapshot()
    }
  }, [])

  // -------------------------------------------------
  // Crear un nuevo LOG
  // -------------------------------------------------
  const addLog = useCallback(async (data: NewLogInput) => {
    const now = new Date()
    const logsColRef = collection(db, "logs")
    const payload = {
      ...data,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    }
    await addDoc(logsColRef, payload)
  }, [])

  // -------------------------------------------------
  // Agregar una EVOLUCIÓN PARCIAL a un log médico
  // -------------------------------------------------
  const addEvolutionEntry = useCallback(
    async (logId: string, entry: EvolutionEntry) => {
      const ref = doc(db, "logs", logId)
      try {
        await updateDoc(ref, {
          evolutionEntries: arrayUnion(entry),
          endDate: entry.createdAt,
          updatedAt: serverTimestamp(),
        })
      } catch (error) {
        console.error("Error al guardar evolución:", error)
        throw error
      }
    },
    []
  )

  return {
    logs,
    isLoading,
    error,
    addLog,
    addEvolutionEntry,
  }
}