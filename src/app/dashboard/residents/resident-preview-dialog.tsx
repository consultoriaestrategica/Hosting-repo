
import { useState, useMemo, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Resident } from "@/hooks/use-residents"
import { Log, useLogs } from "@/hooks/use-logs"
import { User, Stethoscope, Truck } from "lucide-react"
import LogDetailDialog from "../components/log-detail-dialog"

interface ResidentPreviewDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  resident: Resident | null
}

const ITEMS_PER_PAGE = 7;

export default function ResidentPreviewDialog({ isOpen, onOpenChange, resident }: ResidentPreviewDialogProps) {
  const { logs } = useLogs()
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<Log | null>(null)
  const [currentPage, setCurrentPage] = useState(1);
  
  useEffect(() => {
    // Reset page to 1 when dialog opens or resident changes
    if (isOpen) {
      setCurrentPage(1);
    }
  }, [isOpen, resident]);


  const residentLogs = useMemo(() => {
    if (!resident) return []
    return logs
      .filter(log => log.residentId === resident.id)
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
  }, [logs, resident])

  const totalPages = Math.ceil(residentLogs.length / ITEMS_PER_PAGE);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return residentLogs.slice(startIndex, endIndex);
  }, [residentLogs, currentPage]);

  const handleLogClick = (log: Log) => {
    setSelectedLog(log)
    setIsDetailDialogOpen(true)
  }

  if (!resident) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <User className="mr-2" />
              Ficha Rápida del Residente
            </DialogTitle>
            <DialogDescription>
              Información de cuidado e historial de reportes para {resident.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2 text-sm">
            <h3 className="font-semibold text-base mb-2">Información de Cuidado</h3>
            <div className="grid grid-cols-1 gap-4 p-4 border rounded-lg">
                <div className="col-span-full">
                    <h4 className="font-semibold">Alergias</h4>
                      <div className="flex flex-wrap gap-1 mt-1">{resident.allergies?.length ? resident.allergies.map(a => <Badge key={a} variant="destructive">{a}</Badge>) : <p className="text-muted-foreground">Ninguna</p>}</div>
                </div>
                <div className="col-span-full">
                    <h4 className="font-semibold">Medicamentos Recetados</h4>
                     {resident.medications?.length ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Medicamento</TableHead>
                                    <TableHead>Dosis</TableHead>
                                    <TableHead>Frecuencia</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {resident.medications.map((med, index) => (
                                   <TableRow key={index}>
                                       <TableCell>{med.name}</TableCell>
                                       <TableCell>{med.dose}</TableCell>
                                       <TableCell>{med.frequency}</TableCell>
                                   </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     ) : (
                        <p className="text-muted-foreground">No hay medicamentos recetados.</p>
                     )}
                </div>
                <div className="col-span-full">
                  <h4 className="font-semibold">Plan de Alimentación</h4>
                  <p className="text-muted-foreground">{resident.diet || 'No especificado.'}</p>
                </div>
                <Separator/>
                 <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <h4 className="font-semibold">Nivel de Dependencia</h4>
                        <Badge variant={resident.dependency === "Dependiente" ? "destructive" : "secondary"}>{resident.dependency}</Badge>
                    </div>
                    <div>
                        <h4 className="font-semibold">Riesgo de Caída</h4>
                        <Badge variant={resident.fallRisk === "Alto" ? "destructive" : resident.fallRisk === "Medio" ? "secondary" : "default"}>{resident.fallRisk}</Badge>
                    </div>
                      <div>
                        <h4 className="font-semibold">Tipo de Sangre</h4>
                        <p className="text-muted-foreground">{resident.bloodType}</p>
                    </div>
                </div>
            </div>
            
            <Separator className="my-4" />

            <h3 className="font-semibold text-base mb-2">Historial de Registros Diarios</h3>
            <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Detalle</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {paginatedLogs.length > 0 ? paginatedLogs.map((log) => (
                          <TableRow key={log.id} onClick={() => handleLogClick(log)} className="cursor-pointer">
                              <TableCell>{new Date(log.endDate).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={log.reportType === 'medico' ? 'border-blue-500' : 'border-orange-500'}>
                                    {log.reportType === 'medico' ? <Stethoscope className="h-3 w-3 mr-1" /> : <Truck className="h-3 w-3 mr-1" />}
                                    {log.reportType === 'medico' ? 'Médico' : 'Suministro'}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {log.reportType === 'medico' 
                                    ? (Array.isArray(log.evolutionNotes) ? log.evolutionNotes[0] : log.evolutionNotes) 
                                    : log.supplyDescription}
                              </TableCell>
                          </TableRow>
                      )) : (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">No hay registros para este residente.</TableCell>
                        </TableRow>
                      )}
                  </TableBody>
                </Table>
            </div>
             {totalPages > 1 && (
                <div className="flex justify-between items-center w-full pt-4">
                    <div className="text-xs text-muted-foreground">
                        Página {currentPage} de {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Anterior
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
             )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button">Cerrar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {selectedLog && (
        <LogDetailDialog 
            isOpen={isDetailDialogOpen} 
            onOpenChange={setIsDetailDialogOpen} 
            log={selectedLog}
            residentName={resident.name}
        />
      )}
    </>
  )
}
