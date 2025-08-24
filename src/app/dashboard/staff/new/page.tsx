
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

const staffFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  idNumber: z.string().min(5, { message: "La cédula debe tener al menos 5 caracteres." }),
  role: z.enum(['Enfermera', 'Médico', 'Fisioterapeuta', 'Administrativo', 'Otro']),
  phone: z.string().min(7, { message: "El teléfono debe ser válido." }),
  email: z.string().email({ message: "Correo electrónico inválido." }),
  address: z.string().min(5, { message: "La dirección debe ser válida." }),
  salary: z.coerce.number().min(0, { message: "El salario debe ser un número positivo."}),
  status: z.enum(["Activo", "Inactivo"]),
  hireDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha de contratación inválida." }),
})

type StaffFormValues = z.infer<typeof staffFormSchema>

export default function NewStaffPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { addStaffMember, isLoading } = useStaff()

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: "",
      idNumber: "",
      phone: "",
      email: "",
      address: "",
      status: "Activo",
      hireDate: new Date().toISOString().split('T')[0],
      role: undefined,
      salary: 0,
    },
  })

 function onSubmit(data: StaffFormValues) {
    addStaffMember(data);
    toast({
      title: "Personal Registrado",
      description: `${data.name} ha sido agregado exitosamente al sistema.`,
    })
    router.push("/dashboard/staff")
  }


  return (
    <>
      <h1 className="text-3xl font-bold font-headline mb-6">Agregar Nuevo Personal</h1>
      <Card>
        <CardHeader>
            <CardTitle>Datos del Miembro del Personal</CardTitle>
            <CardDescription>Complete el formulario para registrar un nuevo empleado o profesional.</CardDescription>
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
                        <FormField control={form.control} name="hireDate" render={({ field }) => (<FormItem><FormLabel>Fecha de Contratación</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                         <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Estado</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione el estado" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Activo">Activo</SelectItem><SelectItem value="Inactivo">Inactivo</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                     </div>
                     <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                        Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Guardando..." : "Guardar Personal"}
                        </Button>
                    </div>
                </form>
            </Form>
        </CardContent>
      </Card>
    </>
  )
}
