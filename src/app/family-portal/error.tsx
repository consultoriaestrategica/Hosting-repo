"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"

// Error Boundary de Next.js para todo el segmento /family-portal.
// Mismo propósito que dashboard/error.tsx (ver ese archivo para el
// detalle), con un mensaje más simple pensado para familiares, sin
// jerga técnica ni código de referencia visible.
export default function FamilyPortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("❌ Error no controlado en el portal familiar:", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <CardTitle>No pudimos cargar esta página</CardTitle>
          <CardDescription>
            Ocurrió un problema inesperado. Por favor, intenta de nuevo; si
            el problema continúa, comunícate con el hogar geriátrico.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => reset()} className="w-full">
            <RotateCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
