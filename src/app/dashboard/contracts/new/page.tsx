
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
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useResidents } from "@/hooks/use-residents"
import { useContracts } from "@/hooks/use-contracts"
import { useState, useEffect, useRef } from "react"
import { Loader2, UploadCloud, File as FileIcon, X } from "lucide-react"
import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

const contractFormSchema = z.object({
  residentId: z.string({ required_error: "Debe seleccionar un residente." }),
  contractType: z.enum(["Habitación compartida", "Habitación individual"], { required_error: "Debe seleccionar un tipo de contrato." }),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha de inicio inválida." }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha de fin inválida." }),
  document: z.any().refine(file => file instanceof File, "Debe adjuntar el documento del contrato en formato PDF."),
}).refine(data => new Date(data.endDate) > new Date(data.startDate), {
    message: "La fecha de fin debe ser posterior a la fecha de inicio.",
    path: ["endDate"],
});


type ContractFormValues = z.infer<typeof contractFormSchema>

export default function NewContractPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { residents } = useResidents()
  const { addContract } = useContracts()
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      residentId: "",
      contractType: undefined,
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
    },
  })

  const residentId = form.watch("residentId");
  const documentFile = form.watch("document");

  useEffect(() => {
    if (residentId) {
      const selectedResident = residents.find(r => r.id === residentId);
      if (selectedResident) {
        form.setValue("contractType", selectedResident.roomType);
      }
    } else {
        form.setValue("contractType", undefined);
    }
  }, [residentId, residents, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type !== "application/pdf") {
          toast({ variant: "destructive", title: "Archivo inválido", description: "Por favor, suba un archivo en formato PDF." });
          if (fileInputRef.current) fileInputRef.current.value = "";
          form.resetField("document");
          return;
      }
      form.setValue("document", file, { shouldValidate: true }); 
    }
  };

  const removeFile = () => {
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    form.resetField("document");
  };


 async function onSubmit(data: ContractFormValues) {
    setIsSaving(true);
    const resident = residents.find(r => r.id === data.residentId);

    if (!resident) {
      toast({ variant: "destructive", title: "Error", description: "Por favor, seleccione un residente válido." });
      setIsSaving(false);
      return;
    }
    
    if (!(data.document instanceof File)) {
        toast({ variant: "destructive", title: "Error", description: "Por favor, adjunte el documento del contrato en formato PDF." });
        setIsSaving(false);
        return;
    }
    
    try {
        // Step 1: Upload file to Firebase Storage
        const fileToUpload = data.document;
        const storageRef = ref(storage, `contracts/residents/${resident.id}/${fileToUpload.name}`);
        await uploadBytes(storageRef, fileToUpload);
        
        // Step 2: Get download URL
        const documentUrl = await getDownloadURL(storageRef);

        // Step 3: Create contract object and save to Firestore
        const newContract = {
            residentId: data.residentId,
            contractType: data.contractType,
            startDate: data.startDate,
            endDate: data.endDate,
            status: 'Activo' as const,
            documentName: fileToUpload.name,
            documentUrl: documentUrl, 
            createdAt: new Date().toISOString()
        };

        const addedContract = await addContract(newContract);

        toast({
            title: "Contrato Guardado Exitosamente",
            description: `Se ha creado un nuevo contrato para ${resident.name}.`,
        });

        router.push(`/dashboard/contracts/${addedContract.id}?type=resident`);

    } catch (error) {
        console.error("Error saving contract:", error);
        toast({
            variant: "destructive",
            title: "Error al Guardar Contrato",
            description: "No se pudo guardar el contrato. Verifique la consola para más detalles y asegúrese de que las reglas de Firebase Storage estén configuradas correctamente.",
        });
    } finally {
        setIsSaving(false);
    }
  }


  return (
    <>
      <h1 className="text-3xl font-bold font-headline mb-6">Crear Nuevo Contrato</h1>
      <Card>
        <CardHeader>
            <CardTitle>Datos del Contrato</CardTitle>
            <CardDescription>Complete los datos y adjunte el documento PDF del contrato.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                     <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FormField
                            control={form.control}
                            name="residentId"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Residente</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Seleccione un residente" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {residents.filter(r => r.status === 'Activo').map(r => (<SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>))}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="contractType"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Contrato</FormLabel>
                                 <FormControl>
                                     <Input readOnly {...field} value={field.value || 'Seleccione un residente'}  />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField control={form.control} name="startDate" render={({ field }) => (<FormItem><FormLabel>Fecha de Inicio</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="endDate" render={({ field }) => (<FormItem><FormLabel>Fecha de Fin</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
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


                     <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSaving}>
                        Cancelar
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSaving ? "Guardando..." : "Guardar Contrato"}
                        </Button>
                    </div>
                </form>
            </Form>
        </CardContent>
      </Card>
    </>
  )
}
