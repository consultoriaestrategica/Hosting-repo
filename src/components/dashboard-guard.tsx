"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRequireRole } from "@/hooks/use-require-role"
import { useToast } from "@/hooks/use-toast"

/**
 * Guard único para todo /dashboard. Se aplica en app/dashboard/layout.tsx
 * y por lo tanto protege automáticamente cualquier ruta nueva bajo
 * /dashboard sin necesidad de envolverla individualmente.
 */
export default function DashboardGuard({ children }: { children: React.ReactNode }) {
  const status = useRequireRole("staff")
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
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-background"></div>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold text-foreground">Verificando sesión...</p>
          <p className="text-sm text-muted-foreground">Por favor espera un momento</p>
        </div>
      </div>
    </div>
  )
}
