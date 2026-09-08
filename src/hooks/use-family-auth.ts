// src/hooks/use-family-auth.ts
"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./use-auth" // si este hook existe como cliente
import { db } from "@/lib/firebase"
import { doc, onSnapshot } from "firebase/firestore"
import { FamilyMember } from "@/types/user"
import type { MyRole } from "./use-my-role"

/**
 * Hook de autenticación para familiares
 *
 * Resuelve primero user_roles/{uid} (lo único que las Firestore Rules
 * garantizan que el usuario puede leer siempre) para obtener el
 * familyDocId, y recién ahí suscribe al documento real de
 * family_members — ya no se puede consultar por email como antes,
 * porque las rules exigen ya ser "family" para leer esa colección.
 */
export function useFamilyAuth() {
  const { user: authUser, isLoading: authLoading } = useAuth()
  const [familyMember, setFamilyMember] = useState<FamilyMember | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true)
      return
    }

    if (!authUser) {
      setFamilyMember(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    let unsubscribeFamilyDoc: (() => void) | null = null

    const unsubscribeRole = onSnapshot(
      doc(db, "user_roles", authUser.uid),
      (roleSnap) => {
        if (unsubscribeFamilyDoc) {
          unsubscribeFamilyDoc()
          unsubscribeFamilyDoc = null
        }

        if (!roleSnap.exists() || (roleSnap.data() as MyRole).kind !== "family") {
          setFamilyMember(null)
          setIsLoading(false)
          return
        }

        const role = roleSnap.data() as Extract<MyRole, { kind: "family" }>

        unsubscribeFamilyDoc = onSnapshot(
          doc(db, "family_members", role.familyDocId),
          (docSnap) => {
            if (!docSnap.exists()) {
              setFamilyMember(null)
              setIsLoading(false)
              return
            }

            const data = docSnap.data()
            const member: FamilyMember = {
              id: docSnap.id,
              email: data.email,
              name: data.name,
              role: "Acceso Familiar",
              residentId: data.residentId,
              residentName: data.residentName,
              relationship: data.relationship,
              phone: data.phone,
              isActive: data.isActive ?? true,
              createdAt: data.createdAt?.toDate?.() || new Date(),
              updatedAt: data.updatedAt?.toDate?.(),
              emergencyContact: data.emergencyContact ?? false,
              visitingHours: data.visitingHours,
            }

            setFamilyMember(member)
            setIsLoading(false)
          },
          (error) => {
            console.error("❌ useFamilyAuth: Error leyendo family_members:", error)
            setFamilyMember(null)
            setIsLoading(false)
          }
        )
      },
      (error) => {
        console.error("❌ useFamilyAuth: Error leyendo user_roles:", error)
        setFamilyMember(null)
        setIsLoading(false)
      }
    )

    return () => {
      unsubscribeRole()
      if (unsubscribeFamilyDoc) unsubscribeFamilyDoc()
    }
  }, [authUser, authLoading])

  return {
    familyMember,
    isLoading,
    isFamily: !!familyMember,
  }
}
