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
import { AgendaEvent, useResidents } from "@/hooks/use-residents"
import { DialogFooter } from "@/components/ui/dialog"
import { useEffect } from "react"
import { CalendarPlus } from "lucide-react"

const agendaFormSchema = z.object({
  residentId: z.string().optional(),
  title: z.string().min(3, "El título debe tener al menos 3 caracteres."),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "La fecha es inválida." }),
  status: z.enum(['Pendiente', 'Completado', 'Cancelado'], { required_error: "Debe seleccionar un estado." }),
  description: z.string().optional(),
})

type AgendaFormValues = Omit<AgendaEvent, 'id' | 'type'> & { residentId?: string };

interface AgendaFormProps {
  residentId?: string;
  event: AgendaEvent | null;
  onSubmit: (residentId: string, data: Omit<AgendaEvent, 'id'>, syncWithCalendar: boolean) => void;
  onCancel: () => void;
}

export default function AgendaForm({ residentId, event, onSubmit, onCancel }: AgendaFormProps) {
  const { residents } = useResidents();
  const defaultDateTime = event?.date ? new Date(event.date).toISOString().substring(0, 16) : new Date().toISOString().substring(0, 16);

  const form = useForm<AgendaFormValues>({
    resolver: zodResolver(agendaFormSchema),
    defaultValues: {
      residentId: residentId || "",
      title: event?.title || "",
      date: defaultDateTime,
      status: event?.status || 'Pendiente',
      description: event?.description || "",
    },
  })

  useEffect(() => {
    if (residentId) {
        form.setValue("residentId", residentId);
    }
  }, [residentId, form]);

  const handleFormSubmit = (shouldSync: boolean) => {
    return (data: AgendaFormValues) => {
      console.log('📝 Formulario enviado con sync:', shouldSync);
      
      const finalResidentId = data.residentId || ""; 
      const eventData = {
          title: data.title,
          date: new Date(data.date).toISOString(),
          type: "Otro" as const,  // ✅ Tipo válido
          status: data.status,
          description: data.description,
      };
      
      onSubmit(finalResidentId, eventData, shouldSync);
    }
  }

  return (
    <Form {...form}>
      <div className="space-y-6">
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            {!residentId && (
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
            )}
            <FormField 
              control={form.control} 
              name="title" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título del Evento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Cita con el Dentista" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />
            <FormField 
              control={form.control} 
              name="date" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha y Hora</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
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
            <FormField 
              control={form.control} 
              name="description" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Añada detalles adicionales sobre el evento..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="button" onClick={form.handleSubmit(handleFormSubmit(false))}>
              Guardar Evento
            </Button>
            <Button type="button" onClick={form.handleSubmit(handleFormSubmit(true))}>
              <CalendarPlus className="mr-2 h-4 w-4" />
              Guardar y Sincronizar
            </Button>
        </DialogFooter>
      </div>
    </Form>
  )
}