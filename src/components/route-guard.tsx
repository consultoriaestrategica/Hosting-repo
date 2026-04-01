"use client"

import { useUser } from "@/hooks/use-user"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface RouteGuardProps {
  children: React.ReactNode
  permission: string
  fallbackUrl?: string
}

export default function RouteGuard({ children, permission, fallbackUrl = "/dashboard" }: RouteGuardProps) {
  const { hasPermission, isLoading, user } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user && !hasPermission(permission)) {
      router.replace(fallbackUrl)
    }
  }, [isLoading, user, permission, hasPermission, router, fallbackUrl])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  if (!user || !hasPermission(permission)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-destructive/10 p-4 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-6V4" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold">Acceso restringido</h2>
        <p className="text-sm text-muted-foreground mt-1">No tienes permisos para acceder a esta sección.</p>
      </div>
    )
  }

  return <>{children}</>
}
