
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
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/hooks/use-toast"
import { useLogs } from "@/hooks/use-logs"
import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { DialogFooter, DialogClose } from "@/components/ui/dialog"

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

interface NewLogFormProps {
    residentId: string;
    onFormSubmit: () => void;
}

export default function NewLogForm({ residentId, onFormSubmit }: NewLogFormProps) {
  const { toast } = useToast()
  const { addLog, isLoading } = useLogs()

  const form = useForm<LogFormValues>({
    resolver: zodResolver(logFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      medsAdministered: true,
    },
  })

 function onSubmit(data: LogFormValues) {
    const newLog = {
        residentId: residentId,
        ...data,
    };
    addLog(newLog);
    toast({
      title: "Registro Guardado",
      description: `Se ha añadido una nueva entrada de evolución.`,
    })
    onFormSubmit();
    form.reset();
  }

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4 p-4">
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
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={isLoading}>Guardar Registro</Button>
            </DialogFooter>
        </form>
      </Form>
  )
}

    