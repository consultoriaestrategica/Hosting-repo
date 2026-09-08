"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { signInWithEmailAndPassword, signOut } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useFamilyMembers } from "@/hooks/use-family-members"
import { Eye, EyeOff, Users, Heart, Loader2 } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import type { MyRole } from "@/hooks/use-my-role"

/**
 * Página de Login Dual
 *
 * - Personal (staff/admin)  → /dashboard
 * - Familiares              → /family-portal
 */

type StaffCheckResult =
  | { kind: "staff" }
  | { kind: "family" }
  | { kind: "unknown" }

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { signInFamilyMember } = useFamilyMembers()

  // ============================================
  // Estado para Login de Personal
  // ============================================
  const [staffEmail, setStaffEmail] = useState("")
  const [staffPassword, setStaffPassword] = useState("")
  const [staffShowPassword, setStaffShowPassword] = useState(false)
  const [staffLoading, setStaffLoading] = useState(false)

  // ============================================
  // Estado para Login de Familiares
  // ============================================
  const [familyEmail, setFamilyEmail] = useState("")
  const [familyPassword, setFamilyPassword] = useState("")
  const [familyShowPassword, setFamilyShowPassword] = useState(false)
  const [familyLoading, setFamilyLoading] = useState(false)

  // Determina el rol leyendo user_roles/{uid} — el único documento que
  // las Firestore Security Rules garantizan que el usuario recién
  // autenticado puede leer siempre, sea cual sea su rol (o si no tiene
  // ninguno todavía). NO se puede volver a consultar "staff"/"family_
  // members" por email aquí: las rules ya exigen tener un rol válido
  // para leer esas colecciones, así que esta sería la única forma de
  // determinarlo sin quedar en un círculo imposible de resolver.
  const checkStaffRecord = async (uid: string): Promise<StaffCheckResult> => {
    const roleSnap = await getDoc(doc(db, "user_roles", uid))

    if (!roleSnap.exists()) {
      return { kind: "unknown" }
    }

    const role = roleSnap.data() as MyRole
    return role.kind === "staff" ? { kind: "staff" } : { kind: "family" }
  }

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!staffEmail || !staffPassword) {
      toast({
        variant: "destructive",
        title: "Campos requeridos",
        description: "Por favor ingrese correo y contraseña.",
      })
      return
    }

    setStaffLoading(true)
    console.log("🔐 Iniciando login de staff:", staffEmail)

    try {
      const cred = await signInWithEmailAndPassword(auth, staffEmail.trim(), staffPassword)

      const roleCheck = await checkStaffRecord(cred.user.uid)

      if (roleCheck.kind === "staff") {
        toast({
          title: "Inicio de sesión exitoso",
          description: "Bienvenido al sistema HOGAR SAN JUAN",
        })
        router.push("/dashboard")
        return
      }

      // "family" o "unknown": esta cuenta no tiene un rol de personal
      // válido. Antes esto se dejaba pasar igual como "administrativo
      // heredado" — eso era la vulnerabilidad de fail-open que se
      // corrigió acá. Ahora se niega el acceso siempre.
      await signOut(auth)

      if (roleCheck.kind === "family") {
        toast({
          variant: "destructive",
          title: "Acceso no autorizado",
          description:
            "Esta cuenta está registrada como acceso familiar. Use la pestaña 'Familiares' para ingresar.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Cuenta sin rol asignado",
          description:
            "Tu cuenta no tiene un rol asignado en el sistema. Contacta al administrador para que la habilite.",
        })
      }
    } catch (error: any) {
      console.error("❌ Error en login de staff:", error)

      let errorMessage = "Correo o contraseña incorrectos"

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/invalid-email"
      ) {
        errorMessage = "Credenciales inválidas. Verifique su usuario y contraseña."
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "Usuario no encontrado."
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Contraseña incorrecta."
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Demasiados intentos fallidos. Intente más tarde."
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "Esta cuenta ha sido desactivada."
      }

      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: errorMessage,
      })
    } finally {
      setStaffLoading(false)
    }
  }

  const handleFamilyLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!familyEmail || !familyPassword) {
      toast({
        variant: "destructive",
        title: "Campos requeridos",
        description: "Por favor ingrese email y contraseña.",
      })
      return
    }

    setFamilyLoading(true)
    console.log("🔐 Iniciando login de familiar:", familyEmail)

    try {
      const familyMember = await signInFamilyMember(
        familyEmail,
        familyPassword
      )

      if (familyMember) {
        console.log("✅ Familiar autenticado:", familyMember.name)

        toast({
          title: "Acceso concedido",
          description: `Bienvenido/a ${familyMember.name}`,
        })

        router.push("/family-portal")
      }
    } catch (error: any) {
      console.error("❌ Error en login familiar:", error)

      let errorMessage = error.message || "No se pudo iniciar sesión"

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/invalid-email"
      ) {
        errorMessage = "Correo o contraseña incorrectos"
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Demasiados intentos fallidos. Intente más tarde."
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "Esta cuenta ha sido desactivada."
      }

      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: errorMessage,
      })
    } finally {
      setFamilyLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F5F0E8] via-[#E8EDE4] to-[#F5F0E8] p-4">
      {/* Card más compacto, pero con logo dominante */}
      <Card className="w-full max-w-xl shadow-xl">
        <CardHeader className="text-center pt-6 pb-3">
          {/* LOGO PRINCIPAL (protagonista) */}
          <div className="flex justify-center mb-3">
            <Image
              src="/logo/hogar-san-juan.svg"
              alt="Logo Hogar San Juan"
              width={1}
              height={1}
              priority
              className="h-24 sm:h-36 w-auto opacity-95"
            />
          </div>

          {/* Marca textual como complemento */}
          <CardTitle className="text-2xl md:text-3xl font-bold tracking-wide">
            HOGAR SAN JUAN
          </CardTitle>
          <CardDescription className="mt-1 text-sm md:text-base">
            Sistema de Gestión Geriátrica
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-6">
          <Tabs defaultValue="staff" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-5">
              <TabsTrigger value="staff" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Personal
              </TabsTrigger>
              <TabsTrigger value="family" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Familiares
              </TabsTrigger>
            </TabsList>

            {/* LOGIN PERSONAL */}
            <TabsContent value="staff">
              <form onSubmit={handleStaffLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="staff-email">Correo Electrónico</Label>
                  <Input
                    id="staff-email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    required
                    disabled={staffLoading}
                    autoComplete="username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staff-password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="staff-password"
                      type={staffShowPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      required
                      disabled={staffLoading}
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setStaffShowPassword(!staffShowPassword)}
                      disabled={staffLoading}
                      tabIndex={-1}
                    >
                      {staffShowPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={staffLoading}
                >
                  {staffLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    "Iniciar Sesión"
                  )}
                </Button>
              </form>

              <p className="text-xs text-center text-muted-foreground mt-4">
                Acceso exclusivo para personal autorizado del hogar geriátrico
              </p>
            </TabsContent>

            {/* LOGIN FAMILIARES */}
            <TabsContent value="family">
              <form onSubmit={handleFamilyLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="family-email">Correo Electrónico</Label>
                  <Input
                    id="family-email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={familyEmail}
                    onChange={(e) => setFamilyEmail(e.target.value)}
                    required
                    disabled={familyLoading}
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="family-password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="family-password"
                      type={familyShowPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={familyPassword}
                      onChange={(e) => setFamilyPassword(e.target.value)}
                      required
                      disabled={familyLoading}
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setFamilyShowPassword(!familyShowPassword)}
                      disabled={familyLoading}
                      tabIndex={-1}
                    >
                      {familyShowPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={familyLoading}
                  variant="default"
                >
                  {familyLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Accediendo...
                    </>
                  ) : (
                    "Acceder al Portal"
                  )}
                </Button>
              </form>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-900">
                  <strong>Portal Familiar:</strong> Consulte la evolución diaria
                  y eventos programados de su familiar residente.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
