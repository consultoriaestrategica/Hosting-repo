"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useFamilyAuth } from "@/hooks/use-family-auth"
import { useResidents } from "@/hooks/use-residents"
import { useFamilyLogs } from "@/hooks/use-family-logs"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Heart,
  Activity,
  Pill,
  Calendar,
  FileText,
  LogOut,
  User,
  Clock,
  Droplet,
  Stethoscope,
  Package,
  Eye,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"

/**
 * Página del Portal Familiar
 *
 * Esta página permite a los familiares autenticados ver:
 * - Información básica de su residente asignado
 * - Registros médicos de los últimos 7 días
 * - Reportes de suministros recientes
 * - Próximos eventos programados
 *
 * Acceso: Solo familiares autenticados
 * Permisos: Solo lectura (no pueden modificar nada)
 */
export default function FamilyPortalPage() {
  const router = useRouter()
  const { familyMember, isLoading: familyLoading } = useFamilyAuth()
  const { residents, isLoading: residentsLoading } = useResidents()
  const { logs, stats, isLoading: logsLoading } = useFamilyLogs()
  const [isClient, setIsClient] = useState(false)

  // Asegurar que el código solo se ejecute en el cliente
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Redirigir si no es un familiar autenticado
  useEffect(() => {
    if (!familyLoading && !familyMember) {
      console.log(
        "❌ Portal Familiar: No hay familiar autenticado, redirigiendo..."
      )
      router.push("/login")
    }
  }, [familyMember, familyLoading, router])

  // Obtener el residente asociado al familiar
  const resident = useMemo(() => {
    if (!familyMember?.residentId) {
      console.log("⚠️ Portal Familiar: No hay residentId")
      return null
    }

    const foundResident = residents.find((r) => r.id === familyMember.residentId)

    console.log("🔍 Portal Familiar: Buscando residente", {
      residentId: familyMember.residentId,
      encontrado: !!foundResident,
      nombre: foundResident?.name,
    })

    return foundResident || null
  }, [residents, familyMember])

  // Filtrar eventos próximos de la agenda
  const upcomingEvents = useMemo(() => {
    if (!resident?.agendaEvents) return []

    const today = new Date()
    const upcoming = resident.agendaEvents
      .filter((event: any) => {
        const eventDate = parseISO(event.date)
        return eventDate >= today && event.status === "Pendiente"
      })
      .sort(
        (a: any, b: any) =>
          parseISO(a.date).getTime() - parseISO(b.date).getTime()
      )
      .slice(0, 5) // Solo mostrar los próximos 5 eventos

    console.log("📅 Portal Familiar: Eventos próximos", {
      total: upcoming.length,
    })

    return upcoming
  }, [resident])

  // Función para cerrar sesión
  const handleSignOut = async () => {
    try {
      console.log("🚪 Portal Familiar: Cerrando sesión...")
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("❌ Error al cerrar sesión:", error)
    }
  }

  // Mostrar loading mientras carga
  if (!isClient || familyLoading || residentsLoading || logsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando información...</p>
        </div>
      </div>
    )
  }

  // Si no hay familiar o residente, mostrar error
  if (!familyMember || !resident) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Acceso no autorizado</CardTitle>
            <CardDescription>
              No se encontró información del residente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSignOut} className="w-full">
              Cerrar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-4 flex items-center gap-2">
          <Eye className="h-4 w-4 text-blue-600 shrink-0" />
          <p className="text-xs text-blue-800">Portal de consulta — La información es actualizada por el equipo del hogar geriátrico.</p>
        </div>

        {/* ================================================ */}
        {/* HEADER - Título y botón de cerrar sesión */}
        {/* ================================================ */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Portal Familiar - HOGAR SAN JUAN
              </h1>
              <p className="text-gray-600 mt-1">
                Bienvenido/a,{" "}
                <span className="font-semibold">{familyMember.name}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Parentesco: {familyMember.relationship}
              </p>
            </div>
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* ================================================ */}
        {/* INFORMACIÓN DEL RESIDENTE */}
        {/* ================================================ */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Información del Residente</CardTitle>
                <CardDescription>
                  Datos generales de {resident.name}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nombre Completo</p>
                <p className="font-semibold">{resident.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Edad</p>
                <p className="font-semibold">{resident.age} años</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Tipo de Habitación
                </p>
                <Badge variant="outline">{resident.roomType}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Fecha de Ingreso
                </p>
                <p className="font-semibold">{resident.admissionDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge className="bg-green-500 hover:bg-green-600">
                  {resident.status}
                </Badge>
              </div>
              {resident.diet && (
                <div>
                  <p className="text-sm text-muted-foreground">Dieta</p>
                  <p className="font-semibold">{resident.diet}</p>
                </div>
              )}
              {resident.roomNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Número de Habitación
                  </p>
                  <p className="font-semibold">{resident.roomNumber}</p>
                </div>
              )}
              {resident.dependency && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Nivel de Dependencia
                  </p>
                  <Badge
                    variant={
                      resident.dependency === "Dependiente"
                        ? "destructive"
                        : "outline"
                    }
                  >
                    {resident.dependency}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ================================================ */}
        {/* ESTADÍSTICAS RÁPIDAS */}
        {/* ================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Registros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Últimos 7 días
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Reportes Médicos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">
                {stats.medical}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Evoluciones registradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                Suministros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">
                {stats.supply}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Entregas realizadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ================================================ */}
        {/* PRÓXIMOS EVENTOS */}
        {/* ================================================ */}
        {upcomingEvents.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Próximos Eventos</CardTitle>
                  <CardDescription>
                    Citas y eventos programados
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.map((event: any) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(
                          parseISO(event.date),
                          "EEEE, d 'de' MMMM 'de' yyyy 'a las' h:mm a",
                          { locale: es }
                        )}
                      </p>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {event.description}
                        </p>
                      )}
                      <Badge variant="outline" className="mt-2">
                        {event.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ================================================ */}
        {/* REGISTROS MÉDICOS RECIENTES (EN MODAL) */}
        {/* ================================================ */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Registros de los Últimos 7 Días</CardTitle>
                  <CardDescription>
                    Evolución médica y reportes diarios del residente
                  </CardDescription>
                </div>
              </div>

              {/* Botón que abre la modal */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Ver detalle
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Registros de los últimos 7 días</DialogTitle>
                    <DialogDescription>
                      Registros médicos y de suministro asociados a{" "}
                      {resident.name}.
                    </DialogDescription>
                  </DialogHeader>

                  {logs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p className="text-base font-semibold">
                        No hay registros recientes
                      </p>
                      <p className="text-xs mt-1">
                        No se han registrado reportes en los últimos 7 días.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {logs.map((log: any) => (
                        <div
                          key={log.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          {/* Header del Log */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {log.reportType === "medico" ? (
                                <Heart className="h-5 w-5 text-red-500" />
                              ) : (
                                <Package className="h-5 w-5 text-blue-500" />
                              )}
                              <Badge
                                variant={
                                  log.reportType === "medico"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {log.reportType === "medico"
                                  ? "Reporte Médico"
                                  : "Reporte de Suministro"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(parseISO(log.endDate), "PPp", {
                                locale: es,
                              })}
                            </p>
                          </div>

                          {/* Contenido del Reporte Médico */}
                          {log.reportType === "medico" && (
                            <>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                {log.heartRate && (
                                  <div className="flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-red-500" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">
                                        Frecuencia Cardíaca
                                      </p>
                                      <p className="font-semibold">
                                        {log.heartRate} lpm
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {log.respiratoryRate && (
                                  <div className="flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-blue-500" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">
                                        Frec. Respiratoria
                                      </p>
                                      <p className="font-semibold">
                                        {log.respiratoryRate} rpm
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {log.spo2 && (
                                  <div className="flex items-center gap-2">
                                    <Droplet className="h-4 w-4 text-cyan-500" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">
                                        SpO2
                                      </p>
                                      <p className="font-semibold">
                                        {log.spo2}%
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {log.feedingType && (
                                  <div className="flex items-center gap-2">
                                    <Pill className="h-4 w-4 text-green-500" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">
                                        Alimentación
                                      </p>
                                      <p className="font-semibold">
                                        {log.feedingType}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {log.evolutionNotes &&
                                log.evolutionNotes.length > 0 && (
                                  <div className="mt-3 p-3 bg-blue-50 rounded-md">
                                    <p className="text-sm font-semibold mb-2 text-blue-900">
                                      Notas de Evolución:
                                    </p>
                                    <ul className="list-disc list-inside space-y-1">
                                      {log.evolutionNotes.map(
                                        (note: string, idx: number) => (
                                          <li
                                            key={idx}
                                            className="text-sm text-blue-800"
                                          >
                                            {note}
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}

                              {log.professionalName && (
                                <p className="text-sm text-muted-foreground mt-3">
                                  <span className="font-semibold">
                                    Profesional:
                                  </span>{" "}
                                  {log.professionalName}
                                </p>
                              )}

                              {log.visitType && (
                                <p className="text-sm text-muted-foreground">
                                  <span className="font-semibold">
                                    Tipo de visita:
                                  </span>{" "}
                                  {log.visitType}
                                </p>
                              )}
                            </>
                          )}

                          {/* Contenido del Reporte de Suministro */}
                          {log.reportType === "suministro" && (
                            <div className="space-y-2">
                              {log.supplierName && (
                                <p className="text-sm">
                                  <span className="font-semibold">
                                    Proveedor:
                                  </span>{" "}
                                  {log.supplierName}
                                </p>
                              )}
                              {log.supplyDate && (
                                <p className="text-sm">
                                  <span className="font-semibold">
                                    Fecha de suministro:
                                  </span>{" "}
                                  {log.supplyDate}
                                </p>
                              )}
                              {log.supplyDescription && (
                                <p className="text-sm">
                                  <span className="font-semibold">
                                    Descripción:
                                  </span>{" "}
                                  {log.supplyDescription}
                                </p>
                              )}
                              {log.supplyNotes && (
                                <div className="mt-2 p-3 bg-green-50 rounded-md">
                                  <p className="text-sm text-green-900">
                                    {log.supplyNotes}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground">
              Consulte el detalle de los registros recientes haciendo clic en{" "}
              <span className="font-semibold">“Ver detalle”</span>.
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>© 2024 Hogar San Juan - Sistema de Gestión Geriátrica</p>
          <p className="mt-1">
            Portal Familiar - Información actualizada en tiempo real
          </p>
        </div>
      </div>
    </div>
  )
}
