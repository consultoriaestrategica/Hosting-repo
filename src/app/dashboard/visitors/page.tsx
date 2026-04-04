"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { useResidents, Visit } from "@/hooks/use-residents"
import { useUser } from "@/hooks/use-user"
import { useToast } from "@/hooks/use-toast"
import { useState, useMemo, useEffect, Suspense } from "react"
import NewVisitForm from "./new-visit-form"
import { PlusCircle, FilterX, Calendar as CalendarIcon, User, Trash2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { DateRange } from "react-day-picker"

const ITEMS_PER_PAGE = 10

function VisitorsPageContent() {
  const { residents, isLoading, deleteVisit } = useResidents()
  const { user } = useUser()
  const { toast } = useToast()
  const isAdmin = user?.role === "Administrador"
  const [isClient, setIsClient] = useState(false)
  const [isVisitFormOpen, setIsVisitFormOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange | undefined>();

  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const allVisits = useMemo(() => {
    return residents.flatMap(resident => 
        (resident.visits || []).map(visit => ({
            ...visit,
            residentName: resident.name,
            residentId: resident.id,
        }))
    )
  }, [residents]);

  const filteredVisits = useMemo(() => {
    let filtered = [...allVisits];
    if (appliedDateRange?.from) {
      filtered = filtered.filter(visit => {
        const visitDate = new Date(visit.visitDate);
        const fromDate = new Date(appliedDateRange.from!);
        const toDate = appliedDateRange.to 
          ? new Date(appliedDateRange.to) 
          : new Date(appliedDateRange.from!);
        
        // Ajustar la hora final si hay fecha de fin
        if (appliedDateRange.to) {
          toDate.setHours(23, 59, 59, 999);
        }
        
        return visitDate >= fromDate && visitDate <= toDate;
      });
    }
    return filtered.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
  }, [allVisits, appliedDateRange]);

  const totalPages = Math.ceil(filteredVisits.length / ITEMS_PER_PAGE)
  const paginatedVisits = filteredVisits.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [appliedDateRange])

  if (!isClient || isLoading) {
    return <div>Cargando...</div>
  }
  
  const handleApplyFilter = () => {
    setAppliedDateRange(dateRange);
  };

  const handleClearFilter = () => {
    setDateRange(undefined);
    setAppliedDateRange(undefined);
  };

  const handleDeleteVisit = async (residentId: string, visitId: string) => {
    try {
      await deleteVisit(residentId, visitId)
      toast({ title: "Visita eliminada", description: "La visita ha sido eliminada permanentemente." })
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar la visita." })
    }
  };

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-3xl font-bold font-headline">Registro de Visitas</h1>
        <div className="ml-auto flex items-center gap-2">
            <Dialog open={isVisitFormOpen} onOpenChange={setIsVisitFormOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" className="h-8 gap-1">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Registrar Visita
                        </span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Registrar Nueva Visita</DialogTitle>
                        <DialogDescription>Complete los datos del visitante y seleccione al residente.</DialogDescription>
                    </DialogHeader>
                    <NewVisitForm onFormSubmit={() => setIsVisitFormOpen(false)} />
                </DialogContent>
            </Dialog>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Visitas Recientes</CardTitle>
          <CardDescription>
            Listado de todas las visitas registradas. Use el filtro para buscar por fecha.
          </CardDescription>
          <div className="flex flex-wrap items-center gap-2 pt-4">
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                        "w-full sm:w-auto justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                        dateRange.to ? (
                            <>
                            {format(dateRange.from, "LLL dd, y", { locale: es })} -{" "}
                            {format(dateRange.to, "LLL dd, y", { locale: es })}
                            </>
                        ) : (
                            format(dateRange.from, "LLL dd, y", { locale: es })
                        )
                        ) : (
                        <span>Seleccione un rango</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                        locale={es}
                    />
                    </PopoverContent>
                </Popover>
                <Button onClick={handleApplyFilter} disabled={!dateRange}>Aplicar Filtro</Button>
                 <Button variant="outline" onClick={handleClearFilter} disabled={!appliedDateRange}>
                    <FilterX className="h-4 w-4 mr-2" />
                    Limpiar
                </Button>
           </div>
        </CardHeader>
        <CardContent>
          {/* Mobile View: Card List */}
          <div className="md:hidden space-y-4">
             {filteredVisits.length > 0 ? (
                paginatedVisits.map((visit) => (
                    <div key={visit.id} className="border rounded-lg p-4 space-y-2">
                        <div>
                            <p className="font-semibold">{visit.visitorName} ({visit.kinship})</p>
                            <p className="text-sm text-muted-foreground">ID: {visit.visitorIdNumber}</p>
                        </div>
                        <div className="text-sm">
                            <p className="font-medium text-muted-foreground">Visitó a:</p>
                             <Button variant="link" asChild className="p-0 h-auto font-normal text-base">
                                <Link href={`/dashboard/residents/${visit.residentId}`}>
                                    {visit.residentName}
                                </Link>
                            </Button>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t">
                          <span className="text-xs text-muted-foreground">
                            {new Date(visit.visitDate).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}
                          </span>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteVisit(visit.residentId, visit.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          )}
                        </div>
                    </div>
                ))
             ) : (
                <p className="text-center text-muted-foreground py-8">
                    No se encontraron visitas con los filtros actuales.
                </p>
             )}
          </div>
          {/* Desktop View: Table */}
          <div className="hidden md:block">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead>Visitante</TableHead>
                    <TableHead>Parentesco</TableHead>
                    <TableHead>Residente Visitado</TableHead>
                    {isAdmin && <TableHead className="w-[60px]">Acciones</TableHead>}
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredVisits.length > 0 ? (
                    paginatedVisits.map((visit) => (
                    <TableRow key={visit.id}>
                        <TableCell className="font-medium">{new Date(visit.visitDate).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</TableCell>
                        <TableCell>
                            <div>{visit.visitorName}</div>
                            <div className="text-xs text-muted-foreground">{visit.visitorIdNumber}</div>
                        </TableCell>
                        <TableCell>{visit.kinship}</TableCell>
                        <TableCell>
                        <Button variant="link" asChild className="p-0 h-auto font-normal">
                            <Link href={`/dashboard/residents/${visit.residentId}`}>
                                <User className="mr-2 h-3 w-3" />
                                {visit.residentName}
                            </Link>
                        </Button>
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteVisit(visit.residentId, visit.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </TableCell>
                        )}
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={isAdmin ? 5 : 4} className="h-24 text-center">
                            No se encontraron visitas con los filtros actuales.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
          </div>
        </CardContent>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 pb-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredVisits.length)}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredVisits.length)} de {filteredVisits.length}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>
    </>
  )
}

export default function VisitorsPage() {
    return (
      <Suspense fallback={<div>Cargando...</div>}>
        <VisitorsPageContent />
      </Suspense>
    )
}