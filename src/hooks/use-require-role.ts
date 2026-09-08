"use client"

import { useAuth } from "./use-auth"
import { useMyRole } from "./use-my-role"

export type RequireRoleStatus = "loading" | "ok" | "no-session" | "wrong-role"

/**
 * Verifica sesión + rol real (user_roles/{uid}) para un tipo de
 * acceso ("staff" o "family"). Es el núcleo compartido por
 * DashboardGuard y FamilyPortalGuard: mismo mecanismo de
 * autorización, cada guard decide qué hacer visualmente con cada
 * estado.
 */
export function useRequireRole(kind: "staff" | "family"): RequireRoleStatus {
  const { user, isLoading: authLoading } = useAuth()
  const { myRole, isLoading: roleLoading } = useMyRole()

  if (authLoading || roleLoading) return "loading"
  if (!user) return "no-session"
  if (!myRole || myRole.kind !== kind) return "wrong-role"
  return "ok"
}
