
"use client"
import { useState, useMemo, Suspense } from "react"
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
import { Button } from "@/components/ui/button"
import { PlusCircle, Stethoscope, Truck, Eye } from "lucide-react"
import NewLogForm from "../residents/[id]/new-log-form"
import { useLogs, Log } from "@/hooks/use-logs"
import { useResidents } from "@/hooks/use-residents"
import LogDetailDialog from "../components/log-detail-dialog"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

function LogsPageContent() {
  const { logs, isLoading: logsLoading } = useLogs();
  const { residents, isLoading: residentsLoading } = useResidents();
  const [isNewLogDialogOpen, setIsNewLogDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  const isLoading = logsLoading || residentsLoading;

  const enrichedLogs = useMemo(() => {
    return logs
      .map(log => {
        const resident = residents.find(r => r.id === log.residentId);
        return {
          ...log,
          residentName: resident?.name || 'Residente no encontrado',
        };
      })
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
  }, [logs, residents]);

  const handleLogClick = (log: Log) => {
    setSelectedLog(log);
    setIsDetailDialogOpen(true);
  };
  
  if (isLoading) {
    return <div>Cargando registros...</div>;
  }

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-3xl font-bold font-headline">Historial de Registros</h1>
        <div className="ml-auto flex items-center gap-2">
            <Dialog open={isNewLogDialogOpen} onOpenChange={setIsNewLogDialogOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" className="h-8 gap-1">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Añadir Nuevo Registro
                        </span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Agregar Registro de Evolución</DialogTitle>
                        <DialogDescription>Seleccione el tipo de reporte y complete la información.</DialogDescription>
                    </DialogHeader>
                    <NewLogForm onFormSubmit={() => setIsNewLogDialogOpen(false)} />
                </DialogContent>
            </Dialog>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Todos los Registros</CardTitle>
          <CardDescription>
            Un listado completo de todos los registros médicos y de suministros del sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile View */}
          <div className="md:hidden space-y-4">
              {enrichedLogs.length > 0 ? enrichedLogs.map(log => (
                  <div key={log.id} className="border rounded-lg p-4 space-y-2 cursor-pointer" onClick={() => handleLogClick(log)}>
                      <div className="flex justify-between items-start">
                          <div>
                              <p className="font-semibold">{log.residentName}</p>
                              <p className="text-xs text-muted-foreground">{new Date(log.endDate).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</p>
                          </div>
                          <Badge variant="outline" className={log.reportType === 'medico' ? 'border-blue-500' : 'border-orange-500'}>
                              {log.reportType === 'medico' ? <Stethoscope className="h-3 w-3 mr-1" /> : <Truck className="h-3 w-3 mr-1" />}
                              {log.reportType === 'medico' ? 'Médico' : 'Suministro'}
                          </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate pt-2 border-t">
                          {log.reportType === 'medico' ? (Array.isArray(log.evolutionNotes) ? log.evolutionNotes[0] : 'Ver detalle') : log.supplyDescription}
                      </p>
                  </div>
              )) : (
                <p className="text-center text-muted-foreground py-8">
                  Aún no hay registros para mostrar.
                </p>
              )}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Residente</TableHead>
                  <TableHead>Tipo de Reporte</TableHead>
                  <TableHead>Detalle Principal</TableHead>
                  <TableHead><span className="sr-only">Acciones</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrichedLogs.length > 0 ? (
                  enrichedLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{new Date(log.endDate).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</TableCell>
                    <TableCell>
                      <Link href={`/dashboard/residents/${log.residentId}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                        {log.residentName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={log.reportType === 'medico' ? 'border-blue-500' : 'border-orange-500'}>
                          {log.reportType === 'medico' ? <Stethoscope className="h-3 w-3 mr-1" /> : <Truck className="h-3 w-3 mr-1" />}
                          {log.reportType === 'medico' ? 'Médico' : 'Suministro'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                       {log.reportType === 'medico' ? (Array.isArray(log.evolutionNotes) && log.evolutionNotes.length > 0 ? log.evolutionNotes[0] : 'Sin notas de evolución') : log.supplyDescription}
                    </TableCell>
                     <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleLogClick(log)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalle
                        </Button>
                    </TableCell>
                  </TableRow>
                  ))
                ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Aún no hay registros para mostrar.
                  </TableCell>
                </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {selectedLog && (
        <LogDetailDialog 
          isOpen={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          log={selectedLog}
          residentName={enrichedLogs.find(l => l.id === selectedLog.id)?.residentName || ""}
        />
      )}
    </>
  );
}


export default function LogsPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <LogsPageContent />
    </Suspense>
  )
}
