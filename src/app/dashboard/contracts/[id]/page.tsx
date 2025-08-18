
"use client"
import { useEffect, useState, Suspense, use } from "react"
import { useSearchParams } from "next/navigation"
import { useContracts as useResidentContracts } from "@/hooks/use-contracts"
import { useStaffContracts } from "@/hooks/use-staff-contracts"
import { useResidents } from "@/hooks/use-residents"
import { useStaff } from "@/hooks/use-staff"
import { useSettings } from "@/hooks/use-settings"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Printer, User, FileText, Calendar, AlertTriangle, Edit, Save, DollarSign, Percent, Briefcase, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"

function ContractDetailPageContent({ id }: { id: string }) {
    const searchParams = useSearchParams()
    const contractType = searchParams.get('type') || 'resident';

    // Hooks
    const { contracts: residentContracts, isLoading: residentContractsLoading } = useResidentContracts()
    const { contracts: staffContracts, isLoading: staffContractsLoading } = useStaffContracts()
    const { residents, isLoading: residentsLoading } = useResidents()
    const { staff, isLoading: staffLoading } = useStaff()
    const { settings, isLoading: settingsLoading } = useSettings()
    const { toast } = useToast()

    // State
    const [isClient, setIsClient] = useState(false)
    
    useEffect(() => {
        setIsClient(true)
    }, [])
    
    // Data selection based on contract type
    const contract = contractType === 'resident' 
        ? residentContracts.find(c => c.id === id) 
        : staffContracts.find(c => c.id === id);

    const person = contractType === 'resident'
        ? residents.find(r => r.id === (contract as any)?.residentId)
        : staff.find(s => s.id === (contract as any)?.staffId);


    const isLoading = residentsLoading || staffLoading || residentContractsLoading || staffContractsLoading || settingsLoading;

    if (!isClient || isLoading) {
        return <div>Cargando...</div>
    }

    if (!contract || !person) {
        return <div className="text-center text-destructive flex items-center gap-2"><AlertTriangle/>No se encontró el contrato o la persona asociada.</div>
    }

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Activo': return 'default';
            case 'Finalizado': return 'secondary';
            case 'Cancelado': return 'destructive';
            default: return 'outline';
        }
    };
    
    const getResidentContractValueDetails = (type: 'Habitación compartida' | 'Habitación individual') => {
        const baseValue = settings.prices[type] || 0;
        const vatRate = settings.vatEnabled ? (settings.vatRate || 0) / 100 : 0;
        const vatValue = baseValue * vatRate;
        const totalValue = baseValue + vatValue;
        
        const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

        return {
            base: formatCurrency(baseValue),
            vat: formatCurrency(vatValue),
            total: formatCurrency(totalValue),
            vatEnabled: settings.vatEnabled
        }
    }
    
    const contractValues = contractType === 'resident' ? getResidentContractValueDetails((contract as any).contractType) : null;
    const staffSalaryFormatted = contractType === 'staff' ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format((contract as any).salary) : null;

    const handleDownload = () => {
       toast({ title: "Descarga Iniciada", description: `Descargando ${contract.documentName}`})
       // In a real app, this would trigger a download from contract.documentUrl
    }


    return (
        <>
            <div className="flex items-center gap-4">
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold font-headline tracking-tight sm:grow-0">
                    Detalle del Contrato
                </h1>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                 <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><FileText/>Información del Contrato</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-3">
                            <div className="flex justify-between">
                                <span className="font-semibold">ID Contrato:</span>
                                <span>{contract.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold">Tipo:</span>
                                <span>{contractType === 'resident' ? `Contrato de Servicios (${(contract as any).contractType})` : 'Contrato Laboral'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold">Estado:</span>
                                <Badge variant={getStatusVariant(contract.status)}>{contract.status}</Badge>
                            </div>
                            {contractValues && (
                                <>
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold flex items-center gap-1.5"><DollarSign size={14}/>Valor Base Mensual:</span>
                                        <span className="font-semibold">{contractValues.base}</span>
                                    </div>
                                    {contractValues.vatEnabled && (
                                        <div className="flex justify-between items-center text-muted-foreground pl-5">
                                            <span className="flex items-center gap-1.5"><Percent size={12}/>IVA ({settings.vatRate}%):</span>
                                            <span>{contractValues.vat}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-base">
                                        <span className="font-bold flex items-center gap-1.5"><DollarSign size={14}/>Total Mensual:</span>
                                        <span className="font-bold">{contractValues.total}</span>
                                    </div>
                                </>
                            )}
                            {staffSalaryFormatted && (
                                 <div className="flex justify-between items-center text-base">
                                    <span className="font-bold flex items-center gap-1.5"><DollarSign size={14}/>Salario Mensual:</span>
                                    <span className="font-bold">{staffSalaryFormatted}</span>
                                </div>
                            )}
                             <div className="flex justify-between items-center">
                                <span className="font-semibold flex items-center gap-1.5"><Calendar size={14}/>Fecha de Inicio:</span>
                                <span>{new Date(contract.startDate).toLocaleDateString('es-ES', { dateStyle: 'long' })}</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="font-semibold flex items-center gap-1.5"><Calendar size={14}/>Fecha de Fin:</span>
                                <span>{new Date(contract.endDate).toLocaleDateString('es-ES', { dateStyle: 'long' })}</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="font-semibold flex items-center gap-1.5"><Calendar size={14}/>Fecha de Creación:</span>
                                <span>{new Date(contract.createdAt).toLocaleDateString('es-ES', { dateStyle: 'long' })}</span>
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                             <CardTitle className="flex items-center gap-2">
                                {contractType === 'resident' ? <User/> : <Briefcase />}
                                Información d{contractType === 'resident' ? 'el Residente' : 'el Empleado'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-3">
                            <div className="flex justify-between">
                                <span className="font-semibold">Nombre:</span>
                                <span>{person.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold">Cédula:</span>
                                <span>{person.idNumber}</span>
                            </div>
                            {contractType === 'resident' && (
                                <>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Edad:</span>
                                        <span>{(person as any).age}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Habitación:</span>
                                        <Badge variant={(person as any).roomType === "Habitación individual" ? "default" : "secondary"}>{(person as any).roomType} {(person as any).roomNumber}</Badge>
                                    </div>
                                </>
                            )}
                            {contractType === 'staff' && (
                                <div className="flex justify-between">
                                    <span className="font-semibold">Cargo:</span>
                                    <span>{(person as any).role}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Documento del Contrato</CardTitle>
                            <CardDescription>
                                Visualice o descargue el documento PDF del contrato adjunto.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {contract.documentUrl ? (
                                <div className="flex items-center justify-center p-6 border-2 border-dashed rounded-md">
                                    <div className="text-center">
                                        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                                        <p className="mt-2 font-semibold">{contract.documentName}</p>
                                        <Button onClick={handleDownload} className="mt-4">
                                            <Download className="mr-2 h-4 w-4" />
                                            Descargar Contrato
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground p-6">
                                    No se adjuntó ningún documento para este contrato.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    )
}


export default function ContractDetailPage({ params }: { params: { id: string } }) {
    const { id } = use(params);
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <ContractDetailPageContent id={id} />
        </Suspense>
    )
}
