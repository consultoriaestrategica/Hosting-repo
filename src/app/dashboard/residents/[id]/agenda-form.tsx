
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
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
import { AgendaEvent } from "@/hooks/use-residents"
import { DialogFooter } from "@/components/ui/dialog"

const agendaFormSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres."),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "La fecha es inválida." }),
  type: z.enum(['Cita Médica', 'Gestión Personal', 'Otro'], { required_error: "Debe seleccionar un tipo." }),
  status: z.enum(['Pendiente', 'Completado', 'Cancelado'], { required_error: "Debe seleccionar un estado." }),
  description: z.string().optional(),
})

type AgendaFormValues = Omit<AgendaEvent, 'id'>;

interface AgendaFormProps {
  event: AgendaEvent | null;
  onSubmit: (data: AgendaFormValues) => void;
  onCancel: () => void;
}

export default function AgendaForm({ event, onSubmit, onCancel }: AgendaFormProps) {
  
  const defaultDateTime = event?.date ? new Date(event.date).toISOString().substring(0, 16) : new Date().toISOString().substring(0, 16);

  const form = useForm<AgendaFormValues>({
    resolver: zodResolver(agendaFormSchema),
    defaultValues: {
      title: event?.title || "",
      date: defaultDateTime,
      type: event?.type || undefined,
      status: event?.status || 'Pendiente',
      description: event?.description || "",
    },
  })

  const handleFormSubmit = (data: AgendaFormValues) => {
    onSubmit({
        ...data,
        date: new Date(data.date).toISOString(), // Ensure it's a full ISO string
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="space-y-4 py-4">
            <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título del Evento</FormLabel><FormControl><Input placeholder="Ej. Cita con el Dentista" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="date" render={({ field }) => (<FormItem><FormLabel>Fecha y Hora</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tipo de Evento</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Seleccione un tipo" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Cita Médica">Cita Médica</SelectItem>
                            <SelectItem value="Gestión Personal">Gestión Personal</SelectItem>
                            <SelectItem value="Otro">Otro</SelectItem>
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
                            <SelectTrigger><SelectValue placeholder="Seleccione un estado" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Pendiente">Pendiente</SelectItem>
                            <SelectItem value="Completado">Completado</SelectItem>
                            <SelectItem value="Cancelado">Cancelado</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
             <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción (Opcional)</FormLabel><FormControl><Textarea placeholder="Añada detalles adicionales sobre el evento..." {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
        <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit">Guardar Evento</Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
