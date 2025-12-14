"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/hooks/use-auth"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { AppUser, Staff, UserRole, ROLE_PERMISSIONS } from "@/types/user"

// Mapa de permisos "abstractos" (los del menú) → permisos reales
const PERMISSION_ALIASES: Record<string, string[]> = {
  dashboard: ["view_agenda", "view_residents", "view_reports"],
  residents: ["view_residents", "manage_residents"],
  staff: ["view_staff", "manage_staff"],
  contracts: ["manage_settings"],
  visitors: ["view_residents"],
  logs: ["view_reports", "create_reports", "edit_reports"],
  reports: ["view_reports", "create_reports", "edit_reports"],
  settings: ["manage_settings"],
}

export function useUser() {
  const { user: authUser, isLoading: authLoading } = useAuth()
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true)
      return
    }

    if (!authUser?.email) {
      setAppUser(null)
      setIsLoading(false)
      return
    }

    let unsubscribe: (() => void) | null = null
    let cancelled = false

    const q = query(
      collection(db, "staff"),
      where("email", "==", authUser.email)
    )

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (cancelled) return

        if (snapshot.empty) {
          setAppUser(null)
          setIsLoading(false)
          return
        }

        // Si hay más de un doc con el mismo email, tomamos el primero.
        const doc = snapshot.docs[0]
        const data = doc.data()

        // Normalizar rol desde Firestore
        const rawRole = (data.role || "Personal de Cuidado") as string
        let normalizedRole: UserRole

        switch (rawRole) {
          case "Administrativo":
            normalizedRole = "Administrador"
            break
          case "Personal Asistencial":
            normalizedRole = "Personal de Cuidado"
            break
          default:
            normalizedRole = rawRole as UserRole
            break
        }

        // Permisos: si el doc no trae lista, usamos ROLE_PERMISSIONS por defecto
        const userPermissions: string[] =
          (Array.isArray(data.permissions) && data.permissions.length > 0
            ? data.permissions
            : ROLE_PERMISSIONS[normalizedRole]) || []

        const user: Staff = {
          id: doc.id,
          email: data.email,
          name: data.name || data.Name,
          role: normalizedRole,
          isActive: data.isActive ?? true,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.(),
          phone: data.phone || "",
          position: data.position,
          department: data.department,
          hireDate:
            data.hireDate?.toDate?.() ||
            (data.hireDate ? new Date(data.hireDate) : undefined),
          permissions: userPermissions,
        }

        setAppUser(user)
        setIsLoading(false)
      },
      (error) => {
        console.error("useUser: error leyendo staff:", error)
        if (!cancelled) {
          setAppUser(null)
          setIsLoading(false)
        }
      }
    )

    return () => {
      cancelled = true
      if (unsubscribe) unsubscribe()
    }
  }, [authUser, authLoading])

  const role = useMemo<UserRole | null>(() => {
    return appUser?.role ?? null
  }, [appUser])

  const hasPermission = (permissionKey: string): boolean => {
    if (!role) return false

    // Admin todo acceso
    if (role === "Administrador") return true

    if (!appUser || !("permissions" in appUser)) return false

    const userPermissions = (appUser as Staff).permissions || []

    // Clave del menú → lista de permisos reales
    const mappedPermissions = PERMISSION_ALIASES[permissionKey] || [permissionKey]

    const hasAllModules = userPermissions.includes("access_all_modules")
    const hasAnyMapped = mappedPermissions.some((p) =>
      userPermissions.includes(p)
    )

    return hasAllModules || hasAnyMapped
  }

  return {
    user: appUser,
    role,
    isLoading,
    hasPermission,
  }
}
