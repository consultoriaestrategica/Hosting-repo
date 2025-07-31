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

const resident = {
  id: "res-001",
  name: "Maria Rodriguez",
  dob: "1942-05-15",
  age: 82,
  gender: "Femenino",
  idNumber: "12345678",
  pathologies: ["Alzheimer", "Hipertensión"],
  allergies: ["Penicilina"],
  medications: ["Donepezilo 10mg", "Lisinopril 20mg"],
  diet: "Baja en sodio, alimentos blandos",
  dependency: "Alta",
  familyContact: {
    name: "Juan Rodriguez",
    kinship: "Hijo",
    phone: "+1-202-555-0182",
    email: "juan.r@example.com",
  },
}

const evolutionLog = [
    { date: "2024-07-20", mood: "Calmada", appetite: "Bueno", sleep: "Reparador", vitals: "130/85, 72ppm, 36.8°C", meds: true, notes: "Participó en la musicoterapia matutina." },
    { date: "2024-07-19", mood: "Agitada", appetite: "Regular", sleep: "Interrumpido", vitals: "135/88, 78ppm, 37.0°C", meds: true, notes: "Experimentó algo de confusión por la tarde." },
    { date: "2024-07-18", mood: "Feliz", appetite: "Bueno", sleep: "Bueno", vitals: "128/82, 70ppm, 36.7°C", meds: true, notes: "Disfrutó la visita de su familia." },
]

const documents = [
    { name: "Historia_Clinica.pdf", date: "2023-01-10" },
    { name: "Cedula_Ciudadania.jpg", date: "2023-01-10" },
    { name: "Consentimiento_Informado.pdf", date: "2023-01-11" },
]


export default function ResidentProfilePage({ params }: { params: { id: string } }) {
  const { toast } = useToast()

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
                  Esto enviará inmediatamente una alerta de emergencia a {resident.familyContact.name} por correo electrónico y WhatsApp. ¿Está seguro de que desea continuar?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                  toast({
                    variant: "destructive",
                    title: "¡Alerta de Emergencia Enviada!",
                    description: `Se ha notificado a ${resident.familyContact.name}.`,
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
                    <div className="font-semibold">Género</div><div>{resident.gender}</div>
                    <div className="font-semibold">Cédula</div><div>{resident.idNumber}</div>
                    <div className="font-semibold">F. Nacimiento</div><div>{resident.dob}</div>
                </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Contacto Familiar</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
                 <div className="grid grid-cols-2 gap-2">
                    <div className="font-semibold">Nombre</div><div>{resident.familyContact.name}</div>
                    <div className="font-semibold">Parentesco</div><div>{resident.familyContact.kinship}</div>
                    <div className="font-semibold">Teléfono</div><div>{resident.familyContact.phone}</div>
                    <div className="font-semibold">Correo</div><div>{resident.familyContact.email}</div>
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
                  <Button size="sm" className="h-8 gap-1 w-fit ml-auto -mt-12">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      Agregar Entrada
                    </span>
                  </Button>
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
                           <TableRow key={log.date}>
                               <TableCell className="font-medium">{log.date}</TableCell>
                               <TableCell>{log.mood}</TableCell>
                               <TableCell>{log.appetite}</TableCell>
                               <TableCell><CheckCircle className="text-green-500" /></TableCell>
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
                    <div className="flex flex-wrap gap-2 mt-1">{resident.pathologies.map(p => <Badge key={p} variant="outline">{p}</Badge>)}</div>
                  </div>
                  <Separator />
                   <div>
                    <h3 className="font-semibold">Alergias</h3>
                    <div className="flex flex-wrap gap-2 mt-1">{resident.allergies.map(a => <Badge key={a} variant="destructive">{a}</Badge>)}</div>
                  </div>
                   <Separator />
                   <div>
                    <h3 className="font-semibold">Medicamentos Recetados</h3>
                    <p>{resident.medications.join(", ")}</p>
                  </div>
                   <Separator />
                   <div>
                    <h3 className="font-semibold">Plan de Alimentación</h3>
                    <p>{resident.diet}</p>
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
