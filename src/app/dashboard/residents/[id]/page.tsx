
"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, FileUp, PlusCircle, CheckCircle, FileText } from "lucide-react"
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
import { useLogs } from "@/hooks/use-logs"
import { useEffect, useState } from "react"
import NewLogForm from "./new-log-form"


const documents = [
    { name: "Historia_Clinica.pdf", date: "2023-01-10" },
    { name: "Cedula_Ciudadania.jpg", date: "2023-01-10" },
    { name: "Consentimiento_Informado.pdf", date: "2023-01-11" },
]


export default function ResidentProfilePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { toast } = useToast()
  const { residents, isLoading: residentsLoading } = useResidents()
  const { logs, isLoading: logsLoading } = useLogs()
  const [isClient, setIsClient] = useState(false)
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const resident = residents.find(r => r.id === id)
  const evolutionLog = logs.filter(log => log.residentId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!isClient || residentsLoading || logsLoading) {
    return <div>Cargando...</div>
  }

  if (!resident) {
    return <div>Residente no encontrado.</div>
  }


  const handleGenerateReport = () => {
    toast({
      title: "Generando Reporte...",
      description: `Se está creando un reporte en PDF para ${resident.name}.`,
    })
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold font-headline tracking-tight sm:grow-0">
          Perfil de {resident.name}
        </h1>
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
                    <div className="font-semibold">Cédula</div><div>12345678</div>
                    <div className="font-semibold">F. Nacimiento</div><div>1942-05-15</div>
                </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Contacto Familiar</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
                 <div className="grid grid-cols-2 gap-2">
                    <div className="font-semibold">Nombre</div><div>Juan Rodriguez</div>
                    <div className="font-semibold">Parentesco</div><div>Hijo</div>
                    <div className="font-semibold">Teléfono</div><div>+1-202-555-0182</div>
                    <div className="font-semibold">Correo</div><div>juan.r@example.com</div>
                </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
           <Tabs defaultValue="evolution">
            <TabsList>
              <TabsTrigger value="evolution">Evolución Diaria</TabsTrigger>
              <TabsTrigger value="profile">Perfil Completo</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
            </TabsList>
            <TabsContent value="evolution">
              <Card>
                <CardHeader>
                  <CardTitle>Registro Diario</CardTitle>
                  <CardDescription>Registro cronológico del estado diario del residente.</CardDescription>
                   <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
                        <DialogTrigger asChild>
                           <Button size="sm" className="h-8 gap-1 w-fit ml-auto -mt-12">
                                <PlusCircle className="h-3.5 w-3.5" />
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                    Agregar Entrada
                                </span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-4xl">
                            <DialogHeader>
                                <DialogTitle>Agregar Registro de Evolución para {resident.name}</DialogTitle>
                                <DialogDescription>Complete la información de la evolución diaria del residente.</DialogDescription>
                            </DialogHeader>
                            <NewLogForm residentId={resident.id} onFormSubmit={() => setIsLogDialogOpen(false)} />
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                   <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Ánimo</TableHead>
                        <TableHead>Apetito</TableHead>
                        <TableHead>Meds</TableHead>
                        <TableHead>Notas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {evolutionLog.map(log => (
                           <TableRow key={log.id}>
                               <TableCell className="font-medium">{log.date}</TableCell>
                               <TableCell>{log.mood}</TableCell>
                               <TableCell>{log.appetite}</TableCell>
                               <TableCell>{log.medsAdministered ? <CheckCircle className="text-green-500" /> : null}</TableCell>
                               <TableCell className="max-w-[200px] truncate">{log.notes}</TableCell>
                           </TableRow>
                        ))}
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
                  <div>
                    <h3 className="font-semibold">Nivel de Dependencia</h3>
                    <Badge variant={resident.dependency === "Alta" ? "destructive" : "secondary"}>{resident.dependency}</Badge>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-semibold">Patologías Principales</h3>
                    <div className="flex flex-wrap gap-2 mt-1">{["Alzheimer", "Hipertensión"].map(p => <Badge key={p} variant="outline">{p}</Badge>)}</div>
                  </div>
                   <Separator />
                   <div>
                    <h3 className="font-semibold">Alergias</h3>
                    <div className="flex flex-wrap gap-2 mt-1">{["Penicilina"].map(a => <Badge key={a} variant="destructive">{a}</Badge>)}</div>
                  </div>
                   <Separator />
                   <div>
                    <h3 className="font-semibold">Medicamentos Recetados</h3>
                    <p>Donepezilo 10mg, Lisinopril 20mg</p>
                  </div>
                   <Separator />
                   <div>
                    <h3 className="font-semibold">Plan de Alimentación</h3>
                    <p>Baja en sodio, alimentos blandos</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="documents">
                <Card>
                    <CardHeader>
                        <CardTitle>Documentos Almacenados</CardTitle>
                        <CardDescription>Historia clínica y documentos legales almacenados de forma segura.</CardDescription>
                         <Button variant="outline" size="sm" className="h-8 gap-1 w-fit ml-auto -mt-12">
                            <FileUp className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                              Subir Documento
                            </span>
                          </Button>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre de Archivo</TableHead>
                                    <TableHead>Fecha de Carga</TableHead>
                                    <TableHead>Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {documents.map(doc => (
                                   <TableRow key={doc.name}>
                                       <TableCell className="font-medium">{doc.name}</TableCell>
                                       <TableCell>{doc.date}</TableCell>
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
    </>
  )
}
