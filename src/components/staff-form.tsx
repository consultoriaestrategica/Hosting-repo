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
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useStaff } from "@/hooks/use-staff"
import { useStaffContracts } from "@/hooks/use-staff-contracts"
import { useEffect, useMemo, useState, useRef } from "react"
import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { Loader2, UploadCloud, File as FileIcon, X } from "lucide-react"
import { ROLE_PERMISSIONS } from "@/types/user"
import { staffFormSchema, staffPositions, mapPositionToRole, type StaffFormValues } from "@/lib/schemas/staff"

export default function StaffForm({ mode, staffId }: { mode: "create" | "edit"; staffId?: string }) {
  const { toast } = useToast()
  const router = useRouter()
  const { staff, addStaffMember, updateStaffMember, isLoading: isStaffLoading } = useStaff()
  const { contracts: staffContracts, addStaffContract, updateStaffContract, isLoading: isContractLoading } = useStaffContracts()
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isLoading = isStaffLoading || isContractLoading || isSaving

  const staffMember = useMemo(
    () => (mode === "edit" ? staff.find(s => s.id === staffId) : undefined),
    [mode, staff, staffId]
  )
  const contract = useMemo(() => {
    if (mode !== "edit" || !staffMember) return null
    return staffContracts
      .filter(c => c.staffId === staffMember.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null
  }, [mode, staffContracts, staffMember])

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: "",
      idNumber: "",
      phone: "",
      email: "",
      address: "",
      hireDate: mode === "create" ? new Date().toISOString().split('T')[0] : "",
      endDate: "",
      role: undefined,
      salary: 0,
      document: undefined,
    },
  })

  useEffect(() => {
    if (mode !== "edit" || !staffMember || !contract) return
    form.reset({
      name: staffMember.name || "",
      idNumber: staffMember.idNumber || "",
      role: (staffMember.position as StaffFormValues["role"]) || undefined,
      phone: staffMember.phone || "",
      email: staffMember.email || "",
      address: staffMember.address || "",
      hireDate: staffMember.hireDate ? new Date(staffMember.hireDate).toISOString().split('T')[0] : "",
      endDate: contract.endDate ? new Date(contract.endDate).toISOString().split('T')[0] : "",
      salary: contract.salary || 0,
      document: contract.documentName,
    })
  }, [mode, staffMember, contract, form])

  const documentValue = form.watch("document")

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
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    form.setValue("document", undefined, { shouldValidate: true })
  }

  async function onSubmit(data: StaffFormValues) {
    if (mode === "create" && !(data.document instanceof File)) {
      toast({ variant: "destructive", title: "Error", description: "Por favor, adjunte el documento del contrato en formato PDF." })
      return
    }

    setIsSaving(true)

    const role = mapPositionToRole(data.role)
    const permissions = ROLE_PERMISSIONS[role] || []

    try {
      if (mode === "create") {
        const fileToUpload = data.document as File

        const staffData = {
          name: data.name,
          idNumber: data.idNumber,
          role,
          position: data.role,
          phone: data.phone,
          email: data.email,
          address: data.address,
          hireDate: new Date(data.hireDate),
          permissions,
          isActive: true,
        }
        const newStaffMember = await addStaffMember(staffData)

        const storageRef = ref(storage, `contracts/staff/${newStaffMember.id}/${Date.now()}-${fileToUpload.name}`)
        await uploadBytes(storageRef, fileToUpload)
        const documentUrl = await getDownloadURL(storageRef)

        const newContract = {
          staffId: newStaffMember.id,
          startDate: data.hireDate,
          endDate: data.endDate,
          salary: data.salary,
          status: 'Activo' as const,
          documentName: fileToUpload.name,
          documentUrl,
          createdAt: new Date().toISOString(),
        }
        await addStaffContract(newContract)

        toast({
          title: "Personal y Contrato Creados",
          description: `${data.name} ha sido agregado y su contrato ha sido registrado.`,
        })
        router.push("/dashboard/staff")
      } else {
        if (!staffMember || !contract) {
          toast({ variant: "destructive", title: "Error", description: "No se encontraron los datos del personal o del contrato para actualizar." })
          return
        }

        const staffData = {
          name: data.name,
          idNumber: data.idNumber,
          role,
          position: data.role,
          phone: data.phone,
          email: data.email,
          address: data.address,
          hireDate: new Date(data.hireDate),
          permissions,
        }
        await updateStaffMember(staffMember.id, staffData)

        const contractUpdates: any = {
          startDate: data.hireDate,
          endDate: data.endDate,
          salary: data.salary,
        }

        if (data.document instanceof File) {
          const fileToUpload = data.document
          const storageRef = ref(storage, `contracts/staff/${staffMember.id}/${Date.now()}-${fileToUpload.name}`)
          await uploadBytes(storageRef, fileToUpload)
          const documentUrl = await getDownloadURL(storageRef)
          contractUpdates.documentUrl = documentUrl
          contractUpdates.documentName = fileToUpload.name
        }

        await updateStaffContract(contract.id, contractUpdates)

        toast({
          title: "Datos Actualizados",
          description: `Los datos de ${data.name} y su contrato han sido actualizados.`,
        })
        router.push("/dashboard/staff")
      }
    } catch (error) {
      console.error("Error al guardar personal y contrato:", error)
      toast({
        variant: "destructive",
        title: "Error al Guardar",
        description: "No se pudo guardar la información. Por favor, revise la consola para más detalles.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (mode === "edit" && (isStaffLoading || isContractLoading)) {
    return <div>Cargando...</div>
  }
  if (mode === "edit" && !staffMember) {
    return <div>Personal no encontrado.</div>
  }
  if (mode === "edit" && !contract) {
    return <div>Contrato no encontrado para este miembro del personal.</div>
  }

  return (
    <>
      <h1 className="text-3xl font-bold font-headline mb-6">
        {mode === "create" ? "Agregar Nuevo Personal" : "Editar Personal y Contrato"}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>{mode === "create" ? "Datos del Miembro del Personal" : `Datos de ${staffMember?.name}`}</CardTitle>
          <CardDescription>
            {mode === "create"
              ? "Complete el formulario para registrar un nuevo empleado o profesional y su contrato inicial."
              : "Actualice la información del miembro del personal y su contrato laboral."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre Completo</FormLabel><FormControl><Input placeholder="Ej. Ana Pérez" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="idNumber" render={({ field }) => (<FormItem><FormLabel>Nº de Cédula</FormLabel><FormControl><Input placeholder="Ej. 12345678" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="role" render={({ field }) => (<FormItem><FormLabel>Cargo</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione un cargo" /></SelectTrigger></FormControl><SelectContent>{staffPositions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Teléfono de Contacto</FormLabel><FormControl><Input placeholder="Ej. 3001234567" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Correo Electrónico</FormLabel><FormControl><Input type="email" placeholder="ejemplo@email.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Dirección</FormLabel><FormControl><Input placeholder="Ej. Calle Falsa 123" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="salary" render={({ field }) => (<FormItem><FormLabel>Salario Mensual (COP)</FormLabel><FormControl><Input type="number" placeholder="2500000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="hireDate" render={({ field }) => (<FormItem><FormLabel>Fecha de Inicio Contrato</FormLabel><FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="endDate" render={({ field }) => (<FormItem><FormLabel>Fecha de Fin Contrato</FormLabel><FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
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
                              <span className="font-semibold">{mode === "create" ? "Subir archivo PDF" : "Subir nuevo PDF"}</span>
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
                  {isLoading ? "Guardando..." : mode === "create" ? "Guardar Personal y Contrato" : "Guardar Cambios"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  )
}
