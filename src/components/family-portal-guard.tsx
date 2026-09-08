"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRequireRole } from "@/hooks/use-require-role"
import { useToast } from "@/hooks/use-toast"

/**
 * Guard único para todo /family-portal. Mismo mecanismo que
 * DashboardGuard (useRequireRole), pero exige kind === "family" y
 * usa la estética propia del portal familiar.
 */
export default function FamilyPortalGuard({ children }: { children: React.ReactNode }) {
  const status = useRequireRole("family")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (status === "no-session") {
      router.replace("/login")
    } else if (status === "wrong-role") {
      signOut(auth).finally(() => {
        toast({
          variant: "destructive",
          title: "Cuenta sin rol asignado",
          description:
            "Tu cuenta no tiene un rol asignado en el sistema. Contacta al administrador para que la habilite.",
        })
        router.replace("/login")
      })
    }
  }, [status, router, toast])

  if (status === "ok") {
    return <>{children}</>
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Verificando acceso...</p>
      </div>
    </div>
  )
}
