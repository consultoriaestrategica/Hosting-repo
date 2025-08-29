
"use client"
import { useStaff } from "@/hooks/use-staff";
import { useStaffContracts } from "@/hooks/use-staff-contracts";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState, useEffect, use, Suspense, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
import { Loader2, UploadCloud, File as FileIcon, X } from "lucide-react";

const staffFormSchema = z.object({
  // Staff fields
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  idNumber: z.string().min(5, { message: "La cédula debe tener al menos 5 caracteres." }),
  role: z.enum(['Enfermera', 'Médico', 'Fisioterapeuta', 'Administrativo', 'Otro']),
  phone: z.string().min(7, { message: "El teléfono debe ser válido." }),
  email: z.string().email({ message: "Correo electrónico inválido." }),
  address: z.string().min(5, { message: "La dirección debe ser válida." }),
  salary: z.coerce.number().min(0, { message: "El salario debe ser un número positivo."}),
  status: z.enum(["Activo", "Inactivo"]),
  hireDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha de contratación inválida." }),

  // Contract fields
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha de fin inválida." }),
  document: z.any().optional(),
}).refine(data => new Date(data.endDate) > new Date(data.hireDate), {
    message: "La fecha de fin debe ser posterior a la fecha de inicio.",
    path: ["endDate"],
});


type StaffFormValues = z.infer<typeof staffFormSchema>

function EditStaffForm({ staffId }: { staffId: string }) {
    const { staff, updateStaffMember, isLoading: staffLoading } = useStaff();
    const { contracts: staffContracts, updateContract, isLoading: contractsLoading } = useStaffContracts();
    const { toast } = useToast();
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isLoading = staffLoading || contractsLoading || isSaving;

    const staffMember = useMemo(() => staff.find(s => s.id === staffId), [staff, staffId]);
    const contract = useMemo(() => {
        if (!staffMember) return null;
        // Find the most recent contract for this staff member
        return staffContracts
            .filter(c => c.staffId === staffMember.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;
    }, [staffContracts, staffMember]);

    const form = useForm<StaffFormValues>({
        resolver: zodResolver(staffFormSchema),
        defaultValues: {},
    });

    useEffect(() => {
        if (staffMember && contract) {
            form.reset({
                ...staffMember,
                endDate: contract.endDate,
                salary: contract.salary,
                document: contract.documentName, // Initially set to the name of the existing document
            });
        }
    }, [staffMember, contract, form]);
    
    const documentValue = form.watch("document");

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
        // Reset to original document if available, otherwise clear it
        form.setValue("document", contract?.documentName || undefined);
    };

    const handleSaveChanges = async (data: StaffFormValues) => {
        if (!staffMember || !contract) {
            toast({ variant: "destructive", title: "Error", description: "No se encontraron los datos del personal o del contrato para actualizar." });
            return;
        }
        setIsSaving(true);
        
        try {
            // Update staff member details
            const staffData = {
                name: data.name,
                idNumber: data.idNumber,
                role: data.role,
                phone: data.phone,
                email: data.email,
                address: data.address,
                status: data.status,
                hireDate: data.hireDate,
            };
            await updateStaffMember(staffMember.id, staffData);

            // Prepare contract updates
            const contractUpdates: Partial<StaffFormValues & { documentUrl: string, documentName: string }> = {
                startDate: data.hireDate,
                endDate: data.endDate,
                salary: data.salary,
            };

            // Check if a new file was uploaded
            if (data.document instanceof File) {
                const fileToUpload = data.document;
                const storageRef = ref(storage, `contracts/staff/${staffMember.id}/${Date.now()}-${fileToUpload.name}`);
                await uploadBytes(storageRef, fileToUpload);
                const documentUrl = await getDownloadURL(storageRef);
                contractUpdates.documentUrl = documentUrl;
                contractUpdates.documentName = fileToUpload.name;
            }

            await updateContract(contract.id, contractUpdates);

            toast({
                title: "Datos Actualizados",
                description: `Los datos de ${data.name} y su contrato han sido actualizados.`,
            });
            router.push("/dashboard/staff");
        } catch (error) {
             console.error("Error updating staff and contract:", error);
             toast({
                variant: "destructive",
                title: "Error al Guardar",
                description: "No se pudieron actualizar los datos. Por favor, revise la consola.",
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (staffLoading || contractsLoading) {
        return <div>Cargando...</div>;
    }
    
    if (!staffMember) {
        return <div>Personal no encontrado.</div>;
    }
    
    if (!contract) {
        return <div>Contrato no encontrado para este miembro del personal.</div>;
    }

    return (
        <>
            <h1 className="text-3xl font-bold font-headline mb-6">Editar Personal y Contrato</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Datos de {staffMember.name}</CardTitle>
                    <CardDescription>Actualice la información del miembro del personal y su contrato laboral.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSaveChanges)} className="space-y-8">
                             <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre Completo</FormLabel><FormControl><Input placeholder="Ej. Ana Pérez" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="idNumber" render={({ field }) => (<FormItem><FormLabel>Nº de Cédula</FormLabel><FormControl><Input placeholder="Ej. 12345678" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="role" render={({ field }) => (<FormItem><FormLabel>Cargo</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione un cargo" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Enfermera">Enfermera</SelectItem><SelectItem value="Médico">Médico</SelectItem><SelectItem value="Fisioterapeuta">Fisioterapeuta</SelectItem><SelectItem value="Administrativo">Administrativo</SelectItem><SelectItem value="Otro">Otro</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Teléfono de Contacto</FormLabel><FormControl><Input placeholder="Ej. 3001234567" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Correo Electrónico</FormLabel><FormControl><Input type="email" placeholder="ejemplo@email.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Dirección</FormLabel><FormControl><Input placeholder="Ej. Calle Falsa 123" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="salary" render={({ field }) => (<FormItem><FormLabel>Salario Mensual (COP)</FormLabel><FormControl><Input type="number" placeholder="2500000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="hireDate" render={({ field }) => (<FormItem><FormLabel>Fecha de Inicio Contrato</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="endDate" render={({ field }) => (<FormItem><FormLabel>Fecha de Fin Contrato</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Estado</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione el estado" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Activo">Activo</SelectItem><SelectItem value="Inactivo">Inactivo</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                            </div>

                             <FormField
                                control={form.control}
                                name="document"
                                render={() => (
                                    <FormItem>
                                        <FormLabel>Documento del Contrato (PDF)</FormLabel>
                                        {documentValue ? (
                                            <div className="p-3 rounded-lg border bg-muted/50 flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-2">
                                                    <FileIcon className="h-5 w-5 text-muted-foreground" />
                                                    <span className="truncate max-w-xs">{typeof documentValue === 'string' ? documentValue : documentValue.name}</span>
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
                                                            <span className="font-semibold">Subir nuevo PDF</span>
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
                                    {isLoading ? "Guardando..." : "Guardar Cambios"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </>
    )
}

export default function EditStaffPage({ params }: { params: { id: string } }) {
    const id = use(params).id;

    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <EditStaffForm staffId={id} />
        </Suspense>
    )
}
