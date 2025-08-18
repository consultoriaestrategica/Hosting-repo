
"use client"
import { useResidents, Resident, DischargeDetails, AgendaEvent } from "@/hooks/use-residents";
import { useLogs, Log } from "@/hooks/use-logs";
import { useContracts as useResidentContracts } from "@/hooks/use-contracts";
import { useToast } from "@/hooks/use-toast";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
    AlertTriangle,
    CheckCircle2,
    BookUser,
    Calendar,
    Eye,
    Utensils,
    LogOut,
    MessageSquareWarning,
    Edit,
    PlusCircle,
    Trash2
} from "lucide-react";
import { useState, useMemo, useEffect, Suspense, use } from "react";
import LogDetailDialog from "../../components/log-detail-dialog";
import DischargeForm from "./discharge-form"
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AlertForm from "./alert-form";
import NewLogForm from "./new-log-form";
import AgendaForm from "../../components/agenda-form";


const ITEMS_PER_PAGE = 10;

function InfoRow({ label, value }: { label: string; value: string | React.ReactNode }) {
    if (!value && value !== 0) return null; // Allow 0 to be displayed
    return (
        <TableRow>
            <TableCell className="font-medium w-1/3">{label}</TableCell>
            <TableCell>{value}</TableCell>
        </TableRow>
    );
}

