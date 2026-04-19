"use client";
import * as React from "react";
import { useResidents, Resident, DischargeDetails, AgendaEvent } from "@/hooks/use-residents";
import { useLogs, Log } from "@/hooks/use-logs";
import ContractAttachment from "../../components/contract-attachment";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHeader,
  TableHead,
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Trash2,
  Download,
  MoreHorizontal,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import LogDetailDialog from "../../components/log-detail-dialog";
import DischargeForm from "./discharge-form";
import Link from "next/link";
import AlertForm from "./alert-form";
import NewLogForm from "./new-log-form";
import AgendaForm from "../../components/agenda-form";
import { PartialEvolutionForm } from "../../logs/partial-evolution-form";

const ITEMS_PER_PAGE = 10;

function InfoRow({ label, value }: { label: string; value: string | React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <TableRow>
      <TableCell className="font-medium w-1/3">{label}</TableCell>
      <TableCell>{value}</TableCell>
    </TableRow>
  );
}

// ✅ Este es el componente principal que se exporta
export default function ResidentProfilePageContent({ id: residentId }: { id: string }) {
  const { residents, dischargeResident, addAgendaEvent, updateAgendaEvent, deleteAgendaEvent, isLoading: residentsLoading } = useResidents();
  const { logs, isLoading: logsLoading } = useLogs();
  const { toast } = useToast();
  const { user, role, hasPermission } = useUser();

  // Memoizar el residente específico para evitar re-renders innecesarios
  const resident = React.useMemo(
    () => residents.find(r => r.id === residentId),
    [residents, residentId]
  );

  const [isClient, setIsClient] = useState(false);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDischargeDialogOpen, setIsDischargeDialogOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [isNewLogDialogOpen, setIsNewLogDialogOpen] = useState(false);
  const [isAgendaFormOpen, setIsAgendaFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPartialEvolutionDialogOpen, setIsPartialEvolutionDialogOpen] = useState(false);
  const [logForPartialEvolution, setLogForPartialEvolution] = useState<Log | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isDetailDialogOpen && !isDischargeDialogOpen && !isAlertDialogOpen && !isNewLogDialogOpen && !isAgendaFormOpen && !isPartialEvolutionDialogOpen) {
      const cleanup = () => {
        if (!document.querySelector('[data-state="open"][role="dialog"]')) {
          document.body.style.pointerEvents = '';
          document.body.style.removeProperty('pointer-events');
          if (document.body.style.length === 0) document.body.removeAttribute('style');
        }
      };
      cleanup();
      const t1 = setTimeout(cleanup, 150);
      const t2 = setTimeout(cleanup, 500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [isDetailDialogOpen, isDischargeDialogOpen, isAlertDialogOpen, isNewLogDialogOpen, isAgendaFormOpen, isPartialEvolutionDialogOpen]);

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
  };

  const generateGoogleCalendarLink = (event: Omit<AgendaEvent, 'id' | 'status'>, userEmail?: string) => {
    const startTime = new Date(event.date).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endTime = new Date(new Date(event.date).getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const details = encodeURIComponent(event.description || '');
    const text = encodeURIComponent(event.title);
    const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${startTime}/${endTime}&details=${details}`;

    if (userEmail) {
      return `${calendarUrl}&add=${encodeURIComponent(userEmail)}`;
    }
    return calendarUrl;
  };

  const handleAgendaFormSubmit = (residentId: string, data: Omit<AgendaEvent, 'id'>, syncWithCalendar: boolean) => {
    if (!resident) return;

    if (selectedEvent) {
      updateAgendaEvent(resident.id, selectedEvent.id, data);
      toast({
        title: "Evento Actualizado",
        description: `El evento "${data.title}" ha sido actualizado.`,
      });
    } else {
      addAgendaEvent(resident.id, data);
      toast({
        title: "Evento Agendado",
        description: `Se ha añadido un nuevo evento para ${resident.name}.`,
      });
    }

    if (syncWithCalendar) {
      const calendarLink = generateGoogleCalendarLink(data, user?.email);
      window.open(calendarLink, '_blank');
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
  };

  const isLoading = residentsLoading || logsLoading;

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

  const isAdminRole = role === 'Administrador';

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
      <div className="p-4 md:p-6 space-y-6">
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
            {resident.status === 'Activo' && hasPermission("staff") && (
              <Button asChild variant="outline">
                <Link href={`/dashboard/residents/edit/${resident.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Perfil
                </Link>
              </Button>
            )}
            {resident.status === 'Activo' && (
              <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-50 hover:text-amber-700">
                    <MessageSquareWarning className="mr-2 h-4 w-4" />
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
                  <AlertForm resident={resident} onFormSubmit={() => setIsAlertDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            )}
            {resident.status === 'Activo' && hasPermission("staff") && (
              <Dialog open={isDischargeDialogOpen} onOpenChange={setIsDischargeDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <LogOut className="mr-2 h-4 w-4" />
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
          <div className="overflow-x-auto -mx-4 px-4 pb-1">
          <TabsList className="inline-flex h-auto w-auto min-w-full flex-nowrap justify-start">
            <TabsTrigger value="general">Perfil General</TabsTrigger>
            {isAdminRole && (
              <>
                <TabsTrigger value="contacts">
                  Contactos {resident.familyContacts && resident.familyContacts.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{resident.familyContacts.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="documents">
                  Documentos {resident.documents && resident.documents.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{resident.documents.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="contracts">
                  Contrato {(resident as any).contract && (
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">1</Badge>
                  )}
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="agenda">
              Agenda {resident.agendaEvents && resident.agendaEvents.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{resident.agendaEvents.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="logs">
              Registros {residentLogs.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{residentLogs.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          </div>

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
                      <InfoRow label="Tipo de Sangre" value={resident.bloodType ? <Badge variant="outline">{resident.bloodType}</Badge> : <span className="text-muted-foreground text-sm">No registrado</span>} />
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
                    <p className="font-semibold mb-2 flex items-center gap-2"><Pill />Medicamentos</p>
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
                    <p className="font-semibold mb-1 flex items-center gap-2"><Utensils />Plan de Alimentación</p>
                    <p className="text-muted-foreground">{resident.diet || "No especificado."}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold mb-1 flex items-center gap-2"><CheckCircle2 />Antecedentes Médicos</p>
                      <div className="flex flex-wrap gap-1">{resident.medicalHistory?.length ? resident.medicalHistory.map(h => <Badge key={h} variant="outline">{h}</Badge>) : <p className="text-muted-foreground">Ninguno</p>}</div>
                    </div>
                    <div>
                      <p className="font-semibold mb-1 flex items-center gap-2"><AlertTriangle />Antecedentes Quirúrgicos</p>
                      <div className="flex flex-wrap gap-1">{resident.surgicalHistory?.length ? resident.surgicalHistory.map(h => <Badge key={h} variant="outline">{h}</Badge>) : <p className="text-muted-foreground">Ninguno</p>}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {isAdminRole && (
            <>
              <TabsContent value="contacts" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users />Contactos Familiares</CardTitle>
                    <CardDescription>Personas a contactar en caso de emergencia.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {resident.familyContacts?.length ? resident.familyContacts.map((contact, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="font-bold text-lg">{contact.name} <Badge variant="secondary">{contact.kinship}</Badge></div>
                        <div className="text-sm mt-2 space-y-2 text-muted-foreground">
                          <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {contact.email}</p>
                          <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {contact.phones.map(p => p.number).join(', ')}</p>
                          <p className="flex items-center gap-2"><Home className="h-4 w-4" /> {contact.address}</p>
                        </div>
                      </div>
                    )) : (
                      <p className="text-muted-foreground text-center p-4">No hay contactos familiares registrados.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText />Documentos Adjuntos</CardTitle>
                    <CardDescription>Archivos y documentos asociados a {resident.name}.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Mobile View */}
                    <div className="space-y-4 md:hidden">
                      {resident.documents && resident.documents.length > 0 ? (
                        resident.documents.map((doc, index) => (
                          <div key={index} className="rounded-lg border p-4 flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium">{doc.type}</p>
                              <p className="text-sm text-muted-foreground break-all">{doc.name}</p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => toast({ title: "Función no implementada" })}>Ver</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast({ title: "Función no implementada" })}>Descargar</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No se han adjuntado documentos.</p>
                      )}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo de Documento</TableHead>
                            <TableHead>Nombre del Archivo</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {resident.documents && resident.documents.length > 0 ? (
                            resident.documents.map((doc, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{doc.type}</TableCell>
                                <TableCell className="max-w-xs truncate">{doc.name}</TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Abrir menú</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                      <DropdownMenuItem onClick={() => toast({ title: "Función no implementada" })}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Ver
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => toast({ title: "Función no implementada" })}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Descargar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-destructive" onClick={() => toast({ title: "Función no implementada" })}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Eliminar
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3} className="h-24 text-center">No se han adjuntado documentos.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contracts" className="mt-4">
                <ContractAttachment residentId={residentId} residentName={resident.name} />
              </TabsContent>
            </>
          )}

          <TabsContent value="agenda" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2"><Calendar />Agenda de Eventos</CardTitle>
                  <CardDescription>Citas, recordatorios y gestiones para {resident.name}.</CardDescription>
                </div>
                <Button size="sm" className="shrink-0" onClick={() => handleOpenAgendaDialog()}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Agendar Evento</span>
                  <span className="sm:hidden">Agendar</span>
                </Button>
              </CardHeader>
              <CardContent>
                {/* Mobile */}
                <div className="md:hidden space-y-3">
                  {sortedAgendaEvents.length > 0 ? sortedAgendaEvents.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{event.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(event.date).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                        </div>
                        <Badge variant={getAgendaStatusVariant(event.status)} className="shrink-0 text-[10px]">
                          {event.status}
                        </Badge>
                      </div>
                      {event.description && (
                        <p className="text-xs text-muted-foreground">{event.description}</p>
                      )}
                      <div className="flex items-center justify-between pt-1 border-t">
                        <span className="text-xs text-muted-foreground">{event.type}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenAgendaDialog(event)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteEvent(event.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <p className="text-center text-muted-foreground py-8">No hay eventos en la agenda.</p>
                  )}
                </div>

                {/* Desktop */}
                <div className="hidden md:block">
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
                        sortedAgendaEvents.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell>
                              {new Date(event.date).toLocaleString("es-ES", { dateStyle: "long", timeStyle: "short" })}
                            </TableCell>
                            <TableCell>
                              <p className="font-semibold">{event.title}</p>
                              <p className="text-xs text-muted-foreground">{event.description}</p>
                            </TableCell>
                            <TableCell>{event.type}</TableCell>
                            <TableCell>
                              <Badge variant={getAgendaStatusVariant(event.status)}>{event.status}</Badge>
                            </TableCell>
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
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No hay eventos en la agenda.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
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
                  <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90dvh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Agregar Registro para {resident.name}</DialogTitle>
                      <DialogDescription>Seleccione el tipo de reporte y complete la información.</DialogDescription>
                    </DialogHeader>
                    <NewLogForm residentId={resident.id} onFormSubmit={() => setIsNewLogDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                  {paginatedLogs.length > 0 ? (
                    paginatedLogs.map((log) => (
                      <div key={log.id} className="border p-4 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className={log.reportType === 'medico' ? 'border-blue-500' : 'border-orange-500'}>
                            {log.reportType === 'medico' ? <Stethoscope className="h-3 w-3 mr-1.5" /> : <Truck className="h-3 w-3 mr-1.5" />}
                            {log.reportType === 'medico' ? 'Médico' : 'Suministro'}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.endDate).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                            {log.reportType === 'medico' && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setLogForPartialEvolution(log);
                                      setIsPartialEvolutionDialogOpen(true);
                                    }}
                                  >
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Agregar Evolución
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleLogClick(log)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Ver Detalle
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground truncate cursor-pointer" onClick={() => handleLogClick(log)}>
                          {log.reportType === 'medico' ? (Array.isArray(log.evolutionNotes) && log.evolutionNotes.length > 0 ? log.evolutionNotes[0] : 'Sin notas de evolución') : log.supplyDescription}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No se han encontrado registros para este residente.
                    </p>
                  )}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo de Reporte</TableHead>
                        <TableHead>Detalle Principal</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedLogs.length > 0 ? (
                        paginatedLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium cursor-pointer" onClick={() => handleLogClick(log)}>
                              {new Date(log.endDate).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}
                            </TableCell>
                            <TableCell className="cursor-pointer" onClick={() => handleLogClick(log)}>
                              <Badge variant="outline" className={log.reportType === 'medico' ? 'border-blue-500' : 'border-orange-500'}>
                                {log.reportType === 'medico' ? <Stethoscope className="h-3 w-3 mr-1" /> : <Truck className="h-3 w-3 mr-1" />}
                                {log.reportType === 'medico' ? 'Médico' : 'Suministro'}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate cursor-pointer" onClick={() => handleLogClick(log)}>
                              {log.reportType === 'medico' ? (Array.isArray(log.evolutionNotes) && log.evolutionNotes.length > 0 ? log.evolutionNotes[0] : 'Sin notas de evolución') : log.supplyDescription}
                            </TableCell>
                            <TableCell className="text-right">
                              {log.reportType === 'medico' && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setLogForPartialEvolution(log);
                                        setIsPartialEvolutionDialogOpen(true);
                                      }}
                                    >
                                      <PlusCircle className="mr-2 h-4 w-4" />
                                      Agregar Evolución
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleLogClick(log)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      Ver Detalle
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            No se han encontrado registros para este residente.
                          </TableCell>
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

      {/* Diálogo para agregar evolución parcial */}
      {logForPartialEvolution && (
        <Dialog open={isPartialEvolutionDialogOpen} onOpenChange={setIsPartialEvolutionDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Agregar Evolución Parcial</DialogTitle>
              <DialogDescription>
                Registre una nueva evolución para el reporte del {new Date(logForPartialEvolution.endDate).toLocaleDateString('es-ES', { dateStyle: 'long' })} de {resident.name}.
              </DialogDescription>
            </DialogHeader>
            <PartialEvolutionForm
              log={logForPartialEvolution}
              onSaved={() => {
                setIsPartialEvolutionDialogOpen(false);
                setLogForPartialEvolution(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}