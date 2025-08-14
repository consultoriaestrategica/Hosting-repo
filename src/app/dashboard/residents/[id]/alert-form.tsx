
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
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Resident } from "@/hooks/use-residents"
import { DialogFooter, DialogClose } from "@/components/ui/dialog"
import { MessageSquareWarning } from "lucide-react"

const alertFormSchema = z.object({
  contactIndex: z.string().refine(val => !isNaN(parseInt(val, 10)), { message: "Debe seleccionar un contacto válido." }),
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres."),
})

type AlertFormValues = z.infer<typeof alertFormSchema>

interface AlertFormProps {
  resident: Resident
  onFormSubmit: () => void
}

export default function AlertForm({ resident, onFormSubmit }: AlertFormProps) {
  const { toast } = useToast()

  const form = useForm<AlertFormValues>({
    resolver: zodResolver(alertFormSchema),
    defaultValues: {
      message: `Hola, le escribimos desde el Hogar Geriátrico Ángel Guardián para informarle sobre una eventualidad con el residente ${resident.name}. Por favor, contáctenos lo antes posible.`,
    },
  })

  function onSubmit(data: AlertFormValues) {
    const contactIndex = parseInt(data.contactIndex, 10);
    const selectedContact = resident.familyContacts?.[contactIndex];

    if (!selectedContact || !selectedContact.phones?.[0]?.number) {
        toast({
            variant: "destructive",
            title: "Error de Contacto",
            description: "El contacto seleccionado no tiene un número de teléfono válido.",
        });
        return;
    }

    // Basic cleaning of the phone number
    const phoneNumber = selectedContact.phones[0].number.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(data.message);
    
    // Assuming Colombian numbers, add country code if not present.
    const whatsappNumber = phoneNumber.startsWith('57') ? phoneNumber : `57${phoneNumber}`;

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

    window.open(whatsappUrl, '_blank');

    toast({
      title: "Redirigiendo a WhatsApp",
      description: `Se abrirá una nueva pestaña para enviar el mensaje a ${selectedContact.name}.`,
    })
    onFormSubmit()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
            <FormField
                control={form.control}
                name="contactIndex"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Contacto Familiar a Notificar</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger><SelectValue placeholder="Seleccione un contacto" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {resident.familyContacts?.map((contact, index) => (
                            <SelectItem key={index} value={String(index)}>
                                {contact.name} ({contact.kinship}) - {contact.phones?.[0]?.number}
                            </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField 
                control={form.control} 
                name="message" 
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Mensaje de la Alerta</FormLabel>
                        <FormControl>
                            <Textarea 
                                placeholder="Escriba el mensaje para la alerta..." 
                                {...field}
                                rows={5} 
                            />
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
          <Button type="submit">
            <MessageSquareWarning className="mr-2 h-4 w-4" />
            Enviar Alerta
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
