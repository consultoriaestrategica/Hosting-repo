"use client"
import { useStaff } from "@/hooks/use-staff";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState, useEffect, use, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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

function EditStaffForm({ staffId }: { staffId: string }) {
    const { staff, updateStaffMember, isLoading } = useStaff();
    const staffMember = staff.find(s => s.id === staffId);
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<StaffFormValues>({
        resolver: zodResolver(staffFormSchema),
    });

    useEffect(() => {
        if (staffMember) {
            form.reset(staffMember);
        }
    }, [staffMember, form]);

    const handleSaveChanges = (data: StaffFormValues) => {
        if (!staffMember) return;
        updateStaffMember(staffMember.id, data);
        toast({
            title: "Personal Actualizado",
            description: `Los datos de ${data.name} han sido actualizados.`,
        });
        router.push("/dashboard/staff");
    };
    
    if (isLoading) {
        return <div>Cargando...</div>;
    }
    
    if (!staffMember) {
        return <div>Personal no encontrado.</div>;
    }

    return (
        <>
            <h1 className="text-3xl font-bold font-headline mb-6">Editar Personal</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Datos de {staffMember.name}</CardTitle>
                    <CardDescription>Actualice la información del miembro del personal.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSaveChanges)} className="space-y-8">
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
