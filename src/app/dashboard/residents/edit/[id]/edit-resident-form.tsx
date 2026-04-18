"use client"
import {
  Form,
  FormControl,
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
import React, { useState, useEffect } from "react"
import { UploadCloud, File as FileIcon, X, PlusCircle, Trash2, Weight, AlertTriangle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const residentFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha de nacimiento inválida." }),
  idNumber: z.string().min(5, { message: "La cédula debe tener al menos 5 caracteres." }),
  gender: z.enum(["Femenino", "Masculino", "Otro"]).optional().or(z.literal("")),
  status: z.enum(["Activo", "Inactivo", "Borrador"]),
  
  // Medical Info
  bloodType: z.string().min(1, { message: "Campo requerido."}),
  fallRisk: z.enum(["Bajo", "Medio", "Alto"]),
  medicalHistory: z.string().optional(),
  surgicalHistory: z.string().optional(),
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
      address: z.string().min(5, { message: "La dirección debe ser válida." }),
      phones: z.array(z.object({
          number: z.string().min(7, { message: "El teléfono debe ser válido." }),
      })).min(1, "Debe haber al menos un teléfono."),
      email: z.string().email({ message: "Correo electrónico inválido." }),
  })),
  
  // Admin Info
  admissionDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha de ingreso inválida." }),
  roomType: z.enum(["Habitación compartida", "Habitación individual"]).optional().or(z.literal("")),
  roomNumber: z.string().optional(),
  documents: z.array(z.object({
    type: z.string(),
    name: z.string(),
    size: z.number(),
  })).optional(),
})

type ResidentFormValues = z.infer<typeof residentFormSchema>

