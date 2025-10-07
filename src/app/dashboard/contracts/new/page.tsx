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
import { useResidents } from "@/hooks/use-residents"
import { useContracts as useResidentContracts } from "@/hooks/use-contracts"
import { useStaff } from "@/hooks/use-staff"
import { useStaffContracts } from "@/hooks/use-staff-contracts"
import { useState, useEffect, useRef } from "react"
import { Loader2, UploadCloud, File as FileIcon, X, User, Briefcase } from "lucide-react"
import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Define room type enum
type RoomType = "Habitación compartida" | "Habitación individual";

// Resident Contract Schema - SIMPLIFICADO
const residentContractSchema = z.object({
  residentId: z.string().min(1, "Debe seleccionar un residente."),
  contractType: z.string().min(1, "Debe seleccionar un tipo de contrato."),
  startDate: z.string().min(1, "Fecha de inicio es requerida."),
  endDate: z.string().min(1, "Fecha de fin es requerida."),
  document: z.any().optional(),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) > new Date(data.startDate);
  }
  return true;
}, {
  message: "La fecha de fin debe ser posterior a la fecha de inicio.",
  path: ["endDate"],
});

type ResidentContractValues = z.infer<typeof residentContractSchema>;

// Staff Contract Schema - SIMPLIFICADO
const staffContractSchema = z.object({
  staffId: z.string().min(1, "Debe seleccionar un miembro del personal."),
  salary: z.coerce.number().min(1, "El salario es requerido."),
  startDate: z.string().min(1, "Fecha de inicio es requerida."),
  endDate: z.string().min(1, "Fecha de fin es requerida."),
  document: z.any().optional(),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) > new Date(data.startDate);
  }
  return true;
}, {
  message: "La fecha de fin debe ser posterior a la fecha de inicio.",
  path: ["endDate"],
});

type StaffContractValues = z.infer<typeof staffContractSchema>;

