// src/hooks/auth/use-family-data.ts
"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { FamilyMember } from "@/types/user"
import { collection, query, where, onSnapshot } from "firebase/firestore"

export function useFamilyData(email?: string | null) {
  const [familyMember, setFamilyMember] = useState<FamilyMember | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!email) {
      setFamilyMember(null)
      return
    }

    setLoading(true)

    const q = query(
      collection(db, "family_members"),
      where("email", "==", email)
    )

    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0]
        const data = doc.data()

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
      } else {
        setFamilyMember(null)
      }

      setLoading(false)
    })

    return () => unsub()
  }, [email])

  return { familyMember, loading }
}
