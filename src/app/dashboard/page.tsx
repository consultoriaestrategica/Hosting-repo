"use client"

import Link from "next/link"
import { CalendarDays, FileText, Users, UserCircle2 } from "lucide-react"

import  AuthGuard  from "@/components/auth-guard"
import { useUser } from "@/hooks/use-user"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DashboardHomePage() {
  const { user } = useUser()

  return (
    <AuthGuard>
      <div className="space-y-6">
        {/* Bloque de bienvenida dentro del contenido (NO es header global) */}
        <section className="rounded-xl border bg-white p-4 sm:p-6 shadow-sm">
          <h2 className="text-base sm:text-lg font-semibold">
            {user?.name ? `Hola, ${user.name}` : "Resumen general"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Desde aquí puedes gestionar residentes, personal, contratos y
            registros diarios del hogar.
          </p>
        </section>

        {/* Accesos rápidos / módulos principales */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-sm font-medium">
                  Residentes
                </CardTitle>
                <CardDescription className="text-xs">
                  Gestión de residentes y su información clínica.
                </CardDescription>
              </div>
              <Users className="h-5 w-5 text-slate-400" />
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild size="sm" className="w-full">
                <Link href="/dashboard/residents">Ir a residentes</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-sm font-medium">
                  Personal
                </CardTitle>
                <CardDescription className="text-xs">
                  Información del personal y contratos laborales.
                </CardDescription>
              </div>
              <UserCircle2 className="h-5 w-5 text-slate-400" />
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild size="sm" className="w-full">
                <Link href="/dashboard/staff">Ir a personal</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-sm font-medium">
                  Registro Diario
                </CardTitle>
                <CardDescription className="text-xs">
                  Evoluciones, notas y signos vitales por residente.
                </CardDescription>
              </div>
              <CalendarDays className="h-5 w-5 text-slate-400" />
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild size="sm" className="w-full">
                <Link href="/dashboard/logs">Ir a registro diario</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-sm font-medium">
                  Reportes
                </CardTitle>
                <CardDescription className="text-xs">
                  Genera reportes PDF de residentes y registros.
                </CardDescription>
              </div>
              <FileText className="h-5 w-5 text-slate-400" />
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild size="sm" className="w-full">
                <Link href="/dashboard/reports">Ir a reportes</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </AuthGuard>
  )
}
