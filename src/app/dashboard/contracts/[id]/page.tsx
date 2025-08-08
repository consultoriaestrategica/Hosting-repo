"use client"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useContracts } from "@/hooks/use-contracts"
import { useResidents } from "@/hooks/use-residents"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Printer, User, FileText, Calendar, AlertTriangle } from "lucide-react"
import { marked } from "marked"
import { useToast } from "@/hooks/use-toast"

function ContractDetailPageContent({ id }: { id: string }) {
    const { contracts, isLoading: contractsLoading } = useContracts()
    const { residents, isLoading: residentsLoading } = useResidents()
    const [isClient, setIsClient] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        setIsClient(true)
    }, [])

    const contract = contracts.find(c => c.id === id)
    const resident = contract ? residents.find(r => r.id === contract.residentId) : null

    if (!isClient || contractsLoading || residentsLoading) {
        return <div>Cargando...</div>
    }

    if (!contract || !resident) {
        return <div className="text-center text-destructive flex items-center gap-2"><AlertTriangle/>No se encontró el contrato o el residente asociado.</div>
    }

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Activo': return 'default';
            case 'Finalizado': return 'secondary';
            case 'Cancelado': return 'destructive';
            default: return 'outline';
        }
    };
    
    const handlePrint = () => {
       const printWindow = window.open('', '_blank');
       if(printWindow) {
            printWindow.document.write('<html><head><title>Contrato</title>');
            printWindow.document.write('<style>body { font-family: sans-serif; } .prose { max-width: 100%; } </style>');
            printWindow.document.write('</head><body>');
            const contractHtml = marked.parse(contract.details);
            printWindow.document.write(contractHtml as string);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
       } else {
            toast({ variant: "destructive", title: "Error", description: "No se pudo abrir la ventana de impresión. Revise la configuración de su navegador."})
       }
    }


    return (
        <>
            <div className="flex items-center gap-4">
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold font-headline tracking-tight sm:grow-0">
                    Detalle del Contrato
                </h1>
                <div className="hidden items-center gap-2 md:ml-auto md:flex">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir / Guardar PDF
                    </Button>
                </div>
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
                                <span>Contrato de Servicios {contract.contractType}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold">Estado:</span>
                                <Badge variant={getStatusVariant(contract.status)}>{contract.status}</Badge>
                            </div>
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
                             <CardTitle className="flex items-center gap-2"><User/>Información del Residente</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-3">
                            <div className="flex justify-between">
                                <span className="font-semibold">Nombre:</span>
                                <span>{resident.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold">Cédula:</span>
                                <span>{resident.idNumber}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="font-semibold">Edad:</span>
                                <span>{resident.age}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="font-semibold">Habitación:</span>
                                <Badge variant={resident.roomType === "Premium" ? "default" : "secondary"}>{resident.roomType}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contenido del Contrato</CardTitle>
                            <CardDescription>Este es el texto completo del contrato generado. Revíselo cuidadosamente.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div className="prose prose-sm max-w-none border rounded-md p-4 bg-muted/50 overflow-y-auto max-h-[60vh]" dangerouslySetInnerHTML={{ __html: marked.parse(contract.details) as string }}></div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    )
}


export default function ContractDetailPage({ params }: { params: { id: string } }) {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <ContractDetailPageContent id={params.id} />
        </Suspense>
    )
}
