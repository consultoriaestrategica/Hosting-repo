
"use client"
import Link from "next/link"
import { PlusCircle, MoreHorizontal, Stethoscope, Truck, FilterX, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useLogs, Log } from "@/hooks/use-logs"
import { useResidents } from "@/hooks/use-residents"
import { useEffect, useState, useMemo, Suspense } from "react"
import NewLogForm from "../residents/[id]/new-log-form"
import { Badge } from "@/components/ui/badge"
import LogDetailDialog from "./log-detail-dialog"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import { useSearchParams } from "next/navigation"


function LogsPageContent() {
  const { logs, isLoading: logsLoading } = useLogs()
  const { residents, isLoading: residentsLoading } = useResidents()
  const [isClient, setIsClient] = useState(false)
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'admin';


  // State for filtering
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange | undefined>();

  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const isLoading = logsLoading || residentsLoading;
  const isStaffRole = role === 'staff';

  const filteredLogs = useMemo(() => {
    let filtered = [...logs];
    if (appliedDateRange?.from) {
      filtered = filtered.filter(log => {
        if (!log.endDate || isNaN(new Date(log.endDate).getTime())) {
          return false;
        }
        const logDate = new Date(log.endDate);
        const fromDate = appliedDateRange.from;
        // Set 'to' date to the end of the day if it exists, otherwise use fromDate
        const toDate = appliedDateRange.to ? new Date(appliedDateRange.to) : new Date(fromDate);
        if (appliedDateRange.to) {
            toDate.setHours(23, 59, 59, 999); // End of the selected day
        }
        
        return logDate >= fromDate && logDate <= toDate;
      });
    }
    return filtered.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
  }, [logs, appliedDateRange]);


  if (!isClient || isLoading) {
    return <div>Cargando...</div>
  }

  const getResidentName = (residentId: string) => {
    return residents.find(r => r.id === residentId)?.name || "N/A"
  }

  const handleRowClick = (log: Log) => {
    setSelectedLog(log);
    setIsDetailDialogOpen(true);
  };
  
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
        <h1 className="text-3xl font-bold font-headline">Registro Diario</h1>
        <div className="ml-auto flex items-center gap-2">
            <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" className="h-8 gap-1">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Agregar Reporte
                        </span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Agregar Reporte Diario</DialogTitle>
                        <DialogDescription>Seleccione el tipo de reporte y complete la información.</DialogDescription>
                    </DialogHeader>
                    <NewLogForm onFormSubmit={() => setIsLogDialogOpen(false)} />
                </DialogContent>
            </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reportes Recientes</CardTitle>
          <CardDescription>
            Listado de los últimos reportes médicos y de suministros. Use el filtro para buscar por fecha.
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
                <TableHead>Fecha</TableHead>
                <TableHead>Residente</TableHead>
                <TableHead>Tipo de Reporte</TableHead>
                <TableHead>Detalle Principal</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} onClick={() => handleRowClick(log)} className="cursor-pointer">
                  <TableCell className="font-medium">{new Date(log.endDate).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</TableCell>
                  <TableCell>
                    <Link href={`/dashboard/residents/${log.residentId}?role=${role}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                        {getResidentName(log.residentId)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={log.reportType === 'medico' ? 'border-blue-500' : 'border-orange-500'}>
                        {log.reportType === 'medico' ? <Stethoscope className="h-3 w-3 mr-1" /> : <Truck className="h-3 w-3 mr-1" />}
                        {log.reportType === 'medico' ? 'Médico' : 'Suministro'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {log.reportType === 'medico' ? log.evolutionNotes : log.supplyDescription}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleRowClick(log)}>
                            Ver Detalle
                        </DropdownMenuItem>
                        {!isStaffRole && (
                            <DropdownMenuItem asChild>
                               <Link href={`/dashboard/residents/${log.residentId}?role=${role}`}>Ver Perfil</Link>
                            </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {selectedLog && (
        <LogDetailDialog 
            isOpen={isDetailDialogOpen} 
            onOpenChange={setIsDetailDialogOpen} 
            log={selectedLog}
            residentName={getResidentName(selectedLog.residentId)}
        />
      )}
    </>
  )
}

export default function LogsPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <LogsPageContent />
    </Suspense>
  )
}
