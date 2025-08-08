
"use client"
import Link from "next/link"
import { PlusCircle, MoreHorizontal, Stethoscope, Truck, Search, FilterX } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { useLogs, Log } from "@/hooks/use-logs"
import { useResidents } from "@/hooks/use-residents"
import { useEffect, useState, useMemo } from "react"
import NewLogForm from "../residents/[id]/new-log-form"
import { Badge } from "@/components/ui/badge"
import LogDetailDialog from "./log-detail-dialog"

export default function LogsPage() {
  const { logs, isLoading: logsLoading } = useLogs()
  const { residents, isLoading: residentsLoading } = useResidents()
  const [isClient, setIsClient] = useState(false)
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  // State for filtering
  const [dateFilter, setDateFilter] = useState("");
  const [appliedDateFilter, setAppliedDateFilter] = useState("");

  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const isLoading = logsLoading || residentsLoading;

  const filteredLogs = useMemo(() => {
    let filtered = [...logs];
    if (appliedDateFilter) {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.endDate).toISOString().split('T')[0];
        return logDate === appliedDateFilter;
      });
    }
    return filtered.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
  }, [logs, appliedDateFilter]);


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
    setAppliedDateFilter(dateFilter);
  };

  const handleClearFilter = () => {
    setDateFilter("");
    setAppliedDateFilter("");
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
                <Input
                    type="date"
                    className="w-auto"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                />
                <Button onClick={handleApplyFilter}>Aplicar Filtro</Button>
                 <Button variant="outline" onClick={handleClearFilter} disabled={!appliedDateFilter}>
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
                    <Link href={`/dashboard/residents/${log.residentId}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
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
                        <DropdownMenuItem asChild>
                           <Link href={`/dashboard/residents/${log.residentId}`}>Ver Perfil</Link>
                        </DropdownMenuItem>
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
