
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
import { Log } from "@/hooks/use-logs"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { Stethoscope, Truck, Heart, Wind, Droplets, Utensils, User, Calendar, FileText, StickyNote, Image as ImageIcon, FileDown } from "lucide-react"

interface LogDetailDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  log: Log | null
  residentName: string
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string | number | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start">
      <div className="flex items-center w-48">
        {icon}
        <span className="font-semibold ml-2">{label}</span>
      </div>
      <span className="ml-4 text-muted-foreground">{value}</span>
    </div>
  )
}

export default function LogDetailDialog({ isOpen, onOpenChange, log, residentName }: LogDetailDialogProps) {
  const { toast } = useToast()
  
  if (!log) return null

  const isMedical = log.reportType === 'medico';

  const handleExportPdf = () => {
    toast({
        title: "Generando PDF...",
        description: `El reporte para ${residentName} se está exportando.`
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
             {isMedical ? <Stethoscope className="mr-2" /> : <Truck className="mr-2" />}
             Detalle del Reporte {isMedical ? 'Médico' : 'de Suministro'}
          </DialogTitle>
          <DialogDescription>
            Reporte para {residentName} del {new Date(log.date).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            {isMedical ? (
                <>
                    <h3 className="font-semibold text-lg mb-2">Signos Vitales y Observaciones</h3>
                    <div className="space-y-3">
                        <DetailItem icon={<Heart size={16}/>} label="Frecuencia Cardíaca" value={log.heartRate ? `${log.heartRate} lpm` : 'N/A'} />
                        <DetailItem icon={<Wind size={16}/>} label="Frecuencia Respiratoria" value={log.respiratoryRate ? `${log.respiratoryRate} rpm` : 'N/A'} />
                        <DetailItem icon={<Droplets size={16}/>} label="Saturación de Oxígeno" value={log.spo2 ? `${log.spo2}%` : 'N/A'} />
                        <DetailItem icon={<Utensils size={16}/>} label="Alimentación" value={log.feedingType || 'N/A'} />
                    </div>
                    <Separator className="my-4" />
                    <div>
                        <h4 className="font-semibold flex items-center mb-2"><StickyNote size={16} className="mr-2"/>Notas de Evolución</h4>
                        <p className="text-muted-foreground bg-muted p-3 rounded-md">{log.evolutionNotes || 'Sin notas.'}</p>
                    </div>
                     {log.photoEvidenceUrl && (
                        <>
                        <Separator className="my-4" />
                        <div>
                             <h4 className="font-semibold flex items-center mb-2"><ImageIcon size={16} className="mr-2"/>Evidencia Fotográfica</h4>
                            <img src={log.photoEvidenceUrl} alt="Evidencia fotográfica" className="rounded-lg border w-full object-contain" />
                        </div>
                        </>
                    )}
                </>
            ) : (
                <>
                     <h3 className="font-semibold text-lg mb-2">Detalles de la Entrega</h3>
                     <div className="space-y-3">
                        <DetailItem icon={<User size={16}/>} label="Entregado por" value={log.supplierName || 'N/A'} />
                        <DetailItem icon={<Calendar size={16}/>} label="Fecha de Entrega" value={log.supplyDate ? new Date(log.supplyDate).toLocaleDateString() : 'N/A'} />
                     </div>
                     <Separator className="my-4" />
                     <div>
                        <h4 className="font-semibold flex items-center mb-2"><FileText size={16} className="mr-2"/>Descripción del Suministro</h4>
                        <p className="text-muted-foreground bg-muted p-3 rounded-md">{log.supplyDescription || 'Sin descripción.'}</p>
                    </div>
                     <Separator className="my-4" />
                     <div>
                        <h4 className="font-semibold flex items-center mb-2"><StickyNote size={16} className="mr-2"/>Notas Adicionales</h4>
                        <p className="text-muted-foreground bg-muted p-3 rounded-md">{log.supplyNotes || 'Sin notas.'}</p>
                    </div>
                    {log.supplyPhotoEvidenceUrl && (
                        <>
                        <Separator className="my-4" />
                        <div>
                             <h4 className="font-semibold flex items-center mb-2"><ImageIcon size={16} className="mr-2"/>Evidencia Fotográfica</h4>
                            <img src={log.supplyPhotoEvidenceUrl} alt="Evidencia del suministro" className="rounded-lg border w-full object-contain" />
                        </div>
                        </>
                    )}
                </>
            )}
        </div>

        <DialogFooter>
           <Button type="button" variant="outline" onClick={handleExportPdf}>
                <FileDown className="mr-2 h-4 w-4" />
                Exportar a PDF
            </Button>
          <DialogClose asChild>
            <Button type="button">Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
