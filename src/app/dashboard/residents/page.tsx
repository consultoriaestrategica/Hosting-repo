"use client"

import Link from "next/link"
import {
  PlusCircle,
  MoreHorizontal,
  FileText,
  ClipboardList,
  Search,
  Eye,
  Users,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useResidents, Resident, AgendaEvent } from "@/hooks/use-residents"
import { useLogs } from "@/hooks/use-logs"
import { useEffect, useState, useMemo, Suspense } from "react"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/use-user"
import NewLogForm from "./[id]/new-log-form"
import ResidentPreviewDialog from "./resident-preview-dialog"
import AgendaPreviewDialog from "../components/agenda-preview-dialog"
import AgendaForm from "../components/agenda-form"

function formatName(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const ITEMS_PER_PAGE = 8

function ResidentsPageContent() {
  const { residents, addAgendaEvent, deleteResident, isLoading } = useResidents()
  const { logs } = useLogs()
  const [isClient, setIsClient] = useState(false)
  const { toast } = useToast()
  const { user, role, hasPermission } = useUser()

  const getLastLogDate = (residentId: string): string => {
    const residentLogs = logs.filter(l => l.residentId === residentId)
    if (residentLogs.length === 0) return "Sin registros"
    const sorted = residentLogs.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
    return new Date(sorted[0].endDate).toLocaleDateString('es-ES', { dateStyle: 'medium' })
  }

  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [isAgendaDialogOpen, setIsAgendaDialogOpen] = useState(false)
  const [isAgendaFormOpen, setIsAgendaFormOpen] = useState(false)
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "Activo" | "Inactivo" | "Borrador">("all")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isLogDialogOpen && !isPreviewDialogOpen && !isAgendaDialogOpen && !isAgendaFormOpen) {
      const cleanup = () => {
        if (!document.querySelector('[data-state="open"][role="dialog"]')) {
          document.body.style.pointerEvents = '';
          document.body.style.removeProperty('pointer-events');
          if (document.body.style.length === 0) document.body.removeAttribute('style');
        }
      };
      cleanup();
      const t1 = setTimeout(cleanup, 150);
      const t2 = setTimeout(cleanup, 500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [isLogDialogOpen, isPreviewDialogOpen, isAgendaDialogOpen, isAgendaFormOpen]);

  const filteredResidents = useMemo(() => {
    return residents.filter((r) => {
      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesDate = dateFilter ? r.admissionDate === dateFilter : true
      const matchesStatus = statusFilter === "all" ? true : r.status === statusFilter
      return matchesSearch && matchesDate && matchesStatus
    })
  }, [residents, searchTerm, dateFilter, statusFilter])

  const totalActiveResidents = useMemo(() => {
    return residents.filter((r) => r.status === "Activo" || (!r.status)).length
  }, [residents])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredResidents.length / ITEMS_PER_PAGE)
  )

  const paginatedResidents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredResidents.slice(startIndex, endIndex)
  }, [filteredResidents, currentPage])

  const handleDeleteResident = async (residentId: string, residentName: string) => {
    try {
      await deleteResident(residentId)
      toast({
        title: "Residente eliminado",
        description: `${residentName} ha sido eliminado permanentemente.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el residente.",
      })
    }
  }

  const handleGenerateReport = (residentName: string) => {
    toast({
      title: "Generando reporte...",
      description: `Se está creando un reporte en PDF para ${residentName}.`,
    })
  }

  const handleActionClick = (
    resident: Resident,
    action: "log" | "preview" | "agenda" | "addEvent"
  ) => {
    setSelectedResident(resident)
    if (action === "log") setIsLogDialogOpen(true)
    if (action === "preview") setIsPreviewDialogOpen(true)
    if (action === "agenda") setIsAgendaDialogOpen(true)
    if (action === "addEvent") setIsAgendaFormOpen(true)
  }

  // Generar y descargar archivo .ics
  const downloadICSFile = (
    event: Omit<AgendaEvent, "id">,
    residentName: string
  ) => {
    const eventDate = new Date(event.date)
    const startTime =
      eventDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"

    const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000)
    const endTime =
      endDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Hogar San Juan//Agenda//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${Date.now()}@hogarsanjuan.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"}
DTSTART:${startTime}
DTEND:${endTime}
SUMMARY:${event.title} - ${residentName}
DESCRIPTION:${event.description || "Evento agendado desde Hogar San Juan"}
LOCATION:Hogar San Juan
STATUS:${
      event.status === "Pendiente"
        ? "CONFIRMED"
        : event.status === "Completado"
        ? "CONFIRMED"
        : "CANCELLED"
    }
SEQUENCE:0
END:VEVENT
END:VCALENDAR`

    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `evento-${residentName.replace(/\s/g, "-")}-${
      Date.now()
    }.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    toast({
      title: "Archivo descargado",
      description: "Abre el archivo .ics para agregarlo a tu calendario.",
    })
  }

  const handleAgendaFormSubmit = (
    residentId: string,
    data: Omit<AgendaEvent, "id">,
    syncWithCalendar: boolean
  ) => {
    if (!selectedResident) return

    addAgendaEvent(selectedResident.id, data)

    toast({
      title: "Evento agendado",
      description: `Se ha añadido un nuevo evento para ${selectedResident.name}.`,
    })

    if (syncWithCalendar) {
      downloadICSFile(data, selectedResident.name)
    }

    setIsAgendaFormOpen(false)
    setSelectedResident(null)
  }

  if (!isClient || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-9 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const isAdminRole = role === "Administrador"
  const isFamilyRole = role === "Acceso Familiar"
  const isStaffRole = role === "Personal de Cuidado" || role === "Supervisor"

  return (
    <div className="space-y-6">
      {/* HEADER RESPONSIVE */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold font-headline">
            Residentes
          </h1>
          <p className="text-sm text-muted-foreground">
            Administre la información clínica y administrativa de los
            residentes.
          </p>
        </div>
        {hasPermission("residents") && hasPermission("staff") && (
          <div className="flex w-full sm:w-auto justify-start sm:justify-end">
            <Button className="w-full sm:w-auto h-9 gap-1" asChild>
              <Link href="/dashboard/residents/new">
                <PlusCircle className="h-4 w-4" />
                <span className="whitespace-nowrap">Agregar nuevo residente</span>
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* TARJETAS RESUMEN */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Residentes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{residents.length}</div>
            <p className="text-xs text-muted-foreground">
              Total de residentes históricos y activos.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Residentes Activos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveResidents}</div>
            <p className="text-xs text-muted-foreground">
              Residentes actualmente en el hogar.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* LISTADO PRINCIPAL */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Residentes</CardTitle>
          <CardDescription>
            Busque, filtre y acceda a las fichas de cada residente.
          </CardDescription>
          <div className="flex flex-wrap items-center gap-2 pt-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre..."
                className="pl-8 w-full sm:w-auto"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Input
              type="date"
              placeholder="Filtrar por fecha de ingreso"
              className="w-full sm:w-auto"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          <div className="overflow-x-auto -mx-4 px-4 mt-3 pb-1">
            <div className="inline-flex gap-2 min-w-max">
              <Button variant={statusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("all")}>
                Todos ({residents.length})
              </Button>
              <Button variant={statusFilter === "Activo" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("Activo")}>
                Activos ({residents.filter(r => r.status === "Activo" || !r.status).length})
              </Button>
              <Button variant={statusFilter === "Borrador" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("Borrador")} className={statusFilter === "Borrador" ? "bg-amber-500 border-amber-500" : "border-amber-300 text-amber-700 hover:bg-amber-50"}>
                Borradores ({residents.filter(r => r.status === "Borrador").length})
              </Button>
              <Button variant={statusFilter === "Inactivo" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("Inactivo")}>
                Inactivos ({residents.filter(r => r.status === "Inactivo").length})
              </Button>
            </div>
          </div>
          {(searchTerm || statusFilter !== "all") && (
            <p className="text-sm text-muted-foreground mt-2">
              Mostrando {filteredResidents.length} de {residents.length} residentes
            </p>
          )}
        </CardHeader>
        <CardContent>
          {/* Vista Mobile (tarjetas) */}
          <div className="md:hidden space-y-4">
            {filteredResidents.length > 0 ? (
              filteredResidents.map((resident) => (
                <div key={resident.id} className="border rounded-xl p-4 space-y-3 bg-white shadow-sm">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <Link href={`/dashboard/residents/${resident.id}/`} className="font-semibold text-base hover:underline">
                        {formatName(resident.name)}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {resident.roomType} {resident.roomNumber ? `#${resident.roomNumber}` : ""}
                      </p>
                    </div>
                    {resident.status === "Borrador" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">Borrador</span>
                    ) : (
                      <Badge variant={resident.status === "Activo" ? "default" : "secondary"} className={resident.status === "Activo" ? "bg-green-500 text-white" : ""}>
                        {resident.status}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span>Ingreso: {resident.admissionDate ? new Date(resident.admissionDate).toLocaleDateString('es-ES', { dateStyle: 'long' }) : 'No registrado'}</span>
                    <Badge variant="outline">{resident.dependency}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Último registro: {getLastLogDate(resident.id)}
                  </div>
                  <div className="flex justify-end">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/residents/${resident.id}/`}>Ver perfil</Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">No se encontraron residentes</h3>
                <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm">Intenta ajustar los filtros de búsqueda o agrega un nuevo residente.</p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link href="/dashboard/residents/new/">Agregar residente</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Vista Desktop (tabla) */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Habitación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>F. de Ingreso</TableHead>
                  <TableHead>Nivel de Dependencia</TableHead>
                  <TableHead className="hidden lg:table-cell">Último Registro</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedResidents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-semibold text-muted-foreground">No se encontraron residentes</h3>
                        <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm">Intenta ajustar los filtros de búsqueda o agrega un nuevo residente.</p>
                        <Button asChild variant="outline" size="sm" className="mt-4">
                          <Link href="/dashboard/residents/new/">Agregar residente</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedResidents.map((resident) => (
                  <TableRow key={resident.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/residents/${resident.id}`}
                        className="hover:underline"
                      >
                        {formatName(resident.name)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          resident.roomType === "Habitación individual"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {resident.roomType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {resident.status === "Borrador" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">Borrador</span>
                      ) : (
                        <Badge
                          variant={resident.status === "Activo" ? "default" : "secondary"}
                          className={resident.status === "Activo" ? "bg-green-500 text-white" : ""}
                        >
                          {resident.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {resident.admissionDate ? new Date(resident.admissionDate).toLocaleDateString('es-ES', { dateStyle: 'long' }) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          resident.dependency === "Dependiente"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {resident.dependency}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {getLastLogDate(resident.id)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Abrir menú</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>

                          {isAdminRole && (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/residents/${resident.id}`}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Ver perfil completo
                              </Link>
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            onClick={() => handleActionClick(resident, "agenda")}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            Ver agenda
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() =>
                              handleActionClick(resident, "addEvent")
                            }
                          >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Agendar evento
                          </DropdownMenuItem>

                          {isStaffRole && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleActionClick(resident, "preview")
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver ficha rápida
                            </DropdownMenuItem>
                          )}
                          {!isFamilyRole && (
                            <DropdownMenuItem
                              onClick={() => handleActionClick(resident, "log")}
                            >
                              <ClipboardList className="mr-2 h-4 w-4" />
                              Agregar reporte
                            </DropdownMenuItem>
                          )}
                          {isAdminRole && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleGenerateReport(resident.name)
                              }
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Generar reporte
                            </DropdownMenuItem>
                          )}
                          {hasPermission("settings") && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                if (window.confirm(`⚠️ ELIMINAR PERMANENTEMENTE a ${resident.name}?\n\nSe eliminarán todos sus datos, registros y documentos. Esta acción NO se puede deshacer.`)) {
                                  handleDeleteResident(resident.id, resident.name)
                                }
                              }}
                            >
                              Eliminar permanentemente
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* DIALOGOS */}
      {selectedResident && (
        <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                Agregar registro de evolución para {selectedResident.name}
              </DialogTitle>
              <DialogDescription>
                Complete la información de la evolución diaria del residente.
              </DialogDescription>
            </DialogHeader>
            <NewLogForm
              residentId={selectedResident.id}
              onFormSubmit={() => setIsLogDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {selectedResident && (
        <Dialog open={isAgendaFormOpen} onOpenChange={setIsAgendaFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agendar nuevo evento</DialogTitle>
              <DialogDescription>
                Complete los detalles del evento para {selectedResident.name}.
              </DialogDescription>
            </DialogHeader>
            <AgendaForm
              residentId={selectedResident.id}
              event={null}
              onSubmit={handleAgendaFormSubmit}
              onCancel={() => setIsAgendaFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {selectedResident && (
        <ResidentPreviewDialog
          isOpen={isPreviewDialogOpen}
          onOpenChange={setIsPreviewDialogOpen}
          resident={selectedResident}
        />
      )}

      {selectedResident && (
        <AgendaPreviewDialog
          isOpen={isAgendaDialogOpen}
          onOpenChange={setIsAgendaDialogOpen}
          resident={selectedResident}
        />
      )}
    </div>
  )
}

export default function ResidentsPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ResidentsPageContent />
    </Suspense>
  )
}
