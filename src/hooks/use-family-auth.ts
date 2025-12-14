// src/hooks/use-family-auth.ts
"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./use-auth" // si este hook existe como cliente
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { FamilyMember } from "@/types/user"

/**
 * Hook de autenticación para familiares
 */
export function useFamilyAuth() {
  const { user: authUser, isLoading: authLoading } = useAuth()
  const [familyMember, setFamilyMember] = useState<FamilyMember | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log("👨‍👩‍👧 useFamilyAuth: Effect ejecutado", {
      authUserEmail: authUser?.email,
      authLoading,
    })

    if (authLoading) {
      console.log("⏳ useFamilyAuth: Esperando autenticación...")
      setIsLoading(true)
      return
    }

    if (!authUser?.email) {
      console.log("⚠️ useFamilyAuth: No hay usuario autenticado")
      setFamilyMember(null)
      setIsLoading(false)
      return
    }

    console.log("🔍 useFamilyAuth: Configurando listener para:", authUser.email)
    setIsLoading(true)

    const q = query(
      collection(db, "family_members"),
      where("email", "==", authUser.email)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log(
          "📡 useFamilyAuth: Snapshot recibido, docs:",
          snapshot.size
        )

        if (!snapshot.empty) {
          const doc = snapshot.docs[0]
          const data = doc.data()

          console.log("✅ useFamilyAuth: Familiar encontrado:", {
            id: doc.id,
            email: data.email,
            name: data.name,
            residentId: data.residentId,
          })

          const member: FamilyMember = {
            id: doc.id,
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
        } else {
          console.log("⚠️ useFamilyAuth: No se encontró en family_members")
          setFamilyMember(null)
          setIsLoading(false)
        }
      },
      (error) => {
        console.error("❌ useFamilyAuth: Error en snapshot:", error)
        setFamilyMember(null)
        setIsLoading(false)
      }
    )

    return () => {
      console.log("🧹 useFamilyAuth: Limpiando listener")
      unsubscribe()
    }
  }, [authUser, authLoading])

  return {
    familyMember,
    isLoading,
    isFamily: !!familyMember,
  }
}
