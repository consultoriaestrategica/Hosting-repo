
"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth" // Importar el hook de autenticación

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { user, isLoading: authLoading } = useAuth(); // Usar el hook de auth

  // Redirigir si el usuario ya está logueado
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast({
        title: "Inicio de Sesión Exitoso",
        description: "Bienvenido de nuevo.",
      })
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Error signing in:", error)
      let description = "Ocurrió un error inesperado. Por favor, intente de nuevo."
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          description = "Las credenciales son incorrectas. Verifique su correo y contraseña."
      } else if (error.code === 'auth/invalid-email') {
          description = "El formato del correo electrónico no es válido."
      }
      
      toast({
        variant: "destructive",
        title: "Error al Iniciar Sesión",
        description,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // No mostrar el formulario si estamos comprobando el estado de auth
  if (authLoading) {
      return (
        <div className="flex h-screen w-full items-center justify-center">
            Cargando...
        </div>
    );
  }

  // No mostrar el formulario si el usuario ya está logueado y se va a redirigir
  if (user) {
      return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold font-headline">
            Ángel Guardián
          </CardTitle>
          <CardDescription>
            Inicie sesión para acceder al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="ejemplo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-xs text-muted-foreground">
          <p>Sistema de gestión para hogares geriátricos.</p>
        </CardFooter>
      </Card>
    </main>
  )
}
