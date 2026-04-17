
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
import { useToast } from "@/hooks/use-toast"
import { useResidents } from "@/hooks/use-residents"
import { useUser } from "@/hooks/use-user"
import { useAuth } from "@/hooks/use-auth"
import { DialogFooter, DialogClose } from "@/components/ui/dialog"

const visitFormSchema = z.object({
  residentId: z.string({ required_error: "Debe seleccionar un residente." }),
  visitorName: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  visitorIdNumber: z.string().min(5, "La cédula debe tener al menos 5 caracteres."),
  kinship: z.string().min(2, "El parentesco es requerido."),
  notes: z.string().optional(),
})

type VisitFormValues = z.infer<typeof visitFormSchema>

interface NewVisitFormProps {
  onFormSubmit: () => void
}

export default function NewVisitForm({ onFormSubmit }: NewVisitFormProps) {
  const { toast } = useToast()
  const { residents, addVisit } = useResidents()
  const { user: authUser } = useAuth()
  const { user: staffUser } = useUser()

  const form = useForm<VisitFormValues>({
    resolver: zodResolver(visitFormSchema),
    defaultValues: {
      residentId: "",
      visitorName: "",
      visitorIdNumber: "",
      kinship: "",
      notes: "",
    },
  })

  function onSubmit(data: VisitFormValues) {
    const registeredBy = authUser
      ? {
          uid: authUser.uid,
          displayName: staffUser?.name || authUser.displayName || authUser.email || "—",
          email: authUser.email || "",
        }
      : undefined

    addVisit(data.residentId, {
      visitorName: data.visitorName,
      visitorIdNumber: data.visitorIdNumber,
      kinship: data.kinship,
      notes: data.notes,
      registeredBy,
    })
    
    const residentName = residents.find(r => r.id === data.residentId)?.name
    toast({
      title: "Visita Registrada Exitosamente",
      description: `Se ha registrado la visita de ${data.visitorName} a ${residentName}.`,
    })
    onFormSubmit()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
            <FormField
                control={form.control}
                name="residentId"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Residente a Visitar</FormLabel>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField control={form.control} name="visitorName" render={({ field }) => (<FormItem><FormLabel>Nombre del Visitante</FormLabel><FormControl><Input placeholder="Ej. Juan Pérez" {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="visitorIdNumber" render={({ field }) => (<FormItem><FormLabel>Cédula del Visitante</FormLabel><FormControl><Input placeholder="Ej. 11223344" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="kinship" render={({ field }) => (
              <FormItem>
                <FormLabel>Parentesco</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione parentesco" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Hijo/a">Hijo/a</SelectItem>
                    <SelectItem value="Esposo/a">Esposo/a</SelectItem>
                    <SelectItem value="Hermano/a">Hermano/a</SelectItem>
                    <SelectItem value="Nieto/a">Nieto/a</SelectItem>
                    <SelectItem value="Sobrino/a">Sobrino/a</SelectItem>
                    <SelectItem value="Amigo/a">Amigo/a</SelectItem>
                    <SelectItem value="Profesional de salud">Profesional de salud</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Observaciones (Opcional)</FormLabel><FormControl><Textarea placeholder="Observaciones sobre la visita..." {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button type="submit">Registrar Visita</Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
