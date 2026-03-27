"use client"

import { useState, useEffect, useCallback } from "react"
import { db, auth } from "@/lib/firebase"
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { Staff } from "@/types/user"

export function useStaff() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    let unsubSnapshot: (() => void) | null = null

    // FIX: Esperar autenticación antes de suscribirse
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubSnapshot) {
        unsubSnapshot()
        unsubSnapshot = null
      }

      if (!user) {
        setStaff([])
        setIsLoading(false)
        setError(null)
        return
      }

      setIsLoading(true)
      const staffColRef = collection(db, "staff")
      const staffQuery = query(staffColRef)

      unsubSnapshot = onSnapshot(
        staffQuery,
        (querySnapshot) => {
          const staffData: Staff[] = querySnapshot.docs.map((snap) => {
            const data = snap.data() as any
            return {
              id: snap.id,
              ...data,
              isActive: data.isActive ?? true,
              hireDate: data.hireDate?.toDate
                ? data.hireDate.toDate()
                : data.hireDate
                ? new Date(data.hireDate)
                : undefined,
              createdAt: data.createdAt?.toDate
                ? data.createdAt.toDate()
                : new Date(),
              updatedAt: data.updatedAt?.toDate
                ? data.updatedAt.toDate()
                : undefined,
            } as Staff
          })

          setStaff(staffData)
          setIsLoading(false)
          setError(null)
        },
        (err) => {
          console.error("❌ useStaff: error al cargar personal:", err)
          setError("Error al cargar el personal")
          setIsLoading(false)
        }
      )
    })

    return () => {
      unsubAuth()
      if (unsubSnapshot) unsubSnapshot()
    }
  }, [])

  const addStaffMember = useCallback(
    async (
      staffData: Omit<Staff, "id" | "createdAt" | "updatedAt">
    ): Promise<Staff> => {
      try {
        const now = new Date()
        const staffColRef = collection(db, "staff")

        const docRef = await addDoc(staffColRef, {
          ...staffData,
          isActive: staffData.isActive ?? true,
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now),
        })

        return {
          id: docRef.id,
          ...staffData,
          isActive: staffData.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        } as Staff
      } catch (error) {
        console.error("❌ useStaff: error al agregar personal:", error)
        throw error
      }
    },
    []
  )

  const updateStaffMember = useCallback(
    async (id: string, updates: Partial<Omit<Staff, "id" | "createdAt">>) => {
      try {
        const staffDocRef = doc(db, "staff", id)
        const now = new Date()

        const updateData: any = {
          ...updates,
          updatedAt: Timestamp.fromDate(now),
        }

        await updateDoc(staffDocRef, updateData)
      } catch (error) {
        console.error("❌ useStaff: error al actualizar personal:", error)
        throw error
      }
    },
    []
  )

  return {
    staff,
    isLoading,
    error,
    addStaffMember,
    updateStaffMember,
  }
}

export type { Staff } from "@/types/user"