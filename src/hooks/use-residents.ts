"use client"

import { useState, useEffect, useCallback } from "react"
import { db } from "@/lib/firebase"
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore"

// ==============================
// TIPOS (sin cambios)
// ==============================

type PhoneContact = { number: string }

type FamilyContact = {
  name: string
  kinship: string
  address: string
  phones: PhoneContact[]
  email: string
}

type Medication = { name: string; dose: string; frequency: string }

type ResidentDocument = {
  type: string
  name: string
  size: number
}

export type DischargeDetails = {
  dischargeDate: string
  reason: "Traslado" | "Regreso a casa" | "Fallecimiento"
  observations?: string
}

export type AgendaEvent = {
  id: string
  date: string
  type: "Cita Médica" | "Gestión Personal" | "Otro"
  title: string
  description?: string
  status: "Pendiente" | "Completado" | "Cancelado"
}

export type Visit = {
  id: string
  visitorName: string
  visitorIdNumber: string
  kinship: string
  visitDate: string
  notes?: string
}

export type Resident = {
  id: string
  name: string
  age: number
  dob: string
  idNumber: string
  gender?: "Femenino" | "Masculino" | "Otro"
  medicalHistory?: string[]
  surgicalHistory?: string[]
  allergies?: string[]
  dependency: "Dependiente" | "Independiente"
  status: "Activo" | "Inactivo"
  admissionDate: string
  roomType: "Habitación compartida" | "Habitación individual"
  roomNumber?: string
  bloodType?: string
  fallRisk?: "Bajo" | "Medio" | "Alto"
  familyContacts?: FamilyContact[]
  medications?: Medication[]
  diet?: string
  documents?: ResidentDocument[]
  dischargeDetails?: DischargeDetails
  agendaEvents?: AgendaEvent[]
  visits?: Visit[]
}

// ==============================
// HOOK
// ==============================

export function useResidents() {
  const [residents, setResidents] = useState<Resident[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return

    let isMounted = true

    setIsLoading(true)

    const residentsColRef = collection(db, "residents")

    const unsubscribe = onSnapshot(
      residentsColRef,
      (snapshot) => {
        if (!isMounted) return

        const data = snapshot.docs.map(
          (docSnap) =>
            ({
              id: docSnap.id,
              ...docSnap.data(),
            } as Resident)
        )

        setResidents(data)
        setIsLoading(false)
      },
      (error) => {
        console.error("❌ useResidents: error al obtener residentes:", error)
        if (!isMounted) return
        setResidents([])
        setIsLoading(false)
      }
    )

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  // ==============================
  // ACCIONES
  // ==============================

  const addResident = useCallback(
    async (newResident: Omit<Resident, "id">) => {
      const colRef = collection(db, "residents")
      await addDoc(colRef, newResident)
    },
    []
  )

  const updateResident = useCallback(
    async (residentId: string, updated: Partial<Omit<Resident, "id">>) => {
      const residentDoc = doc(db, "residents", residentId)
      await updateDoc(residentDoc, updated)
    },
    []
  )

  const dischargeResident = useCallback(
    async (residentId: string, dischargeDetails: DischargeDetails) => {
      await updateResident(residentId, {
        status: "Inactivo",
        dischargeDetails,
      })
    },
    [updateResident]
  )

  const addAgendaEvent = useCallback(
    async (residentId: string, data: Omit<AgendaEvent, "id">) => {
      // Obtener datos frescos de Firestore en lugar del estado
      const residentDoc = doc(db, "residents", residentId)
      const residentSnap = await getDoc(residentDoc)

      if (!residentSnap.exists()) return

      const resident = residentSnap.data() as Resident

      await updateResident(residentId, {
        agendaEvents: [
          ...(resident.agendaEvents || []),
          { ...data, id: `evt-${Date.now()}` },
        ],
      })
    },
    [updateResident]
  )

  const updateAgendaEvent = useCallback(
    async (
      residentId: string,
      eventId: string,
      partial: Partial<AgendaEvent>
    ) => {
      // Obtener datos frescos de Firestore en lugar del estado
      const residentDoc = doc(db, "residents", residentId)
      const residentSnap = await getDoc(residentDoc)

      if (!residentSnap.exists()) return

      const resident = residentSnap.data() as Resident

      const updated = (resident.agendaEvents || []).map((ev) =>
        ev.id === eventId ? { ...ev, ...partial } : ev
      )

      await updateResident(residentId, { agendaEvents: updated })
    },
    [updateResident]
  )

  const deleteAgendaEvent = useCallback(
    async (residentId: string, eventId: string) => {
      // Obtener datos frescos de Firestore en lugar del estado
      const residentDoc = doc(db, "residents", residentId)
      const residentSnap = await getDoc(residentDoc)

      if (!residentSnap.exists()) return

      const resident = residentSnap.data() as Resident

      const updated = (resident.agendaEvents || []).filter(
        (ev) => ev.id !== eventId
      )

      await updateResident(residentId, { agendaEvents: updated })
    },
    [updateResident]
  )

  const addVisit = useCallback(
    async (residentId: string, visitData: Omit<Visit, "id" | "visitDate">) => {
      // Obtener datos frescos de Firestore en lugar del estado
      const residentDoc = doc(db, "residents", residentId)
      const residentSnap = await getDoc(residentDoc)

      if (!residentSnap.exists()) return

      const resident = residentSnap.data() as Resident

      const updated = [
        ...(resident.visits || []),
        {
          ...visitData,
          id: `visit-${Date.now()}`,
          visitDate: new Date().toISOString(),
        },
      ]

      await updateResident(residentId, { visits: updated })
    },
    [updateResident]
  )

  return {
    residents,
    isLoading,
    addResident,
    updateResident,
    dischargeResident,
    addAgendaEvent,
    updateAgendaEvent,
    deleteAgendaEvent,
    addVisit,
  }
}
