"use client"

import { useEffect, useState, useCallback } from "react"
import { db } from "@/lib/firebase"
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
} from "firebase/firestore"

// =====================================================
// TIPOS
// =====================================================

export type EvolutionEntry = {
  id: string
  createdAt: string          // ISO (fecha y hora exacta)
  createdTimeLabel: string   // ej: "10:15"
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
  startDate: string          // ISO
  endDate: string            // ISO
  reportType: "medico" | "suministro"
  notes?: string
  createdAt?: Date | null
  updatedAt?: Date | null
}

// Campos específicos para registros médicos
export type MedicalLogFields = {
  reportType: "medico"
  heartRate?: number
  respiratoryRate?: number
  spo2?: number
  feedingType?: string
  visitType?: string
  professionalName?: string
  evolutionNotes?: string[]       // compatibilidad hacia atrás
  photoEvidence?: any[]
  finalComment?: string
  pendingTasks?: string
  // NUEVO: lista de evoluciones parciales
  evolutionEntries?: EvolutionEntry[]
}

// Campos específicos para registros de suministro
export type SupplyLogFields = {
  reportType: "suministro"
  supplierName?: string
  supplyDate?: string
  supplyDescription?: string
  supplyNotes?: string
  supplyPhotoEvidence?: any[]
}

export type Log = BaseLog & (MedicalLogFields | SupplyLogFields)

// Tipo para crear un nuevo log
export type NewLogInput = Omit<Log, "id" | "createdAt" | "updatedAt">

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function useLogs() {
  const [logs, setLogs] = useState<Log[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Evitar correr en el servidor / durante el render inicial de Next
    if (typeof window === "undefined") return

    setIsLoading(true)
    let isMounted = true

    const logsColRef = collection(db, "logs")
    const q = query(logsColRef)

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!isMounted) return

        const data: Log[] = snapshot.docs.map((docSnap) => {
          const raw = docSnap.data() as any

          return {
            id: docSnap.id,
            ...raw,
            createdAt: raw.createdAt?.toDate?.() ?? null,
            updatedAt: raw.updatedAt?.toDate?.() ?? null,
          } as Log
        })

        // Ordenamos por fecha de fin descendente (más reciente primero)
        data.sort(
          (a, b) =>
            new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
        )

        setLogs(data)
        setIsLoading(false)
        setError(null)
      },
      (err) => {
        console.error("❌ useLogs: error al obtener logs:", err)
        if (!isMounted) return
        setError("Error al cargar los registros")
        setIsLoading(false)
      }
    )

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  // -------------------------------------------------
  // Crear un nuevo LOG (registro diario / suministro)
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
  // NUEVO: agregar una EVOLUCIÓN PARCIAL a un log médico
  // -------------------------------------------------
  const addEvolutionEntry = useCallback(
    async (logId: string, entry: EvolutionEntry) => {
      const ref = doc(db, "logs", logId)

      await updateDoc(ref, {
        evolutionEntries: arrayUnion(entry),
        endDate: entry.createdAt, // actualizamos última hora de evolución
        updatedAt: serverTimestamp(),
      })
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
