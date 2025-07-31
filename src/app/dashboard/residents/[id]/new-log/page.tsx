
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
import { useLogs } from "@/hooks/use-logs"
import { useState, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"

const logFormSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha inválida." }),
  mood: z.enum(["Feliz", "Calmado", "Ansioso", "Agitado", "Triste"]),
  appetite: z.enum(["Bueno", "Regular", "Pobre"]),
  sleep: z.enum(["Reparador", "Interrumpido", "Poco"]),
  vitals: z.string().optional(),
  medsAdministered: z.boolean().default(false).optional(),
  notes: z.string().min(5, { message: "Las notas deben tener al menos 5 caracteres." }),
})

type LogFormValues = z.infer<typeof logFormSchema>

export default function NewLogPage({ params }: { params: { id: string } }) {
  const { toast } = useToast()
  const router = useRouter()
  const { residents, isLoading: residentsLoading } = useResidents()
  const { addLog, isLoading: logsLoading } = useLogs()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const resident = residents.find(r => r.id === params.id)

  const form = useForm<LogFormValues>({
    resolver: zodResolver(logFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      medsAdministered: true,
    },
  })

 function onSubmit(data: LogFormValues) {
    if (!resident) return;

    const newLog = {
        residentId: resident.id,
        ...data,
    };
    addLog(newLog);
    toast({
      title: "Registro Guardado",
      description: `Se ha añadido una nueva entrada para ${resident.name}.`,
    })
    router.push(`/dashboard/residents/${resident.id}`)
  }
  
  const isLoading = residentsLoading || logsLoading;

  if (!isClient || isLoading) {
    return <div>Cargando...</div>
  }

  if (!resident) {
    return <div>Residente no encontrado.</div>
  }


  return (
    <>
      <h1 className="text-3xl font-bold font-headline mb-6">Agregar Registro de Evolución para {resident.name}</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Registro Diario</CardTitle>
              <CardDescription>Complete la información de la evolución diaria del residente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha del Registro</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="mood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado de Ánimo</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione el ánimo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Feliz">Feliz</SelectItem>
                          <SelectItem value="Calmado">Calmado</SelectItem>
                          <SelectItem value="Ansioso">Ansioso</SelectItem>
                          <SelectItem value="Agitado">Agitado</SelectItem>
                          <SelectItem value="Triste">Triste</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="appetite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apetito</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione el apetito" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Bueno">Bueno</SelectItem>
                          <SelectItem value="Regular">Regular</SelectItem>
                          <SelectItem value="Pobre">Pobre</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="sleep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calidad del Sueño</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione el sueño" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Reparador">Reparador</SelectItem>
                          <SelectItem value="Interrumpido">Interrumpido</SelectItem>
                          <SelectItem value="Poco">Poco</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                 <FormField
                    control={form.control}
                    name="vitals"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Signos Vitales (Opcional)</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej. 120/80, 75ppm, 36.5°C" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
                <FormField
                    control={form.control}
                    name="medsAdministered"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-end space-x-2 pb-1">
                            <FormControl>
                                <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                ¿Se administraron medicamentos?
                                </FormLabel>
                            </div>
                        </FormItem>
                    )}
                    />
               </div>
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Notas de Evolución</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Describa cualquier observación relevante..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
          </Card>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>Guardar Registro</Button>
          </div>
        </form>
      </Form>
    </>
  )
}
