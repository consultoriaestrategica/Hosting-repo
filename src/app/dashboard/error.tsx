"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RotateCw, Home } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

// Error Boundary de Next.js para todo el segmento /dashboard.
//
// Sin esto, cualquier excepción de render dentro del panel (por ejemplo
// un documento de Firestore con una forma inesperada) dejaba al usuario
// con una pantalla en blanco sin ninguna forma de recuperarse — el
// layout (sidebar/nav) sigue renderizando alrededor de este boundary,
// así que la navegación queda disponible incluso si una pantalla falla.
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("❌ Error no controlado en el panel:", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <CardTitle>Algo salió mal</CardTitle>
          <CardDescription>
            Ocurrió un error inesperado al cargar esta pantalla. Puedes
            intentar de nuevo o volver al panel principal.
          </CardDescription>
        </CardHeader>
        {error.digest && (
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Código de referencia: {error.digest}
            </p>
          </CardContent>
        )}
        <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Volver al panel
            </Link>
          </Button>
          <Button onClick={() => reset()} className="w-full sm:w-auto">
            <RotateCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
