"use client"

import { useState, useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, onSnapshot } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

/**
 * Rol del usuario autenticado, resuelto desde user_roles/{uid}.
 *
 * Existe porque las Firestore Security Rules solo pueden leer un
 * documento por su path exacto (nunca con un `where(email == ...)`
 * como el resto de la app) — este es el único lugar donde
 * "¿quién soy y qué puedo ver?" se puede resolver de forma segura
 * tanto en el cliente como en las rules.
 */
export type MyRole =
  | { kind: "staff"; role: string | null; staffDocId: string }
  | { kind: "family"; residentId: string; familyDocId: string }

export function useMyRole() {
  const [myRole, setMyRole] = useState<MyRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let unsubSnapshot: (() => void) | null = null

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubSnapshot) {
        unsubSnapshot()
        unsubSnapshot = null
      }

      if (!user) {
        setMyRole(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      unsubSnapshot = onSnapshot(
        doc(db, "user_roles", user.uid),
        (snap) => {
          setMyRole(snap.exists() ? (snap.data() as MyRole) : null)
          setIsLoading(false)
        },
        (error) => {
          console.error("useMyRole: error leyendo user_roles:", error)
          setMyRole(null)
          setIsLoading(false)
        }
      )
    })

    return () => {
      unsubAuth()
      if (unsubSnapshot) unsubSnapshot()
    }
  }, [])

  return { myRole, isLoading }
}