// ✅ Componente principal exportado
export default function EditResidentForm({ residentId }: { residentId: string }) {
  const { toast } = useToast()
  const router = useRouter()
  const { residents, updateResident, isLoading } = useResidents()
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { name: string; size: number }>>({})
  const [activeTab, setActiveTab] = useState("general")
  
  const resident = residents.find(r => r.id === residentId);
  
  const form = useForm<ResidentFormValues>({
    resolver: zodResolver(residentFormSchema),
    defaultValues: {
      name: "",
      dob: "",
      idNumber: "",
      gender: "",
      status: "Activo",
      bloodType: "",
      fallRisk: "Bajo",
      medicalHistory: "",
      surgicalHistory: "",
      allergies: "",
      medications: [],
      diet: "",
      dependency: "Dependiente",
      familyContacts: [],
      admissionDate: "",
      roomType: "",
      roomNumber: "",
      documents: [],
    }
  });
  
  // Usar useRef para evitar resets continuos cuando Firestore actualiza
  const hasInitialized = React.useRef(false);

  useEffect(() => {
    // Solo inicializar una vez cuando el residente se carga por primera vez
    if (resident && !hasInitialized.current) {
        form.reset({
            name: resident.name || "",
            dob: resident.dob || "",
            idNumber: resident.idNumber || "",
            gender: resident.gender || "",
            status: resident.status || "Activo",
            bloodType: resident.bloodType || "",
            fallRisk: resident.fallRisk || "Bajo",
            medicalHistory: resident.medicalHistory?.join(', ') || "",
            surgicalHistory: resident.surgicalHistory?.join(', ') || "",
            allergies: resident.allergies?.join(', ') || "",
            medications: resident.medications || [],
            diet: resident.diet || "",
            dependency: resident.dependency || "Dependiente",
            familyContacts: resident.familyContacts || [],
            admissionDate: resident.admissionDate || "",
            roomType: resident.roomType || "",
            roomNumber: resident.roomNumber || "",
            documents: resident.documents || [],
        });

        const initialDocs = resident.documents?.reduce((acc, doc) => {
            acc[doc.type] = { name: doc.name, size: doc.size };
            return acc;
        }, {} as Record<string, { name: string, size: number }>) || {};
        setUploadedFiles(initialDocs);

        hasInitialized.current = true;
    }
  }, [resident]);
  
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
      setUploadedFiles(prev => ({...prev, [type]: { name: file.name, size: file.size } }));
    }
  }
  
  const removeFile = (type: string) => {
    setUploadedFiles(prev => {
        const newState = {...prev};
        delete newState[type];
        return newState;
    });
  }
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  function onInvalid() {
    const errs = form.formState.errors
    const generalFields = ['name', 'dob', 'idNumber', 'admissionDate']
    const medicalFields = ['bloodType', 'dependency', 'fallRisk']
    const hasGeneralError = generalFields.some(f => !!(errs as any)[f])
    const hasMedicalError = medicalFields.some(f => !!(errs as any)[f])
    const hasContactsError = !!errs.familyContacts
    if (hasGeneralError) setActiveTab("general")
    else if (hasMedicalError) setActiveTab("medical")
    else if (hasContactsError) setActiveTab("contacts")
    toast({ variant: "destructive", title: "Hay campos obligatorios sin completar", description: "Revisa los campos marcados en rojo." })
    setTimeout(() => {
      document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 150)
  }

  async function handleSaveDraftEdit() {
    if (!resident) return
    const values = form.getValues()
    if (!values.name?.trim()) {
      toast({ variant: "destructive", title: "El nombre es necesario incluso para un borrador." })
      return
    }
    const age = values.dob && !isNaN(Date.parse(values.dob))
      ? new Date().getFullYear() - new Date(values.dob).getFullYear()
      : resident.age
    await updateResident(resident.id, {
      name: values.name,
      idNumber: values.idNumber || "",
      dob: values.dob || "",
      age,
      gender: (values.gender || undefined) as "Femenino" | "Masculino" | "Otro" | undefined,
      dependency: (values.dependency as "Dependiente" | "Independiente") || "Dependiente",
      status: "Borrador",
      admissionDate: values.admissionDate || "",
      roomType: (values.roomType || undefined) as "Habitación compartida" | "Habitación individual" | undefined,
      roomNumber: values.roomNumber || "",
      bloodType: values.bloodType || "",
      fallRisk: (values.fallRisk as "Bajo" | "Medio" | "Alto") || "Bajo",
      medicalHistory: values.medicalHistory?.split(',').map(p => p.trim()).filter(Boolean),
      surgicalHistory: values.surgicalHistory?.split(',').map(p => p.trim()).filter(Boolean),
      allergies: values.allergies?.split(',').map(a => a.trim()).filter(Boolean),
      medications: values.medications || [],
      diet: values.diet || "",
      familyContacts: values.familyContacts || [],
    })
    toast({ title: "Borrador actualizado", description: "Aún faltan campos obligatorios para activar al residente." })
  }

  function onSubmit(data: ResidentFormValues) {
    if (!resident) return;
    const wasDraft = resident.status === "Borrador"
    const age = new Date().getFullYear() - new Date(data.dob).getFullYear();

    const documentsData = Object.entries(uploadedFiles).map(([type, fileInfo]) => ({
      type: type,
      name: fileInfo.name,
      size: fileInfo.size,
    }));

    const updatedData = {
        ...data,
        age: age,
        status: wasDraft ? "Activo" as const : data.status,
        medicalHistory: data.medicalHistory?.split(',').map(p => p.trim()).filter(Boolean),
        surgicalHistory: data.surgicalHistory?.split(',').map(p => p.trim()).filter(Boolean),
        allergies: data.allergies?.split(',').map(a => a.trim()).filter(Boolean),
        documents: documentsData,
        gender: (data.gender || undefined) as "Femenino" | "Masculino" | "Otro" | undefined,
        roomType: (data.roomType || undefined) as "Habitación compartida" | "Habitación individual" | undefined,
    };

    updateResident(resident.id, updatedData);
    toast({
      title: wasDraft ? "Residente activado exitosamente" : "Residente Actualizado",
      description: wasDraft
        ? `${data.name} ahora está activo en el sistema.`
        : `Los datos de ${data.name} han sido actualizados exitosamente.`,
    })
    router.push(`/dashboard/residents/${resident.id}`);
  }
  
  if (isLoading) {
    return <div>Cargando...</div>
  }
  
  if (!resident) {
    return <div>Residente no encontrado.</div>
  }

  const formErrors = form.formState.errors
  const generalErrorCount = (['name', 'dob', 'idNumber', 'admissionDate'] as const).filter(f => !!formErrors[f]).length
  const medicalErrorCount = (['bloodType', 'dependency', 'fallRisk'] as const).filter(f => !!formErrors[f]).length
  const contactsErrorCount = formErrors.familyContacts ? 1 : 0

  return (
    <>
      <h1 className="text-3xl font-bold font-headline mb-6">Editar Perfil de {resident.name}</h1>
      {resident.status === "Borrador" && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 mb-6">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Este residente está en borrador.</span>{" "}
            Completa los campos obligatorios marcados con <span className="text-destructive font-bold">*</span> y haz clic en "Guardar y activar" para activarlo.
          </p>
        </div>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8">
           <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex flex-wrap w-full">
                  <TabsTrigger value="general" className="flex-1 min-w-[120px] text-xs sm:text-sm gap-1.5">
                    Información General
                    {generalErrorCount > 0 && <span className="inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold min-w-[16px] h-4 px-1">{generalErrorCount}</span>}
                  </TabsTrigger>
                  <TabsTrigger value="medical" className="flex-1 min-w-[120px] text-xs sm:text-sm gap-1.5">
                    Perfil Médico
                    {medicalErrorCount > 0 && <span className="inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold min-w-[16px] h-4 px-1">{medicalErrorCount}</span>}
                  </TabsTrigger>
                  <TabsTrigger value="contacts" className="flex-1 min-w-[120px] text-xs sm:text-sm gap-1.5">
                    Contactos Familiares
                    {contactsErrorCount > 0 && <span className="inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold min-w-[16px] h-4 px-1">{contactsErrorCount}</span>}
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="flex-1 min-w-[120px] text-xs sm:text-sm">Documentos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general">
                 <Card>
                    <CardHeader>
                        <CardTitle>Información del Residente</CardTitle>
                        <CardDescription>Actualice los datos demográficos y administrativos.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre Completo <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="Ej. Maria Rodriguez" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="dob" render={({ field }) => (<FormItem><FormLabel>Fecha de Nacimiento <span className="text-destructive">*</span></FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="idNumber" render={({ field }) => (<FormItem><FormLabel>Nº de Cédula <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="Ej. 12345678" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="gender" render={({ field }) => (<FormItem><FormLabel>Género</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione un género" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Femenino">Femenino</SelectItem><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Otro">Otro</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="admissionDate" render={({ field }) => (<FormItem><FormLabel>Fecha de Ingreso</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="roomType" render={({ field }) => (<FormItem><FormLabel>Tipo de Habitación</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione una habitación" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Habitación compartida">Habitación Compartida</SelectItem><SelectItem value="Habitación individual">Habitación Individual</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="roomNumber" render={({ field }) => (<FormItem><FormLabel>Número de Habitación</FormLabel><FormControl><Input placeholder="Ej. 101A" value={field.value || ""} onChange={field.onChange} onBlur={field.onBlur} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Estado</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione el estado" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Activo">Activo</SelectItem><SelectItem value="Inactivo">Inactivo</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        </div>
                    </CardContent>
                 </Card>
              </TabsContent>
              
              <TabsContent value="medical">
                 <Card>
                    <CardHeader>
                        <CardTitle>Información Médica y de Cuidado</CardTitle>
                         <CardDescription>Actualice las condiciones médicas, medicamentos y necesidades del residente.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField control={form.control} name="bloodType" render={({ field }) => (<FormItem><FormLabel>Tipo de Sangre <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="Ej. O+" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="dependency" render={({ field }) => (<FormItem><FormLabel>Nivel de Dependencia</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione un nivel" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Dependiente">Dependiente</SelectItem><SelectItem value="Independiente">Independiente</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="fallRisk" render={({ field }) => (<FormItem><FormLabel>Riesgo de Caída</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione un riesgo" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Bajo">Bajo</SelectItem><SelectItem value="Medio">Medio</SelectItem><SelectItem value="Alto">Alto</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        </div>
                        <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-6">
                            <FormField control={form.control} name="medicalHistory" render={({ field }) => (<FormItem><FormLabel>Antecedentes Médicos</FormLabel><FormControl><Textarea placeholder="Ej. Alzheimer, Hipertensión (separados por comas)" value={field.value || ""} onChange={field.onChange} onBlur={field.onBlur} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="surgicalHistory" render={({ field }) => (<FormItem><FormLabel>Antecedentes Quirúrgicos</FormLabel><FormControl><Textarea placeholder="Ej. Reemplazo de cadera (separados por comas)" value={field.value || ""} onChange={field.onChange} onBlur={field.onBlur} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="allergies" render={({ field }) => (<FormItem><FormLabel>Alergias Conocidas</FormLabel><FormControl><Textarea placeholder="Ej. Penicilina, Mariscos (separadas por comas)" value={field.value || ""} onChange={field.onChange} onBlur={field.onBlur} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <FormField control={form.control} name="diet" render={({ field }) => (<FormItem className="lg:col-span-2"><FormLabel>Plan de Alimentación</FormLabel><FormControl><Textarea placeholder="Ej. Baja en sodio, alimentos blandos" value={field.value || ""} onChange={field.onChange} onBlur={field.onBlur} /></FormControl><FormMessage /></FormItem>)} />
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
                            <CardDescription>Actualice los contactos de emergencia para el residente.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            {familyContactFields.map((field, index) => (
                                <FamilyContactFields key={field.id} form={form} contactIndex={index} removeContact={removeFamilyContact} />
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => appendFamilyContact({ name: "", kinship: "", address: "", phones: [{ number: "" }], email: "" })}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Agregar Contacto Familiar
                            </Button>
                        </CardContent>
                    </Card>
              </TabsContent>
              
              <TabsContent value="documents">
                <Card>
                    <CardHeader>
                        <CardTitle>Documentos Requeridos</CardTitle>
                        <CardDescription>Actualice los documentos obligatorios del residente.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                        {["Contrato", "Consentimiento Informado", "Cédula de Paciente", "Historia Clínica"].map((type) => (
                            <div key={type} className="space-y-2">
                                <h4 className="font-semibold text-base">{type}</h4>
                                {uploadedFiles[type] ? (
                                    <div className="p-3 rounded-lg border bg-muted/50 space-y-2 text-sm">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-3">
                                                <FileIcon className="w-5 h-5 mt-1 text-muted-foreground" />
                                                <div className="flex-1">
                                                    <p className="font-medium break-all">{uploadedFiles[type].name}</p>
                                                    <div className="flex items-center gap-4 text-muted-foreground mt-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <Weight className="w-3.5 h-3.5" />
                                                            <span>{formatFileSize(uploadedFiles[type].size)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeFile(type)}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label htmlFor={`dropzone-${type}`} className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-card py-6 hover:bg-muted">
                                            <div className=" text-center">
                                                <div className="mx-auto max-w-min rounded-md border p-2">
                                                    <UploadCloud size={20} />
                                                </div>
                                                <p className="mt-2 text-sm text-gray-500">
                                                    <span className="font-semibold">Subir archivo</span>
                                                </p>
                                                <p className="text-xs text-gray-400">PDF, DOCX o JPG de hasta 10MB</p>
                                            </div>
                                        </label>
                                        <Input id={`dropzone-${type}`} type="file" className="hidden" onChange={(e) => handleFileChange(e, type)} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
              </TabsContent>
           </Tabs>
          
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            {resident.status === "Borrador" && (
              <Button type="button" variant="outline" onClick={handleSaveDraftEdit} disabled={isLoading}>
                Guardar borrador
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {resident.status === "Borrador" ? "Guardar y activar" : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  )
}

function FamilyContactFields({ form, contactIndex, removeContact }: { form: any, contactIndex: number, removeContact: (index: number) => void }) {
    const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({
        control: form.control,
        name: `familyContacts.${contactIndex}.phones`
    });
    
    return (
        <div className="p-4 border rounded-md space-y-4 relative">
            <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => removeContact(contactIndex)}>
                <Trash2 className="h-4 w-4" />
            </Button>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField control={form.control} name={`familyContacts.${contactIndex}.name`} render={({ field }) => (<FormItem><FormLabel>Nombre del Contacto <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="Ej. Juan Rodriguez" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name={`familyContacts.${contactIndex}.kinship`} render={({ field }) => (<FormItem><FormLabel>Parentesco <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="Ej. Hijo" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name={`familyContacts.${contactIndex}.email`} render={({ field }) => (<FormItem><FormLabel>Correo Electrónico <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="Ej. juan.r@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name={`familyContacts.${contactIndex}.address`} render={({ field }) => (<FormItem><FormLabel>Dirección <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="Ej. Calle Falsa 123, Ciudad" {...field} /></FormControl><FormMessage /></FormItem>)} />
            
            <div>
                <FormLabel>Números de Teléfono <span className="text-destructive">*</span></FormLabel>
                <div className="space-y-2 mt-2">
                    {phoneFields.map((field, phoneIndex) => (
                        <div key={field.id} className="flex items-center gap-2">
                           <FormField
                                control={form.control}
                                name={`familyContacts.${contactIndex}.phones.${phoneIndex}.number`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <Input placeholder="Ej. +1-202-555-0182" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removePhone(phoneIndex)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendPhone({ number: "" })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Agregar Teléfono
                </Button>
            </div>
        </div>
    );
}