
"use client"

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useResidents } from "@/hooks/use-residents"
import { useState, useEffect } from "react"
import { UploadCloud, File as FileIcon, X, PlusCircle, Trash2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


const documentTypes = ["Contrato", "Consentimiento Informado", "Cédula de Paciente", "Historia Clínica"]

const residentFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha de nacimiento inválida." }),
  idNumber: z.string().min(5, { message: "La cédula debe tener al menos 5 caracteres." }),
  gender: z.enum(["Femenino", "Masculino", "Otro"]),
  status: z.enum(["Activo", "Inactivo"]),
  
  // Medical Info
  bloodType: z.string().min(1, { message: "Campo requerido."}),
  fallRisk: z.enum(["Bajo", "Medio", "Alto"]),
  pathologies: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.array(z.object({
    name: z.string().min(1, "El nombre no puede estar vacío."),
    dose: z.string().min(1, "La dosis no puede estar vacía."),
    frequency: z.string().min(1, "La frecuencia no puede estar vacía."),
  })).optional(),
  diet: z.string().optional(),
  dependency: z.enum(["Dependiente", "Independiente"]),
  
  // Family Contacts
  familyContacts: z.array(z.object({
      name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
      kinship: z.string().min(2, { message: "El parentesco debe tener al menos 2 caracteres." }),
      phone: z.string().min(7, { message: "El teléfono debe ser válido." }),
      email: z.string().email({ message: "Correo electrónico inválido." }),
  })),

  // Admin Info
  admissionDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha de ingreso inválida." }),
  roomType: z.enum(["Básica", "Premium"]),
  documents: z.array(z.object({
    type: z.string(),
    file: z.any(),
  })).optional(),
})

type ResidentFormValues = z.infer<typeof residentFormSchema>

