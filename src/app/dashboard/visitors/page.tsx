
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
import { useState, useMemo, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import NewVisitForm from "./new-visit-form"
import { PlusCircle, FilterX, Calendar as CalendarIcon, User } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { DateRange } from "react-day-picker"

type EnrichedVisit = Visit & {
    residentName: string;
    residentId: string;
};

function VisitorsPageContent() {
  const { residents, isLoading } = useResidents()
  const [isClient, setIsClient] = useState(false)
  const [isVisitFormOpen, setIsVisitFormOpen] = useState(false)
  
  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'admin';
  
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
        const fromDate = appliedDateRange.from;
        const toDate = appliedDateRange.to ? new Date(appliedDateRange.to) : new Date(fromDate);
        if (appliedDateRange.to) toDate.setHours(23, 59, 59, 999);
        
        return visitDate >= fromDate && visitDate <= toDate;
      });
    }
    return filtered.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
  }, [allVisits, appliedDateRange]);

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
          <div className="flex items-center gap-2 pt-4">
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                        "w-[260px] justify-start text-left font-normal",
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha y Hora</TableHead>
                <TableHead>Visitante</TableHead>
                <TableHead>Parentesco</TableHead>
                <TableHead>Residente Visitado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVisits.length > 0 ? (
                filteredVisits.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell className="font-medium">{new Date(visit.visitDate).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</TableCell>
                    <TableCell>
                        <div>{visit.visitorName}</div>
                        <div className="text-xs text-muted-foreground">{visit.visitorIdNumber}</div>
                    </TableCell>
                    <TableCell>{visit.kinship}</TableCell>
                    <TableCell>
                      <Button variant="link" asChild className="p-0 h-auto font-normal">
                          <Link href={`/dashboard/residents/${visit.residentId}?role=${role}`}>
                            <User className="mr-2 h-3 w-3" />
                            {visit.residentName}
                          </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No se encontraron visitas con los filtros actuales.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
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