export default function NewContractPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { residents } = useResidents()
  const { staff } = useStaff()
  const { addContract: addResidentContract } = useResidentContracts()
  const { addStaffContract } = useStaffContracts()

  const [isSaving, setIsSaving] = useState(false)
  const [contractFor, setContractFor] = useState("resident")
  const residentFileInputRef = useRef<HTMLInputElement>(null)
  const staffFileInputRef = useRef<HTMLInputElement>(null)

  // Form for Resident Contract
  const residentForm = useForm<ResidentContractValues>({
    resolver: zodResolver(residentContractSchema),
    defaultValues: {
      residentId: "",
      contractType: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      document: undefined,
    },
  })

  // Form for Staff Contract
  const staffForm = useForm<StaffContractValues>({
    resolver: zodResolver(staffContractSchema),
    defaultValues: {
      staffId: "",
      salary: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      document: undefined,
    },
  });

  const residentId = residentForm.watch("residentId");
  const residentDocumentFile = residentForm.watch("document");
  const staffDocumentFile = staffForm.watch("document");

  useEffect(() => {
    if (residentId) {
      const selectedResident = residents.find(r => r.id === residentId);
      if (selectedResident && selectedResident.roomType) {
        residentForm.setValue("contractType", selectedResident.roomType);
      }
    } else {
      residentForm.setValue("contractType", "");
    }
  }, [residentId, residents, residentForm]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, formType: 'resident' | 'staff') => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      if (file.type !== "application/pdf") {
        toast({ 
          variant: "destructive", 
          title: "Archivo inválido", 
          description: "Por favor, suba un archivo en formato PDF." 
        });
        if(formType === 'resident' && residentFileInputRef.current) {
          residentFileInputRef.current.value = "";
        }
        if(formType === 'staff' && staffFileInputRef.current) {
          staffFileInputRef.current.value = "";
        }
        return;
      }
      
      if(formType === 'resident') {
        residentForm.setValue("document", file);
      }
      if(formType === 'staff') {
        staffForm.setValue("document", file);
      }
    }
  };

  const removeFile = (formType: 'resident' | 'staff') => {
    if(formType === 'resident') {
      if(residentFileInputRef.current) {
        residentFileInputRef.current.value = "";
      }
      residentForm.setValue("document", undefined);
    }
    if(formType === 'staff') {
      if(staffFileInputRef.current) {
        staffFileInputRef.current.value = "";
      }
      staffForm.setValue("document", undefined);
    }
  };

  async function onResidentSubmit(data: ResidentContractValues) {
    setIsSaving(true);
    const resident = residents.find(r => r.id === data.residentId);

    // Validación manual del archivo
    if (!resident || !data.document || !(data.document instanceof File)) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Datos incompletos o archivo faltante." 
      });
      setIsSaving(false);
      return;
    }
    
    try {
      const fileToUpload = data.document;
      const timestamp = Date.now();
      const fileName = `${timestamp}-${fileToUpload.name}`;
      const storageRef = ref(storage, `contracts/residents/${resident.id}/${fileName}`);
      
      console.log('Uploading file to:', `contracts/residents/${resident.id}/${fileName}`);
      await uploadBytes(storageRef, fileToUpload);
      const documentUrl = await getDownloadURL(storageRef);
      console.log('File uploaded successfully, URL:', documentUrl);

      const newContract = {
        residentId: data.residentId,
        contractType: data.contractType as RoomType,
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'Activo' as const,
        documentName: fileToUpload.name,
        documentUrl: documentUrl, 
        createdAt: new Date().toISOString()
      };

      const addedContract = await addResidentContract(newContract);
      toast({ 
        title: "Contrato Guardado", 
        description: `Se ha creado un nuevo contrato para ${resident.name}.` 
      });
      router.push(`/dashboard/contracts/${addedContract.id}?type=resident`);
    } catch (error) {
      console.error("Error saving resident contract:", error);
      toast({ 
        variant: "destructive", 
        title: "Error al Guardar", 
        description: "No se pudo guardar el contrato del residente." 
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function onStaffSubmit(data: StaffContractValues) {
    setIsSaving(true);
    const staffMember = staff.find(s => s.id === data.staffId);
    
    // Validación manual del archivo
    if (!staffMember || !data.document || !(data.document instanceof File)) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Datos incompletos o archivo faltante." 
      });
      setIsSaving(false);
      return;
    }

    try {
      const fileToUpload = data.document;
      const timestamp = Date.now();
      const fileName = `${timestamp}-${fileToUpload.name}`;
      const storageRef = ref(storage, `contracts/staff/${staffMember.id}/${fileName}`);
      
      console.log('Uploading file to:', `contracts/staff/${staffMember.id}/${fileName}`);
      await uploadBytes(storageRef, fileToUpload);
      const documentUrl = await getDownloadURL(storageRef);
      console.log('File uploaded successfully, URL:', documentUrl);
      
      const newContract = {
        staffId: data.staffId,
        salary: data.salary,
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'Activo' as const,
        documentName: fileToUpload.name,
        documentUrl: documentUrl, 
        createdAt: new Date().toISOString()
      };

      const addedContract = await addStaffContract(newContract);
      toast({ 
        title: "Contrato Guardado", 
        description: `Se ha creado un nuevo contrato para ${staffMember.name}.` 
      });
      router.push(`/dashboard/contracts/${addedContract.id}?type=staff`);
    } catch (error) {
      console.error("Error saving staff contract:", error);
      toast({ 
        variant: "destructive", 
        title: "Error al Guardar", 
        description: "No se pudo guardar el contrato del personal." 
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
          <CardTitle>Tipo de Contrato</CardTitle>
          <CardDescription>
            Seleccione si el contrato es para un residente o para un miembro del personal.
          </CardDescription>
          <Tabs value={contractFor} onValueChange={setContractFor} className="w-full pt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="resident">
                <User className="mr-2"/>Para Residente
              </TabsTrigger>
              <TabsTrigger value="staff">
                <Briefcase className="mr-2"/>Para Personal
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        
        {contractFor === 'resident' && (
          <CardContent>
            <Form {...residentForm}>
              <form onSubmit={residentForm.handleSubmit(onResidentSubmit)} className="space-y-8">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField 
                    control={residentForm.control} 
                    name="residentId" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Residente</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un residente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {residents
                              .filter(r => r.status === 'Activo')
                              .map(r => (
                                <SelectItem key={r.id} value={r.id}>
                                  {r.name}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField 
                    control={residentForm.control} 
                    name="contractType" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Habitación</FormLabel>
                        <FormControl>
                          <Input 
                            readOnly 
                            {...field} 
                            value={field.value || 'Seleccione un residente'} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField 
                    control={residentForm.control} 
                    name="startDate" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Inicio</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} 
                  />
                  
                  <FormField 
                    control={residentForm.control} 
                    name="endDate" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Fin</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} 
                  />
                </div>
                
                <FormField 
                  control={residentForm.control} 
                  name="document" 
                  render={() => (
                    <FormItem>
                      <FormLabel>Documento del Contrato (PDF)</FormLabel>
                      {residentDocumentFile instanceof File ? (
                        <div className="p-3 rounded-lg border bg-muted/50 flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <FileIcon className="h-5 w-5 text-muted-foreground" />
                            <span className="truncate max-w-xs">
                              {residentDocumentFile.name}
                            </span>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7" 
                            onClick={() => removeFile('resident')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <FormControl>
                          <label 
                            htmlFor="resident-file-upload" 
                            className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-card py-6 hover:bg-muted"
                          >
                            <div className="text-center">
                              <UploadCloud size={20} />
                              <p className="mt-2 text-sm text-gray-500">
                                <span className="font-semibold">Subir archivo PDF</span>
                              </p>
                            </div>
                            <Input 
                              id="resident-file-upload" 
                              ref={residentFileInputRef} 
                              type="file" 
                              className="hidden" 
                              accept=".pdf" 
                              onChange={(e) => handleFileChange(e, 'resident')} 
                            />
                          </label>
                        </FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.back()} 
                    disabled={isSaving}
                  >
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
        )}

        {contractFor === 'staff' && (
          <CardContent>
            <Form {...staffForm}>
              <form onSubmit={staffForm.handleSubmit(onStaffSubmit)} className="space-y-8">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField 
                    control={staffForm.control} 
                    name="staffId" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Miembro del Personal</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un empleado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {staff
                              .filter(s => s.status === 'Activo')
                              .map(s => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField 
                    control={staffForm.control} 
                    name="salary" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salario Mensual (COP)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="2500000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} 
                  />
                  
                  <FormField 
                    control={staffForm.control} 
                    name="startDate" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Inicio</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} 
                  />
                  
                  <FormField 
                    control={staffForm.control} 
                    name="endDate" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Fin</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} 
                  />
                </div>
                
                <FormField 
                  control={staffForm.control} 
                  name="document" 
                  render={() => (
                    <FormItem>
                      <FormLabel>Documento del Contrato (PDF)</FormLabel>
                      {staffDocumentFile instanceof File ? (
                        <div className="p-3 rounded-lg border bg-muted/50 flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <FileIcon className="h-5 w-5 text-muted-foreground" />
                            <span className="truncate max-w-xs">
                              {staffDocumentFile.name}
                            </span>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7" 
                            onClick={() => removeFile('staff')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <FormControl>
                          <label 
                            htmlFor="staff-file-upload" 
                            className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-card py-6 hover:bg-muted"
                          >
                            <div className="text-center">
                              <UploadCloud size={20} />
                              <p className="mt-2 text-sm text-gray-500">
                                <span className="font-semibold">Subir archivo PDF</span>
                              </p>
                            </div>
                            <Input 
                              id="staff-file-upload" 
                              ref={staffFileInputRef} 
                              type="file" 
                              className="hidden" 
                              accept=".pdf" 
                              onChange={(e) => handleFileChange(e, 'staff')} 
                            />
                          </label>
                        </FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.back()} 
                    disabled={isSaving}
                  >
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
        )}
      </Card>
    </>
  )
}