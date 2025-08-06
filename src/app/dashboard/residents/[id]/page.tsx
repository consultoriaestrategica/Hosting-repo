
"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, FileUp, CheckCircle, FileText, Stethoscope, Truck, PlusCircle, UserPlus, Phone, Mail, Home } from "lucide-react"
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
import { useResidents } from "@/hooks/use-residents"
import { useLogs, Log } from "@/hooks/use-logs"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import NewLogForm from "./new-log-form"
import LogDetailDialog from "../../logs/log-detail-dialog"


function ResidentProfilePageContent({ id }: { id: string }) {
  const { toast } = useToast()
  const { residents, isLoading: residentsLoading } = useResidents()
  const { logs, isLoading: logsLoading } = useLogs()
  const [isClient, setIsClient] = useState(false)
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'admin';


  useEffect(() => {
    setIsClient(true)
  }, [])

  const resident = residents.find(r => r.id === id)
  const evolutionLog = [...logs].filter(log => log.residentId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!isClient || residentsLoading || logsLoading) {
    return <div>Cargando...</div>
  }

  if (!resident) {
    return <div>Residente no encontrado.</div>
  }

  const isFamilyRole = role === 'family';


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


  return (
    <>
      <div className="flex items-center gap-4">
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold font-headline tracking-tight sm:grow-0">
          Perfil de {resident.name}
        </h1>
        {!isFamilyRole && (
          <div className="hidden items-center gap-2 md:ml-auto md:flex">
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
      <div className="grid flex-1 items-start gap-4 lg:grid-cols-3 lg:gap-8 mt-4">
        <div className="grid auto-rows-max items-start gap-4 lg:col-span-1 lg:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Datos Demográficos</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
                <div className="grid grid-cols-2 gap-2">
                    <div className="font-semibold">Edad</div><div>{resident.age}</div>
                    <div className="font-semibold">Género</div><div>Femenino</div>
                    <div className="font-semibold">Cédula</div><div>{resident.idNumber}</div>
                    <div className="font-semibold">F. Nacimiento</div><div>{resident.dob}</div>
                </div>
            </CardContent>
          </Card>
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
        </div>
        <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
           <Tabs defaultValue="evolution">
            <TabsList>
              <TabsTrigger value="evolution">Historial de Reportes</TabsTrigger>
              <TabsTrigger value="profile">Perfil Completo</TabsTrigger>
              {!isFamilyRole && <TabsTrigger value="documents">Documentos</TabsTrigger>}
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
                      <Button size="sm" className="ml-auto gap-1">
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
                                <TableCell className="font-medium">{new Date(log.date).toLocaleDateString()}</TableCell>
                                  <TableCell>
                                      <Badge variant="outline" className={log.reportType === 'medico' ? 'border-blue-500' : 'border-orange-500'}>
                                          {log.reportType === 'medico' ? <Stethoscope className="h-3 w-3 mr-1" /> : <Truck className="h-3 w-3 mr-1" />}
                                          {log.reportType === 'medico' ? 'Médico' : 'Suministro'}
                                      </Badge>
                                  </TableCell>
                                <TableCell className="max-w-[200px] truncate">
                                  {log.reportType === 'medico' ? log.evolutionNotes : log.supplyDescription}
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
                    <h3 className="font-semibold">Patologías Principales</h3>
                    <div className="flex flex-wrap gap-2 mt-1">{resident.pathologies?.map(p => <Badge key={p} variant="outline">{p}</Badge>)}</div>
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
       {selectedLog && resident && (
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

// This is the server component part
export default function ResidentProfilePage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ResidentProfilePageContent id={params.id} />
    </Suspense>
  )
}
