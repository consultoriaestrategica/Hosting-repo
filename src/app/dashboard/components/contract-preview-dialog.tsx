
"use client"
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
import { Contract } from "@/hooks/use-contracts"
import { useSettings } from "@/hooks/use-settings"
import { FileText, Calendar, DollarSign, Percent, ExternalLink } from "lucide-react"
import Link from "next/link"


interface ContractPreviewDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  contract: Contract | null
  residentName: string
  role: string
}

export default function ContractPreviewDialog({ isOpen, onOpenChange, contract, residentName, role }: ContractPreviewDialogProps) {
  const { settings } = useSettings();

  if (!contract) return null;

  const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Activo': return 'default';
        case 'Finalizado': return 'secondary';
        case 'Cancelado': return 'destructive';
        default: return 'outline';
    }
  };

  const getContractValueDetails = (type: 'Habitación compartida' | 'Habitación individual') => {
    const baseValue = settings.prices[type] || 0;
    const vatRate = settings.vatEnabled ? (settings.vatRate || 0) / 100 : 0;
    const vatValue = baseValue * vatRate;
    const totalValue = baseValue + vatValue;
    
    const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

    return {
        base: formatCurrency(baseValue),
        vat: formatCurrency(vatValue),
        total: formatCurrency(totalValue),
        vatEnabled: settings.vatEnabled,
        vatRate: settings.vatRate
    }
  }

  const contractValues = getContractValueDetails(contract.contractType);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
             <FileText className="mr-2" />
             Vista Rápida del Contrato
          </DialogTitle>
          <DialogDescription>
            Contrato de {residentName} del {new Date(contract.createdAt).toLocaleDateString('es-ES', { dateStyle: 'long' })}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
           <div className="text-sm space-y-3">
                <div className="flex justify-between">
                    <span className="font-semibold">ID Contrato:</span>
                    <span>{contract.id}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="font-semibold">Tipo:</span>
                    <span>Contrato de Servicios ({contract.contractType})</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-semibold">Estado:</span>
                    <Badge variant={getStatusVariant(contract.status)}>{contract.status}</Badge>
                </div>
                <div className="flex justify-between items-center">
                    <span className="font-semibold flex items-center gap-1.5"><DollarSign size={14}/>Valor Base Mensual:</span>
                    <span className="font-semibold">{contractValues.base}</span>
                </div>
                {contractValues.vatEnabled && (
                    <div className="flex justify-between items-center text-muted-foreground pl-5">
                        <span className="flex items-center gap-1.5"><Percent size={12}/>IVA ({contractValues.vatRate}%):</span>
                        <span>{contractValues.vat}</span>
                    </div>
                )}
                 <div className="flex justify-between items-center text-base">
                    <span className="font-bold flex items-center gap-1.5"><DollarSign size={14}/>Total Mensual:</span>
                    <span className="font-bold">{contractValues.total}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="font-semibold flex items-center gap-1.5"><Calendar size={14}/>Fecha de Inicio:</span>
                    <span>{new Date(contract.startDate).toLocaleDateString('es-ES', { dateStyle: 'long' })}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="font-semibold flex items-center gap-1.5"><Calendar size={14}/>Fecha de Fin:</span>
                    <span>{new Date(contract.endDate).toLocaleDateString('es-ES', { dateStyle: 'long' })}</span>
                </div>
            </div>
        </div>

        <DialogFooter>
           <Button type="button" variant="outline" asChild>
                <Link href={`/dashboard/contracts/${contract.id}?role=${role}`}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver Contrato Completo
                </Link>
            </Button>
          <DialogClose asChild>
            <Button type="button">Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
