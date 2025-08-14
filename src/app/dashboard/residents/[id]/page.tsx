
"use client"
import { useResidents, Resident, FamilyContact, Medication } from "@/hooks/use-residents";
import { useLogs, Log } from "@/hooks/use-logs";
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableRow, 
  TableCell,
  TableHeader,
  TableHead
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
    FileText, 
    User, 
    Heart, 
    Home, 
    Users, 
    Phone, 
    Mail, 
    Stethoscope, 
    Truck, 
    Pill,
    Utensils,
    AlertTriangle,
    CheckCircle2
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import LogDetailDialog from "../../components/log-detail-dialog";


const ITEMS_PER_PAGE = 10;

function InfoRow({ label, value }: { label: string; value: string | React.ReactNode }) {
    if (!value) return null;
    return (
        <TableRow>
            <TableCell className="font-medium">{label}</TableCell>
            <TableCell>{value}</TableCell>
        </TableRow>
    );
}

export default function ResidentProfilePage({ params }: { params: { id: string } }) {
  
  const residentId = params.id;
  const { residents, isLoading: residentsLoading } = useResidents();
  const { logs, isLoading: logsLoading } = useLogs();

  const [isClient, setIsClient] = useState(false);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const resident = residents.find(r => r.id === residentId);

  const residentLogs = useMemo(() => {
    if (!resident) return [];
    return logs
      .filter(log => log.residentId === resident.id)
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
  }, [logs, resident]);
  
  const totalPages = Math.ceil(residentLogs.length / ITEMS_PER_PAGE);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return residentLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [residentLogs, currentPage]);

  const handleLogClick = (log: Log) => {
    setSelectedLog(log);
    setIsDetailDialogOpen(true);
  };

  const isLoading = residentsLoading || logsLoading;

  if (!isClient || isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold font-headline">Cargando perfil...</h1>
      </div>
    );
  }

  if (!resident) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold font-headline text-destructive">Error</h1>
        <p className="text-lg text-muted-foreground">Residente no encontrado.</p>
      </div>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Activo': return 'default';
        case 'Finalizado': return 'secondary';
        case 'Cancelado': return 'destructive';
        default: return 'outline';
    }
  };


  return (
    <>
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex items-center gap-4">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                <h1 className="text-3xl font-bold font-headline">
                    Perfil de {resident.name}
                </h1>
                <p className="text-muted-foreground">
                    Detalles completos e historial del residente.
                </p>
                </div>
            </div>
            
            <Tabs defaultValue="general">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
                    <TabsTrigger value="general">Perfil General</TabsTrigger>
                    <TabsTrigger value="contacts">Contactos Familiares</TabsTrigger>
                    <TabsTrigger value="logs">Registros Diarios</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="mt-4">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><User />Información Personal</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                <TableBody>
                                    <InfoRow label="Nombre Completo" value={resident.name} />
                                    <InfoRow label="Fecha de Nacimiento" value={`${resident.dob} (${resident.age} años)`} />
                                    <InfoRow label="Cédula" value={resident.idNumber} />
                                    <InfoRow label="Tipo de Sangre" value={<Badge variant="outline">{resident.bloodType || 'N/A'}</Badge>} />
                                </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Home />Detalles de Estadía</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                <TableBody>
                                    <InfoRow label="Estado" value={<Badge variant={resident.status === "Activo" ? "default" : "secondary"} className={resident.status === "Activo" ? "bg-green-500 text-white" : ""}>{resident.status}</Badge>} />
                                    <InfoRow label="Fecha de Ingreso" value={new Date(resident.admissionDate).toLocaleDateString('es-ES', { dateStyle: 'long' })} />
                                    <InfoRow label="Habitación" value={<Badge variant="secondary">{`${resident.roomType} ${resident.roomNumber || ''}`.trim()}</Badge>} />
                                </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                         <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Heart />Información de Cuidado</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                     <div>
                                        <p className="font-semibold mb-1">Nivel de Dependencia</p>
                                        <Badge variant={resident.dependency === "Dependiente" ? "destructive" : "outline"}>{resident.dependency}</Badge>
                                    </div>
                                    <div>
                                        <p className="font-semibold mb-1">Riesgo de Caída</p>
                                        <Badge variant={resident.fallRisk === "Alto" ? "destructive" : resident.fallRisk === "Medio" ? "secondary" : "default"}>{resident.fallRisk}</Badge>
                                    </div>
                                    <div>
                                        <p className="font-semibold mb-1">Alergias</p>
                                        <div className="flex flex-wrap gap-1">{resident.allergies?.length ? resident.allergies.map(a => <Badge key={a} variant="destructive">{a}</Badge>) : <p className="text-muted-foreground">Ninguna</p>}</div>
                                    </div>
                               </div>
                               <div>
                                   <p className="font-semibold mb-2 flex items-center gap-2"><Pill/>Medicamentos</p>
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
                                <div>
                                    <p className="font-semibold mb-1 flex items-center gap-2"><Utensils/>Plan de Alimentación</p>
                                    <p className="text-muted-foreground">{resident.diet || "No especificado."}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="font-semibold mb-1 flex items-center gap-2"><CheckCircle2/>Antecedentes Médicos</p>
                                        <div className="flex flex-wrap gap-1">{resident.medicalHistory?.length ? resident.medicalHistory.map(h => <Badge key={h} variant="outline">{h}</Badge>) : <p className="text-muted-foreground">Ninguno</p>}</div>
                                    </div>
                                    <div>
                                        <p className="font-semibold mb-1 flex items-center gap-2"><AlertTriangle/>Antecedentes Quirúrgicos</p>
                                        <div className="flex flex-wrap gap-1">{resident.surgicalHistory?.length ? resident.surgicalHistory.map(h => <Badge key={h} variant="outline">{h}</Badge>) : <p className="text-muted-foreground">Ninguno</p>}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                
                <TabsContent value="contacts" className="mt-4">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Users/>Contactos Familiares</CardTitle>
                             <CardDescription>Personas a contactar en caso de emergencia.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {resident.familyContacts?.length ? resident.familyContacts.map((contact, index) => (
                                <div key={index} className="p-4 border rounded-lg">
                                    <p className="font-bold text-lg">{contact.name} <Badge variant="secondary">{contact.kinship}</Badge></p>
                                    <div className="text-sm mt-2 space-y-2 text-muted-foreground">
                                        <p className="flex items-center gap-2"><Mail className="h-4 w-4"/> {contact.email}</p>
                                        <p className="flex items-center gap-2"><Phone className="h-4 w-4"/> {contact.phones.map(p => p.number).join(', ')}</p>
                                        <p className="flex items-center gap-2"><Home className="h-4 w-4"/> {contact.address}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-muted-foreground text-center p-4">No hay contactos familiares registrados.</p>
                            )}
                        </CardContent>
                     </Card>
                </TabsContent>

                <TabsContent value="logs" className="mt-4">
                     <Card>
                        <CardHeader>
                            <CardTitle>Historial de Registros</CardTitle>
                             <CardDescription>Todos los reportes médicos y de suministros para {resident.name}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Tipo de Reporte</TableHead>
                                        <TableHead>Detalle Principal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                {paginatedLogs.length > 0 ? (
                                    paginatedLogs.map((log) => (
                                    <TableRow key={log.id} onClick={() => handleLogClick(log)} className="cursor-pointer">
                                        <TableCell className="font-medium">{new Date(log.endDate).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={log.reportType === 'medico' ? 'border-blue-500' : 'border-orange-500'}>
                                                {log.reportType === 'medico' ? <Stethoscope className="h-3 w-3 mr-1" /> : <Truck className="h-3 w-3 mr-1" />}
                                                {log.reportType === 'medico' ? 'Médico' : 'Suministro'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">
                                            {log.reportType === 'medico' ? (Array.isArray(log.evolutionNotes) && log.evolutionNotes.length > 0 ? log.evolutionNotes[0] : 'Sin notas de evolución') : log.supplyDescription}
                                        </TableCell>
                                    </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">
                                            No se han encontrado registros para este residente.
                                        </TableCell>
                                    </TableRow>
                                )}
                                </TableBody>
                            </Table>
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
                        </CardContent>
                     </Card>
                </TabsContent>
            </Tabs>
        </div>

        {selectedLog && (
            <LogDetailDialog 
                isOpen={isDetailDialogOpen} 
                onOpenChange={setIsDetailDialogOpen} 
                log={selectedLog}
                residentName={resident.name}
            />
        )}
    </>
  );
}