export default function NewResidentPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { addResident, isLoading } = useResidents()
  const [isClient, setIsClient] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({})

  useEffect(() => {
    setIsClient(true)
  }, [])

  const form = useForm<ResidentFormValues>({
    resolver: zodResolver(residentFormSchema),
    defaultValues: {
      name: "",
      idNumber: "",
      pathologies: "",
      allergies: "",
      medications: [{ name: "", dose: "", frequency: "" }],
      diet: "",
      familyContacts: [{ name: "", kinship: "", phone: "", email: "" }],
      status: "Activo",
      admissionDate: new Date().toISOString().split('T')[0],
      documents: [],
    },
  })

  const { fields: familyContactFields, append: appendFamilyContact, remove: removeFamilyContact } = useFieldArray({
    control: form.control,
    name: "familyContacts",
  });
  
  const { fields: medicationFields, append: appendMedication, remove: removeMedication } = useFieldArray({
    control: form.control,
    name: "medications",
  });


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setUploadedFiles(prev => ({...prev, [type]: file}));
    }
  }
  
  const removeFile = (type: string) => {
    setUploadedFiles(prev => {
        const newState = {...prev};
        delete newState[type];
        return newState;
    });
  }

 function onSubmit(data: ResidentFormValues) {
    const age = new Date().getFullYear() - new Date(data.dob).getFullYear();
    const newResident = {
        name: data.name,
        idNumber: data.idNumber,
        dob: data.dob,
        age: age,
        dependency: data.dependency,
        status: data.status,
        admissionDate: data.admissionDate,
        roomType: data.roomType,
        bloodType: data.bloodType,
        fallRisk: data.fallRisk,
        pathologies: data.pathologies?.split(',').map(p => p.trim()).filter(Boolean),
        allergies: data.allergies?.split(',').map(a => a.trim()).filter(Boolean),
        medications: data.medications,
        diet: data.diet,
        familyContacts: data.familyContacts,
        documents: Object.keys(uploadedFiles).map(type => ({ type: type, name: uploadedFiles[type].name, size: uploadedFiles[type].size })),
    };
    addResident(newResident);
    toast({
      title: "Residente Registrado",
      description: `${data.name} ha sido agregado exitosamente.`,
    })
    router.push("/dashboard/residents")
  }


  if (!isClient || isLoading) {
    return <div>Cargando...</div>
  }


  return (
    <>
      <h1 className="text-3xl font-bold font-headline mb-6">Agregar Nuevo Residente</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
           <Tabs defaultValue="general">
              <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="general">Información General</TabsTrigger>
                  <TabsTrigger value="medical">Perfil Médico</TabsTrigger>
                  <TabsTrigger value="contacts">Contactos Familiares</TabsTrigger>
                  <TabsTrigger value="documents">Documentos</TabsTrigger>
              </TabsList>

              <TabsContent value="general">
                 <Card>
                    <CardHeader>
                        <CardTitle>Información del Residente</CardTitle>
                        <CardDescription>Complete los datos demográficos y administrativos.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre Completo</FormLabel><FormControl><Input placeholder="Ej. Maria Rodriguez" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="dob" render={({ field }) => (<FormItem><FormLabel>Fecha de Nacimiento</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="idNumber" render={({ field }) => (<FormItem><FormLabel>Nº de Cédula</FormLabel><FormControl><Input placeholder="Ej. 12345678" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="gender" render={({ field }) => (<FormItem><FormLabel>Género</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione un género" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Femenino">Femenino</SelectItem><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Otro">Otro</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="admissionDate" render={({ field }) => (<FormItem><FormLabel>Fecha de Ingreso</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="roomType" render={({ field }) => (<FormItem><FormLabel>Tipo de Habitación</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione una habitación" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Básica">Habitación Básica</SelectItem><SelectItem value="Premium">Habitación Premium</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Estado</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione el estado" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Activo">Activo</SelectItem><SelectItem value="Inactivo">Inactivo</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        </div>
                    </CardContent>
                 </Card>
              </TabsContent>

              <TabsContent value="medical">
                 <Card>
                    <CardHeader>
                        <CardTitle>Información Médica y de Cuidado</CardTitle>
                         <CardDescription>Detalle las condiciones médicas, medicamentos y necesidades del residente.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField control={form.control} name="bloodType" render={({ field }) => (<FormItem><FormLabel>Tipo de Sangre</FormLabel><FormControl><Input placeholder="Ej. O+" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="dependency" render={({ field }) => (<FormItem><FormLabel>Nivel de Dependencia</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione un nivel" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Dependiente">Dependiente</SelectItem><SelectItem value="Independiente">Independiente</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="fallRisk" render={({ field }) => (<FormItem><FormLabel>Riesgo de Caída</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione un riesgo" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Bajo">Bajo</SelectItem><SelectItem value="Medio">Medio</SelectItem><SelectItem value="Alto">Alto</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        </div>
                        <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-6">
                            <FormField control={form.control} name="pathologies" render={({ field }) => (<FormItem><FormLabel>Patologías Principales</FormLabel><FormControl><Textarea placeholder="Ej. Alzheimer, Hipertensión (separadas por comas)" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="allergies" render={({ field }) => (<FormItem><FormLabel>Alergias Conocidas</FormLabel><FormControl><Textarea placeholder="Ej. Penicilina, Mariscos (separadas por comas)" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <FormField control={form.control} name="diet" render={({ field }) => (<FormItem className="lg:col-span-2"><FormLabel>Plan de Alimentación</FormLabel><FormControl><Textarea placeholder="Ej. Baja en sodio, alimentos blandos" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div>
                            <FormLabel>Medicamentos Recetados</FormLabel>
                            {medicationFields.map((field, index) => (
                                <div key={field.id} className="flex items-end gap-4 mt-2 p-4 border rounded-md relative">
                                    <FormField control={form.control} name={`medications.${index}.name`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Medicamento</FormLabel><FormControl><Input placeholder="Ej. Lisinopril" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name={`medications.${index}.dose`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Dosis</FormLabel><FormControl><Input placeholder="Ej. 20mg" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name={`medications.${index}.frequency`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Frecuencia</FormLabel><FormControl><Input placeholder="Ej. Cada 12 horas" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <Button type="button" variant="destructive" size="icon" onClick={() => removeMedication(index)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendMedication({ name: "", dose: "", frequency: "" })}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Agregar Medicamento
                            </Button>
                        </div>
                    </CardContent>
                 </Card>
              </TabsContent>

              <TabsContent value="contacts">
                  <Card>
                        <CardHeader>
                            <CardTitle>Información de Contacto Familiar</CardTitle>
                            <CardDescription>Agregue uno o más contactos de emergencia para el residente.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {familyContactFields.map((field, index) => (
                                <div key={field.id} className="p-4 border rounded-md space-y-4 relative">
                                    <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => removeFamilyContact(index)}><Trash2 className="h-4 w-4" /></Button>
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <FormField control={form.control} name={`familyContacts.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Nombre del Contacto</FormLabel><FormControl><Input placeholder="Ej. Juan Rodriguez" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name={`familyContacts.${index}.kinship`} render={({ field }) => (<FormItem><FormLabel>Parentesco</FormLabel><FormControl><Input placeholder="Ej. Hijo" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name={`familyContacts.${index}.phone`} render={({ field }) => (<FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="Ej. +1-202-555-0182" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name={`familyContacts.${index}.email`} render={({ field }) => (<FormItem><FormLabel>Correo Electrónico</FormLabel><FormControl><Input placeholder="Ej. juan.r@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => appendFamilyContact({ name: "", kinship: "", phone: "", email: "" })}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Agregar Contacto
                            </Button>
                        </CardContent>
                    </Card>
              </TabsContent>

              <TabsContent value="documents">
                <Card>
                    <CardHeader>
                        <CardTitle>Documentos Requeridos</CardTitle>
                        <CardDescription>Cargue los documentos obligatorios del residente.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {documentTypes.map((type) => (
                            <div key={type}>
                                <FormLabel>{type}</FormLabel>
                                {uploadedFiles[type] ? (
                                <div className="flex items-center justify-between p-2 mt-2 rounded-md bg-muted">
                                        <div className="flex items-center gap-2">
                                            <FileIcon className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm truncate max-w-28">{uploadedFiles[type].name}</span>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(type)}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <FormField
                                    control={form.control}
                                    name={`documents`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <div className="flex flex-col items-center justify-center w-full mt-2">
                                                    <label htmlFor={`dropzone-${type}`} className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
                                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                            <UploadCloud className="w-6 h-6 mb-2 text-muted-foreground" />
                                                            <p className="text-xs text-muted-foreground text-center">Subir archivo</p>
                                                        </div>
                                                        <Input id={`dropzone-${type}`} type="file" className="hidden" onChange={(e) => handleFileChange(e, type)} />
                                                    </label>
                                                </div> 
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
              </TabsContent>
           </Tabs>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>Guardar Residente</Button>
          </div>
        </form>
      </Form>
    </>
  )
}

  