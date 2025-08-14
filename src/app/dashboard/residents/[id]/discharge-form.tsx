
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
import { Resident, DischargeDetails } from "@/hooks/use-residents"
import { DialogFooter, DialogClose } from "@/components/ui/dialog"

const dischargeFormSchema = z.object({
  dischargeDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha de salida inválida." }),
  reason: z.enum(["Traslado", "Regreso a casa", "Fallecimiento"], { required_error: "Debe seleccionar un motivo." }),
  observations: z.string().optional(),
})

type DischargeFormValues = z.infer<typeof dischargeFormSchema>

interface DischargeFormProps {
  resident: Resident
  onSubmit: (data: DischargeFormValues) => void
}

export default function DischargeForm({ resident, onSubmit }: DischargeFormProps) {
  const form = useForm<DischargeFormValues>({
    resolver: zodResolver(dischargeFormSchema),
    defaultValues: {
      dischargeDate: new Date().toISOString().split('T')[0],
      reason: undefined,
      observations: "",
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4 py-4">
            <FormField control={form.control} name="dischargeDate" render={({ field }) => (<FormItem><FormLabel>Fecha de Salida</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Motivo de la Salida</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger><SelectValue placeholder="Seleccione un motivo" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="Traslado">Traslado a otro centro</SelectItem>
                        <SelectItem value="Regreso a casa">Regreso a casa</SelectItem>
                        <SelectItem value="Fallecimiento">Fallecimiento</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField control={form.control} name="observations" render={({ field }) => (<FormItem><FormLabel>Observaciones</FormLabel><FormControl><Textarea placeholder="Añade cualquier observación relevante sobre la salida..." {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit">Confirmar Salida</Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
