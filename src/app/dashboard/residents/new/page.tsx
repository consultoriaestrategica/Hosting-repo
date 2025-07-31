
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
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useResidents } from "@/hooks/use-residents"
import { useState, useEffect } from "react"

const residentFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha de nacimiento inválida." }),
  idNumber: z.string().min(5, { message: "La cédula debe tener al menos 5 caracteres." }),
  gender: z.enum(["Femenino", "Masculino", "Otro"]),
  status: z.enum(["Activo", "Inactivo"]),
  pathologies: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
  diet: z.string().optional(),
  dependency: z.enum(["Baja", "Media", "Alta"]),
  familyName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  familyKinship: z.string().min(2, { message: "El parentesco debe tener al menos 2 caracteres." }),
  familyPhone: z.string().min(7, { message: "El teléfono debe ser válido." }),
  familyEmail: z.string().email({ message: "Correo electrónico inválido." }),
})

type ResidentFormValues = z.infer<typeof residentFormSchema>

export default function NewResidentPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { addResident, isLoading } = useResidents()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const form = useForm<ResidentFormValues>({
    resolver: zodResolver(residentFormSchema),
    defaultValues: {
      name: "",
      dob: "",
      idNumber: "",
      pathologies: "",
      allergies: "",
      medications: "",
      diet: "",
      familyName: "",
      familyKinship: "",
      familyPhone: "",
      familyEmail: "",
      status: "Activo",
    },
  })

 function onSubmit(data: ResidentFormValues) {
    const age = new Date().getFullYear() - new Date(data.dob).getFullYear();
    const newResident = {
        id: `res-${Date.now()}`,
        name: data.name,
        age: age,
        pathology: data.pathologies?.split(',')[0].trim() || 'N/A',
        dependency: data.dependency,
        status: data.status,
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
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Información del Residente</CardTitle>
                  <CardDescription>Complete los datos demográficos y de contacto.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej. Maria Rodriguez" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dob"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de Nacimiento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="idNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nº de Cédula</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej. 12345678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Género</FormLabel>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione un género" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Femenino">Femenino</SelectItem>
                              <SelectItem value="Masculino">Masculino</SelectItem>
                              <SelectItem value="Otro">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
             <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Información Médica y de Cuidado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField
                        control={form.control}
                        name="pathologies"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Patologías Principales</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Ej. Alzheimer, Hipertensión (separadas por comas)" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="medications"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Medicamentos Recetados</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Ej. Donepezilo 10mg, Lisinopril 20mg (separadas por comas)" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="allergies"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Alergias Conocidas</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Ej. Penicilina, Mariscos (separadas por comas)" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                         <FormField
                        control={form.control}
                        name="diet"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Plan de Alimentación</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Ej. Baja en sodio, alimentos blandos" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                            control={form.control}
                            name="dependency"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Nivel de Dependencia</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione un nivel" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="Baja">Baja</SelectItem>
                                    <SelectItem value="Media">Media</SelectItem>
                                    <SelectItem value="Alta">Alta</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione el estado" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                <SelectItem value="Activo">Activo</SelectItem>
                                <SelectItem value="Inactivo">Inactivo</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                </CardContent>
              </Card>
            </div>
             <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Información de Contacto Familiar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                     <FormField
                      control={form.control}
                      name="familyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Contacto</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej. Juan Rodriguez" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                      <FormField
                      control={form.control}
                      name="familyKinship"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parentesco</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej. Hijo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                      <FormField
                      control={form.control}
                      name="familyPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej. +1-202-555-0182" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                      <FormField
                      control={form.control}
                      name="familyEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo Electrónico</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej. juan.r@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
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