function ResidentProfilePageContent({ id: residentId }: { id: string }) {
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'admin';
  const { residents, dischargeResident, addAgendaEvent, updateAgendaEvent, deleteAgendaEvent, isLoading: residentsLoading } = useResidents();
  const { logs, isLoading: logsLoading } = useLogs();
  const { contracts: residentContracts, isLoading: contractsLoading } = useResidentContracts();
  const { toast } = useToast()

  const [isClient, setIsClient] = useState(false);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDischargeDialogOpen, setIsDischargeDialogOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [isNewLogDialogOpen, setIsNewLogDialogOpen] = useState(false);
  const [isAgendaFormOpen, setIsAgendaFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const resident = residents.find(r => r.id === residentId);

  const filteredContracts = useMemo(() => {
    return residentContracts
        .filter(c => c.residentId === residentId)
        .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [residentContracts, residentId]);

  const residentLogs = useMemo(() => {
    if (!resident) return [];
    return logs
      .filter(log => log.residentId === resident.id)
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
  }, [logs, resident]);

  const sortedAgendaEvents = useMemo(() => {
    if (!resident?.agendaEvents) return [];
    return [...resident.agendaEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [resident]);
  
  const totalPages = Math.ceil(residentLogs.length / ITEMS_PER_PAGE);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return residentLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [residentLogs, currentPage]);

  const handleLogClick = (log: Log) => {
    setSelectedLog(log);
    setIsDetailDialogOpen(true);
  };

  const handleDischargeSubmit = (data: Omit<DischargeDetails, 'observations'> & { observations?: string }) => {
    if (!resident) return;
    dischargeResident(resident.id, data);
    toast({
        title: "Residente dado de baja",
        description: `${resident.name} ha sido marcado como inactivo.`,
    });
    setIsDischargeDialogOpen(false);
  }

  const handleAgendaFormSubmit = (residentId: string, data: Omit<AgendaEvent, 'id'>) => {
    if (!resident) return;
    if (selectedEvent) {
      updateAgendaEvent(resident.id, selectedEvent.id, data);
      toast({ title: "Evento Actualizado", description: `El evento "${data.title}" ha sido actualizado.` });
    } else {
      addAgendaEvent(resident.id, data);
      toast({ title: "Evento Agendado", description: `Se ha añadido un nuevo evento para ${resident.name}.` });
    }
    setIsAgendaFormOpen(false);
    setSelectedEvent(null);
  };

  const handleOpenAgendaDialog = (event: AgendaEvent | null = null) => {
    setSelectedEvent(event);
    setIsAgendaFormOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (!resident) return;
    deleteAgendaEvent(resident.id, eventId);
    toast({ variant: 'destructive', title: 'Evento Eliminado', description: 'El evento ha sido eliminado de la agenda.' });
  }

  const isLoading = residentsLoading || logsLoading || contractsLoading;

  if (!isClient || isLoading) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-3xl font-bold font-headline">Cargando perfil...</h1>
      </div>
    );
  }

  if (!resident) {
    return (
      <div className="p-4 md:p-8">
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

   const getAgendaStatusVariant = (status: string) => {
    switch (status) {
      case 'Pendiente': return 'default';
      case 'Completado': return 'secondary';
      case 'Cancelado': return 'destructive';
      default: return 'outline';
    }
  };


  return (
    <>
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                    <FileText className="h-8 w-8 text-primary mt-1" />
                    <div>
                        <h1 className="text-3xl font-bold font-headline">
                            Perfil de {resident.name}
                        </h1>
                        <p className="text-muted-foreground">
                            Detalles completos e historial del residente.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {resident.status === 'Activo' && role === 'admin' && (
                        <Button asChild variant="outline">
                            <Link href={`/dashboard/residents/edit/${resident.id}`}>
                                <Edit className="mr-2 h-4 w-4"/>
                                Editar Perfil
                            </Link>
                        </Button>
                    )}
                    {resident.status === 'Activo' && (
                         <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-50 hover:text-amber-700">
                                    <MessageSquareWarning className="mr-2 h-4 w-4"/>
                                    Enviar Alerta
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Enviar Alerta de Emergencia</DialogTitle>
                                    <DialogDescription>
                                    Seleccione el contacto y redacte el mensaje para notificar por WhatsApp.
                                    </DialogDescription>
                                </DialogHeader>
                                <AlertForm resident={resident} onFormSubmit={() => setIsAlertDialogOpen(false)}/>
                            </DialogContent>
                        </Dialog>
                    )}
                    {resident.status === 'Activo' && (
                        <Dialog open={isDischargeDialogOpen} onOpenChange={setIsDischargeDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="destructive">
                                    <LogOut className="mr-2 h-4 w-4"/>
                                    Dar de Baja
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Dar de Baja a {resident.name}</DialogTitle>
                                    <DialogDescription>
                                    Complete la información para registrar la salida del residente. Esta acción cambiará su estado a "Inactivo".
                                    </DialogDescription>
                                </DialogHeader>
                                <DischargeForm resident={resident} onSubmit={handleDischargeSubmit} />
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>
            
            <Tabs defaultValue="general">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-5">
                    <TabsTrigger value="general">Perfil General</TabsTrigger>
                    <TabsTrigger value="contacts">Contactos</TabsTrigger>
                    <TabsTrigger value="contracts">Contratos</TabsTrigger>
                    <TabsTrigger value="agenda">Agenda</TabsTrigger>
                    <TabsTrigger value="logs">Registros</TabsTrigger>
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
                                     {resident.dischargeDetails && (
                                        <>
                                         <InfoRow label="Fecha de Salida" value={new Date(resident.dischargeDetails.dischargeDate).toLocaleDateString('es-ES', { dateStyle: 'long' })} />
                                         <InfoRow label="Motivo de Salida" value={resident.dischargeDetails.reason} />
                                         <InfoRow label="Observaciones" value={resident.dischargeDetails.observations} />
                                        </>
                                     )}
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
                
                <TabsContent value="contracts" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><BookUser />Historial de Contratos</CardTitle>
                            <CardDescription>Todos los contratos de servicios para {resident.name}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha Creación</TableHead>
                                        <TableHead>Tipo de Contrato</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead><span className="sr-only">Acciones</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredContracts.length > 0 ? (
                                        filteredContracts.map(c => (
                                            <TableRow key={c.id}>
                                                <TableCell>{new Date(c.createdAt).toLocaleDateString('es-ES')}</TableCell>
                                                <TableCell>Servicios ({c.contractType})</TableCell>
                                                <TableCell><Badge variant={getStatusVariant(c.status)}>{c.status}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <Button asChild variant="outline" size="sm">
                                                        <Link href={`/dashboard/contracts/${c.id}?role=${role}&type=resident`}>
                                                            <Eye className="mr-2 h-4 w-4"/> Ver Detalle
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">No se encontraron contratos.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                 <TabsContent value="agenda" className="mt-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2"><Calendar />Agenda de Eventos</CardTitle>
                                <CardDescription>Citas, recordatorios y gestiones para {resident.name}.</CardDescription>
                            </div>
                            <Button size="sm" onClick={() => handleOpenAgendaDialog()}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Agendar Evento
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha y Hora</TableHead>
                                        <TableHead>Evento</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedAgendaEvents.length > 0 ? (
                                        sortedAgendaEvents.map(event => (
                                            <TableRow key={event.id}>
                                                <TableCell>{new Date(event.date).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</TableCell>
                                                <TableCell>
                                                    <p className="font-semibold">{event.title}</p>
                                                    <p className="text-xs text-muted-foreground">{event.description}</p>
                                                </TableCell>
                                                <TableCell>{event.type}</TableCell>
                                                <TableCell><Badge variant={getAgendaStatusVariant(event.status)}>{event.status}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenAgendaDialog(event)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteEvent(event.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">No hay eventos agendados.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="logs" className="mt-4">
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Historial de Registros</CardTitle>
                                <CardDescription>Todos los reportes médicos y de suministros para {resident.name}.</CardDescription>
                            </div>
                             <Dialog open={isNewLogDialogOpen} onOpenChange={setIsNewLogDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm">
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Agregar Registro
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-4xl">
                                    <DialogHeader>
                                        <DialogTitle>Agregar Registro para {resident.name}</DialogTitle>
                                        <DialogDescription>Seleccione el tipo de reporte y complete la información.</DialogDescription>
                                    </DialogHeader>
                                    <NewLogForm residentId={resident.id} onFormSubmit={() => setIsNewLogDialogOpen(false)} />
                                </DialogContent>
                            </Dialog>
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
        
        <Dialog open={isAgendaFormOpen} onOpenChange={setIsAgendaFormOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{selectedEvent ? 'Editar Evento' : 'Agendar Nuevo Evento'}</DialogTitle>
                    <DialogDescription>
                        Complete los detalles del evento para {resident.name}.
                    </DialogDescription>
                </DialogHeader>
                <AgendaForm 
                    residentId={resident.id}
                    event={selectedEvent} 
                    onSubmit={handleAgendaFormSubmit}
                    onCancel={() => {
                        setIsAgendaFormOpen(false);
                        setSelectedEvent(null);
                    }}
                />
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
  );
}


export default function ResidentProfilePage({ params }: { params: { id: string } }) {
    const id = use(params).id;
    return (
      <Suspense fallback={<div>Cargando...</div>}>
        <ResidentProfilePageContent id={id} />
      </Suspense>
    );
}
