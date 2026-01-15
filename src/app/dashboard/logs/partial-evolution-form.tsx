"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useLogs, EvolutionEntry, Log } from "@/hooks/use-logs"
import { useToast } from "@/hooks/use-toast"

const evolutionSchema = z.object({
  note: z.string().min(3, "La nota es obligatoria"),
  heartRate: z.coerce.number().optional(),
  respiratoryRate: z.coerce.number().optional(),
  spo2: z.coerce.number().optional(),
  professionalName: z.string().optional(),
})

type EvolutionFormValues = z.infer<typeof evolutionSchema>

interface PartialEvolutionFormProps {
  log: Log
  onSaved: () => void
}

export function PartialEvolutionForm({ log, onSaved }: PartialEvolutionFormProps) {
  const { addEvolutionEntry } = useLogs()
  const { toast } = useToast()

  const form = useForm<EvolutionFormValues>({
    resolver: zodResolver(evolutionSchema),
    defaultValues: {
      note: "",
      heartRate: undefined,
      respiratoryRate: undefined,
      spo2: undefined,
      professionalName: "",
    },
  })

  async function onSubmit(data: EvolutionFormValues) {
    const now = new Date()

    const entry: EvolutionEntry = {
      id: crypto.randomUUID(),
      createdAt: now.toISOString(),
      createdTimeLabel: now.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      note: data.note,
      heartRate: data.heartRate,
      respiratoryRate: data.respiratoryRate,
      spo2: data.spo2,
      professionalName: data.professionalName,
    }

    try {
      await addEvolutionEntry(log.id, entry)

      // Calcular el total de evoluciones de forma segura
      const currentCount = log.reportType === "medico" && log.evolutionEntries ? log.evolutionEntries.length : 0

      toast({
        title: "Evolución registrada",
        description: `Se agregó una evolución parcial. Total de evoluciones: ${currentCount + 1}`,
      })

      onSaved()
    } catch (error) {
      console.error("Error al guardar evolución parcial:", error)
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: error instanceof Error ? error.message : "No se pudo guardar la evolución parcial.",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nota de evolución</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Describa la evolución parcial del residente..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="heartRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>F.C (Lpm)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={300}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="respiratoryRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>F.R (Rpm)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={80}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="spo2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SpO₂ (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="professionalName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profesional que registra</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enfermera/o responsable, médico, etc."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onSaved}
          >
            Cancelar
          </Button>
          <Button type="submit">
            Guardar evolución
          </Button>
        </div>
      </form>
    </Form>
  )
}
