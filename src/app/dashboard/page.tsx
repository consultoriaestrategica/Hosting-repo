"use client"

import Link from "next/link"
import { CalendarDays, FileText, Users, UserCircle2, Calendar } from "lucide-react"

import  AuthGuard  from "@/components/auth-guard"
import AgendaDashboard from "./components/agenda-dashboard"
import { useUser } from "@/hooks/use-user"
import { useResidents } from "@/hooks/use-residents"
import { useLogs } from "@/hooks/use-logs"
import { useStaff } from "@/hooks/use-staff"
import { useSettings } from "@/hooks/use-settings"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DashboardHomePage() {
  const { user, hasPermission } = useUser()
  const { residents } = useResidents()
  const { logs } = useLogs()
  const { staff } = useStaff()
  const { settings } = useSettings()

  const activeResidents = residents.filter(r => r.status === "Activo").length
  const totalStaff = staff.length
  const todayLogs = logs.filter(l => {
    const logDate = new Date(l.endDate).toDateString()
    return logDate === new Date().toDateString()
  }).length

  return (
    <AuthGuard>
      <div className="space-y-6">
        {/* Bloque de bienvenida dentro del contenido (NO es header global) */}
        <section className="rounded-xl border bg-white p-4 sm:p-6 shadow-sm">
          <h2 className="text-base sm:text-lg font-semibold">
            {user?.name ? `Hola, ${user.name}` : "Resumen general"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {user?.role === "Administrador"
              ? "Gestiona residentes, personal, contratos y agenda en un solo lugar."
              : "Consulta residentes, registros diarios y reportes del hogar."}
          </p>
        </section>

        {/* KPIs */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Residentes Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeResidents}</div>
              <p className="text-xs text-muted-foreground">de {settings.totalBeds} camas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Personal</CardTitle>
              <UserCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStaff}</div>
              <p className="text-xs text-muted-foreground">miembros activos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registros Hoy</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayLogs}</div>
              <p className="text-xs text-muted-foreground">evoluciones y suministros</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ocupación</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeResidents > 0 ? Math.round((activeResidents / Math.max(settings.totalBeds, 1)) * 100) : 0}%</div>
              <p className="text-xs text-muted-foreground">{activeResidents} de {settings.totalBeds} camas</p>
            </CardContent>
          </Card>
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

          {hasPermission("staff") && (
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
          )}

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

        <section className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  Próximos Eventos
                </CardTitle>
                <CardDescription>
                  Citas médicas, gestiones y eventos programados para los próximos 7 días.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <AgendaDashboard />
            </CardContent>
          </Card>
        </section>
      </div>
    </AuthGuard>
  )
}
