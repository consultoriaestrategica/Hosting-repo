
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
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useStaff } from "@/hooks/use-staff"
import { useStaffContracts } from "@/hooks/use-staff-contracts"
import { useState, useRef } from "react"
import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { Loader2, UploadCloud, File as FileIcon, X } from "lucide-react"

const staffFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  idNumber: z.string().min(5, { message: "La cédula debe tener al menos 5 caracteres." }),
  role: z.enum(['Enfermera', 'Médico', 'Fisioterapeuta', 'Administrativo', 'Otro']),
  phone: z.string().min(7, { message: "El teléfono debe ser válido." }),
  email: z.string().email({ message: "Correo electrónico inválido." }),
  address: z.string().min(5, { message: "La dirección debe ser válida." }),
  salary: z.coerce.number().min(0, { message: "El salario debe ser un número positivo."}),
  hireDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha de contratación inválida." }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha de fin inválida." }),
  document: z.any().refine(file => file instanceof File, "Debe adjuntar el documento del contrato en formato PDF."),
}).refine(data => new Date(data.endDate) > new Date(data.hireDate), {
    message: "La fecha de fin debe ser posterior a la fecha de inicio.",
    path: ["endDate"],
});


type StaffFormValues = z.infer<typeof staffFormSchema>

export default function NewStaffPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { addStaffMember, isLoading: isStaffLoading } = useStaff()
  const { addStaffContract, isLoading: isContractLoading } = useStaffContracts()
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isLoading = isStaffLoading || isContractLoading || isSaving

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: "",
      idNumber: "",
      phone: "",
      email: "",
      address: "",
      hireDate: new Date().toISOString().split('T')[0],
      endDate: "",
      role: undefined,
      salary: 0,
      document: undefined,
    },
  })

  const documentFile = form.watch("document")

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0]
      if (file.type !== "application/pdf") {
          toast({ variant: "destructive", title: "Archivo inválido", description: "Por favor, suba un archivo en formato PDF." })
          if (fileInputRef.current) fileInputRef.current.value = ""
          form.resetField("document")
          return
      }
      form.setValue("document", file, { shouldValidate: true }) 
    }
  }

  const removeFile = () => {
    if(fileInputRef.current) {
        fileInputRef.current.value = ""
    }
    form.resetField("document")
  }


 async function onSubmit(data: StaffFormValues) {
    setIsSaving(true)
    
    if (!(data.document instanceof File)) {
        toast({ variant: "destructive", title: "Error", description: "Por favor, adjunte el documento del contrato en formato PDF." })
        setIsSaving(false)
        return
    }

    try {
        // Step 1: Create staff member
        const staffData = {
            name: data.name,
            role: data.role as any, // El tipo de role del formulario no coincide exactamente con UserRole
            phone: data.phone,
            email: data.email,
            hireDate: new Date(data.hireDate),
            permissions: [], // Staff requiere permissions
            isActive: true, // En lugar de status: 'Activo'
        }
        const newStaffMember = await addStaffMember(staffData)

        // Step 2: Upload file to Firebase Storage
        const fileToUpload = data.document
        const storageRef = ref(storage, `contracts/staff/${newStaffMember.id}/${Date.now()}-${fileToUpload.name}`)
        await uploadBytes(storageRef, fileToUpload)
        
        // Step 3: Get download URL
        const documentUrl = await getDownloadURL(storageRef)

        // Step 4: Create contract object and save to Firestore
        const newContract = {
            staffId: newStaffMember.id,
            startDate: data.hireDate,
            endDate: data.endDate,
            salary: data.salary,
            status: 'Activo' as const,
            documentName: fileToUpload.name,
            documentUrl: documentUrl, 
            createdAt: new Date().toISOString()
        }

        await addStaffContract(newContract)

        toast({
            title: "Personal y Contrato Creados",
            description: `${data.name} ha sido agregado y su contrato ha sido registrado.`,
        })
        router.push("/dashboard/staff")

    } catch (error) {
        console.error("Error creating staff and contract:", error)
        toast({
            variant: "destructive",
            title: "Error al Guardar",
            description: "No se pudo registrar al personal y su contrato. Por favor, revise la consola para más detalles.",
        })
    } finally {
        setIsSaving(false)
    }
  }


  return (
    <>
      <h1 className="text-3xl font-bold font-headline mb-6">Agregar Nuevo Personal</h1>
      <Card>
        <CardHeader>
            <CardTitle>Datos del Miembro del Personal</CardTitle>
            <CardDescription>Complete el formulario para registrar un nuevo empleado o profesional y su contrato inicial.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                     <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre Completo</FormLabel><FormControl><Input placeholder="Ej. Ana Pérez" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="idNumber" render={({ field }) => (<FormItem><FormLabel>Nº de Cédula</FormLabel><FormControl><Input placeholder="Ej. 12345678" {...field} /></FormControl><FormMessage /></FormItem>)} />
                         <FormField control={form.control} name="role" render={({ field }) => (<FormItem><FormLabel>Cargo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione un cargo" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Enfermera">Enfermera</SelectItem><SelectItem value="Médico">Médico</SelectItem><SelectItem value="Fisioterapeuta">Fisioterapeuta</SelectItem><SelectItem value="Administrativo">Administrativo</SelectItem><SelectItem value="Otro">Otro</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Teléfono de Contacto</FormLabel><FormControl><Input placeholder="Ej. 3001234567" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Correo Electrónico</FormLabel><FormControl><Input type="email" placeholder="ejemplo@email.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Dirección</FormLabel><FormControl><Input placeholder="Ej. Calle Falsa 123" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="salary" render={({ field }) => (<FormItem><FormLabel>Salario Mensual (COP)</FormLabel><FormControl><Input type="number" placeholder="2500000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="hireDate" render={({ field }) => (<FormItem><FormLabel>Fecha de Inicio Contrato</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="endDate" render={({ field }) => (<FormItem><FormLabel>Fecha de Fin Contrato</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                     </div>

                    <FormField
                        control={form.control}
                        name="document"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Documento del Contrato (PDF)</FormLabel>
                                {documentFile instanceof File ? (
                                     <div className="p-3 rounded-lg border bg-muted/50 flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            <FileIcon className="h-5 w-5 text-muted-foreground" />
                                            <span className="truncate max-w-xs">{documentFile.name}</span>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={removeFile}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <FormControl>
                                        <label htmlFor="file-upload" className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-card py-6 hover:bg-muted">
                                            <div className=" text-center">
                                                <UploadCloud size={20} />
                                                <p className="mt-2 text-sm text-gray-500">
                                                    <span className="font-semibold">Subir archivo PDF</span>
                                                </p>
                                            </div>
                                             <Input id="file-upload" ref={fileInputRef} type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
                                        </label>
                                    </FormControl>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                     <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                        Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? "Guardando..." : "Guardar Personal y Contrato"}
                        </Button>
                    </div>
                </form>
            </Form>
        </CardContent>
      </Card>
    </>
  )
}
