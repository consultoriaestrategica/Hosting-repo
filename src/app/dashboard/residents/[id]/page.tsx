
"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, FileUp, CheckCircle, FileText, Stethoscope, Truck, PlusCircle, UserPlus, Phone, Mail, Home, LogOut, Info, CalendarPlus, MoreHorizontal, Edit, Trash2, Eye, Car } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useResidents, AgendaEvent, Visit } from "@/hooks/use-residents"
import { useLogs, Log } from "@/hooks/use-logs"
import { useContracts, Contract } from "@/hooks/use-contracts"
import { useEffect, useState, Suspense, use, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import NewLogForm from "./new-log-form"
import LogDetailDialog from "../../components/log-detail-dialog"
import DischargeForm from "./discharge-form"
import AgendaForm from "./agenda-form"
import ContractPreviewDialog from "../../components/contract-preview-dialog"


function ResidentProfilePageContent({ id }: { id: string }) {
  const { toast } = useToast()
  const { residents, isLoading: residentsLoading, updateResident, addAgendaEvent, updateAgendaEvent, deleteAgendaEvent } from useResidents()
  const { logs, isLoading: logsLoading } = useLogs()
  const { contracts, isLoading: contractsLoading } = useContracts()
  const [isClient, setIsClient] = useState(false)
  
  // Dialog states
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false)
  const [isDischargeDialogOpen, setIsDischargeDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isAgendaFormOpen, setIsAgendaFormOpen] = useState(false);
  const [isContractPreviewOpen, setIsContractPreviewOpen] = useState(false);
  
  // Data states
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);


  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'admin';


  useEffect(() => {
    setIsClient(true)
  }, [])

  const resident = residents.find(r => r.id === id)
  
  const evolutionLog = useMemo(() => 
    [...logs].filter(log => log.residentId === id).sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
  , [logs, id]);

  const residentContracts = useMemo(() => 
    [...contracts].filter(c => c.residentId === id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  , [contracts, id]);
  
  const sortedAgendaEvents = useMemo(() => 
    [...(resident?.agendaEvents || [])].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  , [resident?.agendaEvents]);
  
  const sortedVisits = useMemo(() => 
    [...(resident?.visits || [])].sort((a,b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
  , [resident?.visits]);


  if (!isClient || residentsLoading || logsLoading || contractsLoading) {
    return <div>Cargando...</div>
  }

  if (!resident) {
    return <div>Residente no encontrado.</div>
  }

  const isFamilyRole = role === 'family';
  const isStaffRole = role === 'staff';

  const handleGenerateReport = () => {
    toast({
      title: "Generando Reporte...",
      description: `Se está creando un reporte en PDF para ${resident.name}.`,
    })
  }
  
  const handleRowClick = (log: Log) => {
    setSelectedLog(log);
    setIsDetailDialogOpen(true);
  };
  
  const handleOpenAgendaForm = (event: AgendaEvent | null) => {
    setSelectedEvent(event);
    setIsAgendaFormOpen(true);
  }
  
  const handleSaveEvent = (data: Omit<AgendaEvent, 'id'>) => {
    if (selectedEvent) {
      updateAgendaEvent(resident.id, selectedEvent.id, data);
      toast({ title: "Evento Actualizado", description: "El evento de la agenda ha sido actualizado." });
    } else {
      addAgendaEvent(resident.id, data);
      toast({ title: "Evento Añadido", description: "Se ha añadido un nuevo evento a la agenda." });
    }
    setIsAgendaFormOpen(false);
    setSelectedEvent(null);
  };
  
  const handleDeleteEvent = (eventId: string) => {
    deleteAgendaEvent(resident.id, eventId);
    toast({ variant: "destructive", title: "Evento Eliminado", description: "El evento ha sido eliminado de la agenda." });
  };
  
  const getEventStatusVariant = (status: AgendaEvent['status']) => {
    switch (status) {
        case 'Pendiente': return 'default';
        case 'Completado': return 'secondary';
        case 'Cancelado': return 'destructive';
        default: return 'outline';
    }
  }

  const getContractStatusVariant = (status: string) => {
    switch(status) {
        case 'Activo': return 'default';
        case 'Finalizado': return 'secondary';
        case 'Cancelado': return 'destructive';
        default: return 'outline';
    }
  }

  const handleOpenContractPreview = (contract: Contract) => {
    setSelectedContract(contract);
    setIsContractPreviewOpen(true);
  }


  return (
    <>
      <div className="flex items-center gap-4">
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold font-headline tracking-tight sm:grow-0">
          Perfil de {resident.name}
        </h1>
        {role === 'admin' && (
          <div className="hidden items-center gap-2 md:ml-auto md:flex">
             <Dialog open={isDischargeDialogOpen} onOpenChange={setIsDischargeDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={resident.status === 'Inactivo'}>
                       <LogOut className="h-4 w-4 mr-2" />
                       Dar de Baja
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Formulario de Salida del Residente</DialogTitle>
                        <DialogDescription>
                            Complete la información para registrar la salida de {resident.name}. Esta acción cambiará su estado a "Inactivo".
                        </DialogDescription>
                    </DialogHeader>
                    <DischargeForm
                        resident={resident}
                        onSubmit={(data) => {
                            updateResident(resident.id, {
                                status: 'Inactivo',
                                dischargeDetails: {
                                    dischargeDate: data.dischargeDate,
                                    reason: data.reason,
                                    observations: data.observations || '',
                                }
                            });
                            toast({ title: "Residente Dado de Baja", description: `${resident.name} ha sido marcado como inactivo.` });
                            setIsDischargeDialogOpen(false);
                        }}
                    />
                </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={handleGenerateReport}>
              <FileText className="h-4 w-4 mr-2" />
              Generar Reporte
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Alerta de Emergencia
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Notificación de Emergencia</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esto enviará inmediatamente una alerta de emergencia al contacto familiar por correo electrónico y WhatsApp. ¿Está seguro de que desea continuar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => {
                    toast({
                      variant: "destructive",
                      title: "¡Alerta de Emergencia Enviada!",
                      description: `Se ha notificado al contacto familiar.`,
                    })
                  }}>
                    Confirmar y Enviar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

       {resident.status === 'Inactivo' && resident.dischargeDetails && (
            <Card className="mt-4 bg-amber-50 border-amber-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-900"><Info size={20}/>Información de Salida</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-3 text-amber-800">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                         <p><strong>Fecha de Salida:</strong> {new Date(resident.dischargeDetails.dischargeDate).toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
                         <p><strong>Motivo:</strong> {resident.dischargeDetails.reason}</p>
                    </div>
                    {resident.dischargeDetails.observations && (
                         <p><strong>Observaciones:</strong> {resident.dischargeDetails.observations}</p>
                    )}
                </CardContent>
            </Card>
        )}

      <div className="grid flex-1 items-start gap-4 lg:grid-cols-3 lg:gap-8 mt-4">
        <div className="grid auto-rows-max items-start gap-4 lg:col-span-1 lg:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Datos Demográficos</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
                <div className="grid grid-cols-2 gap-2">
                    <div className="font-semibold">Estado</div><div> <Badge variant={resident.status === "Activo" ? "default" : "secondary"} className={resident.status === "Activo" ? "bg-green-500 text-white" : ""}>{resident.status}</Badge></div>
                    <div className="font-semibold">Edad</div><div>{resident.age}</div>
                    <div className="font-semibold">Género</div><div>Femenino</div>
                    <div className="font-semibold">Cédula</div><div>{resident.idNumber}</div>
                    <div className="font-semibold">F. Nacimiento</div><div>{resident.dob}</div>
                </div>
            </CardContent>
          </Card>
          {(role === 'admin' || role === 'family') && (
             <Card>
             <CardHeader>
                <CardTitle>Contactos Familiares</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                {resident.familyContacts?.map((contact, index) => (
                    <div key={index} className="text-sm space-y-2">
                        <div className="font-bold text-base mb-2">{contact.name} <span className="font-normal text-muted-foreground">({contact.kinship})</span></div>
                         <div className="flex items-start gap-2 text-muted-foreground">
                            <Home size={14} className="mt-1 shrink-0"/>
                            <span>{contact.address}</span>
                        </div>
                        <div className="flex items-start gap-2 text-muted-foreground">
                            <Mail size={14} className="mt-1 shrink-0"/>
                            <span>{contact.email}</span>
                        </div>
                        {contact.phones?.map((phone, phoneId) => (
                            <div key={phoneId} className="flex items-center gap-2 text-muted-foreground">
                                <Phone size={14}/>
                                <span>{phone.number}</span>
                            </div>
                        ))}
                    </div>
                ))}
             </CardContent>
          </Card>
          )}
        </div>
        <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
           <Tabs defaultValue="evolution">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="evolution">Reportes</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
              <TabsTrigger value="visits">Visitas</TabsTrigger>
              <TabsTrigger value="profile">Perfil Completo</TabsTrigger>
              {role === 'admin' && <TabsTrigger value="contracts">Contratos</TabsTrigger>}
              {!isFamilyRole && !isStaffRole && <TabsTrigger value="documents">Documentos</TabsTrigger>}
            </TabsList>
            <TabsContent value="evolution">
              <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
                <Card>
                  <CardHeader className="flex flex-row items-center">
                    <div className="grid gap-2">
                      <CardTitle>Registro de Reportes</CardTitle>
                      <CardDescription>Registro cronológico de los reportes del residente.</CardDescription>
                    </div>
                    {!isFamilyRole && (
                    <DialogTrigger asChild>
                      <Button size="sm" className="ml-auto gap-1" disabled={resident.status === 'Inactivo'}>
                        <PlusCircle className="h-4 w-4" />
                        Agregar Reporte
                      </Button>
                    </DialogTrigger>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Detalle</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                          {evolutionLog.map(log => (
                            <TableRow key={log.id} onClick={() => handleRowClick(log)} className="cursor-pointer">
                                <TableCell className="font-medium">{new Date(log.endDate).toLocaleDateString()}</TableCell>
                                  <TableCell>
                                      <Badge variant="outline" className={log.reportType === 'medico' ? 'border-blue-500' : 'border-orange-500'}>
                                          {log.reportType === 'medico' ? <Stethoscope className="h-3 w-3 mr-1" /> : <Truck className="h-3 w-3 mr-1" />}
                                          {log.reportType === 'medico' ? 'Médico' : 'Suministro'}
                                      </Badge>
                                  </TableCell>
                                <TableCell className="max-w-[200px] truncate">
                                  {log.reportType === 'medico' ? log.evolutionNotes?.[0] : log.supplyDescription}
                                </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                 <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Agregar Reporte Diario para {resident.name}</DialogTitle>
                        <DialogDescription>Seleccione el tipo de reporte y complete la información.</DialogDescription>
                    </DialogHeader>
                    <NewLogForm residentId={resident.id} onFormSubmit={() => setIsLogDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </TabsContent>
             <TabsContent value="visits">
                <Card>
                  <CardHeader>
                    <CardTitle>Historial de Visitas</CardTitle>
                    <CardDescription>Registro de todas las personas que han visitado al residente.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha y Hora</TableHead>
                          <TableHead>Visitante</TableHead>
                          <TableHead>Cédula</TableHead>
                          <TableHead>Parentesco</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                          {sortedVisits.length > 0 ? sortedVisits.map(visit => (
                            <TableRow key={visit.id}>
                                <TableCell className="font-medium">{new Date(visit.visitDate).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</TableCell>
                                <TableCell>{visit.visitorName}</TableCell>
                                <TableCell>{visit.visitorIdNumber}</TableCell>
                                <TableCell>{visit.kinship}</TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">No hay visitas registradas.</TableCell>
                            </TableRow>
                          )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="agenda">
                <Card>
                  <CardHeader className="flex flex-row items-center">
                    <div className="grid gap-2">
                      <CardTitle>Agenda Personal</CardTitle>
                      <CardDescription>Citas médicas, actividades y gestiones personales.</CardDescription>
                    </div>
                    {!isFamilyRole && (
                      <Button size="sm" className="ml-auto gap-1" disabled={resident.status === 'Inactivo'} onClick={() => handleOpenAgendaForm(null)}>
                        <CalendarPlus className="h-4 w-4" />
                        Agendar Evento
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha y Hora</TableHead>
                          <TableHead>Evento</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Estado</TableHead>
                          {!isFamilyRole && <TableHead className="text-right">Acciones</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                          {sortedAgendaEvents.length > 0 ? sortedAgendaEvents.map(event => (
                            <TableRow key={event.id}>
                                <TableCell className="font-medium">{new Date(event.date).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</TableCell>
                                <TableCell>
                                    <div className="font-medium">{event.title}</div>
                                    {event.description && <div className="text-xs text-muted-foreground">{event.description}</div>}
                                </TableCell>
                                <TableCell>{event.type}</TableCell>
                                <TableCell><Badge variant={getEventStatusVariant(event.status)}>{event.status}</Badge></TableCell>
                                {!isFamilyRole && (
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => handleOpenAgendaForm(event)}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteEvent(event.id)}><Trash2 className="mr-2 h-4 w-4"/>Eliminar</DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                )}
                            </TableRow>
                          )) : (
                            <TableRow>
                                <TableCell colSpan={isFamilyRole ? 4 : 5} className="text-center h-24">No hay eventos en la agenda.</TableCell>
                            </TableRow>
                          )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Perfil Médico y de Cuidado</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-semibold">Nivel de Dependencia</h3>
                            <Badge variant={resident.dependency === "Dependiente" ? "destructive" : "secondary"}>{resident.dependency}</Badge>
                        </div>
                        <div>
                            <h3 className="font-semibold">Riesgo de Caída</h3>
                            <Badge variant={resident.fallRisk === "Alto" ? "destructive" : resident.fallRisk === "Medio" ? "secondary" : "default"}>{resident.fallRisk}</Badge>
                        </div>
                         <div>
                            <h3 className="font-semibold">Tipo de Sangre</h3>
                            <p className="text-muted-foreground">{resident.bloodType}</p>
                        </div>
                    </div>
                  <Separator />
                  <div>
                    <h3 className="font-semibold">Antecedentes Médicos</h3>
                    <div className="flex flex-wrap gap-2 mt-1">{resident.medicalHistory?.map(p => <Badge key={p} variant="outline">{p}</Badge>)}</div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-semibold">Antecedentes Quirúrgicos</h3>
                    <div className="flex flex-wrap gap-2 mt-1">{resident.surgicalHistory?.map(p => <Badge key={p} variant="outline">{p}</Badge>)}</div>
                  </div>
                   <Separator />
                   <div>
                    <h3 className="font-semibold">Alergias</h3>
                     <div className="flex flex-wrap gap-2 mt-1">{resident.allergies?.map(a => <Badge key={a} variant="destructive">{a}</Badge>)}</div>
                  </div>
                   <Separator />
                   <div>
                    <h3 className="font-semibold">Medicamentos Recetados</h3>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Medicamento</TableHead>
                                <TableHead>Dosis</TableHead>
                                <TableHead>Frecuencia</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {resident.medications?.map((med, index) => (
                               <TableRow key={index}>
                                   <TableCell>{med.name}</TableCell>
                                   <TableCell>{med.dose}</TableCell>
                                   <TableCell>{med.frequency}</TableCell>
                               </TableRow>
                            ))}
                        </TableBody>
                     </Table>
                  </div>
                   <Separator />
                   <div>
                    <h3 className="font-semibold">Plan de Alimentación</h3>
                    <p className="text-muted-foreground">{resident.diet}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="contracts">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Contratos</CardTitle>
                  <CardDescription>
                    Listado de todos los contratos asociados a este residente.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Inicio</TableHead>
                        <TableHead>Fin</TableHead>
                        <TableHead><span className="sr-only">Acciones</span></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {residentContracts.length > 0 ? (
                        residentContracts.map((contract) => (
                          <TableRow key={contract.id}>
                            <TableCell>
                              Contrato {contract.contractType}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getContractStatusVariant(contract.status)}>
                                {contract.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(contract.startDate).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(contract.endDate).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => handleOpenContractPreview(contract)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver Detalle
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No se encontraron contratos para este residente.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="documents">
                <Card>
                    <CardHeader>
                        <CardTitle>Documentos Almacenados</CardTitle>
                        <CardDescription>Historia clínica y documentos legales almacenados de forma segura.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre de Archivo</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {resident.documents?.map(doc => (
                                   <TableRow key={doc.type}>
                                       <TableCell className="font-medium">{doc.type}</TableCell>
                                       <TableCell>
                                            <Badge variant="outline" className="gap-1 pl-1 text-green-600 border-green-600">
                                                <CheckCircle className="h-3 w-3" />
                                                Cargado
                                            </Badge>
                                       </TableCell>
                                       <TableCell>
                                           <Button variant="link" size="sm" className="p-0 h-auto">Descargar</Button>
                                       </TableCell>
                                   </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                    </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

       {/* Dialog for Agenda Form */}
       <Dialog open={isAgendaFormOpen} onOpenChange={setIsAgendaFormOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{selectedEvent ? 'Editar Evento' : 'Agendar Nuevo Evento'}</DialogTitle>
                    <DialogDescription>
                        {selectedEvent ? 'Actualice los detalles del evento.' : 'Complete la información para crear un nuevo evento en la agenda.'}
                    </DialogDescription>
                </DialogHeader>
                <AgendaForm 
                    event={selectedEvent}
                    onSubmit={handleSaveEvent}
                    onCancel={() => setIsAgendaFormOpen(false)}
                />
            </DialogContent>
        </Dialog>

       {selectedLog && resident && (
        <LogDetailDialog 
            isOpen={isDetailDialogOpen} 
            onOpenChange={setIsDetailDialogOpen} 
            log={selectedLog}
            residentName={resident.name}
        />
      )}

      {selectedContract && resident && (
        <ContractPreviewDialog
            isOpen={isContractPreviewOpen}
            onOpenChange={setIsContractPreviewOpen}
            contract={selectedContract}
            residentName={resident.name}
            role={role}
        />
      )}
    </>
  )
}

// This is the server component part
export default function ResidentProfilePage({ params }: { params: { id: string } }) {
  const { id } = use(params);

  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ResidentProfilePageContent id={id} />
    </Suspense>
  )
}

    
