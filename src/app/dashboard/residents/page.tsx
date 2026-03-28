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
import { useEffect, useState, useMemo, Suspense } from "react"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/use-user"
import NewLogForm from "./[id]/new-log-form"
import ResidentPreviewDialog from "./resident-preview-dialog"
import AgendaPreviewDialog from "../components/agenda-preview-dialog"
import AgendaForm from "../components/agenda-form"

const ITEMS_PER_PAGE = 8

function ResidentsPageContent() {
  const { residents, addAgendaEvent, isLoading } = useResidents()
  const [isClient, setIsClient] = useState(false)
  const { toast } = useToast()
  const { user, role } = useUser()

  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [isAgendaDialogOpen, setIsAgendaDialogOpen] = useState(false)
  const [isAgendaFormOpen, setIsAgendaFormOpen] = useState(false)
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("")
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
    return residents.filter((resident) => {
      const nameMatch = resident.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
      const dateMatch = dateFilter
        ? resident.admissionDate.includes(dateFilter)
        : true
      return nameMatch && dateMatch
    })
  }, [residents, searchTerm, dateFilter])

  const totalActiveResidents = useMemo(() => {
    return residents.filter((r) => r.status === "Activo").length
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
    return <div>Cargando residentes...</div>
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
        {isAdminRole && (
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
        </CardHeader>
        <CardContent>
          {/* Wrapper para scroll horizontal en móviles */}
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Habitación
                  </TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden md:table-cell">
                    F. de Ingreso
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Nivel de Dependencia
                  </TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedResidents.map((resident) => (
                  <TableRow key={resident.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/residents/${resident.id}`}
                        className="hover:underline"
                      >
                        {resident.name}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
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
                      <Badge
                        variant={
                          resident.status === "Activo" ? "default" : "secondary"
                        }
                        className={
                          resident.status === "Activo"
                            ? "bg-green-500 text-white"
                            : ""
                        }
                      >
                        {resident.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {resident.admissionDate}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
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
