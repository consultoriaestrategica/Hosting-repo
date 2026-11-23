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
import {
  getShiftForDate,
  isShiftOver,
  resolveShiftEntryDateTime,
  validateShiftEntryDateTime,
  calculateIsLateEntry,
} from "@/lib/shift-coverage"

const evolutionSchema = z.object({
  note: z.string().min(3, "La nota es obligatoria"),
  heartRate: z.coerce.number().optional(),
  respiratoryRate: z.coerce.number().optional(),
  spo2: z.coerce.number().optional(),
  professionalName: z.string().optional(),
  entryTimeOfDay: z.string().optional(),
})

type EvolutionFormValues = z.infer<typeof evolutionSchema>

interface PartialEvolutionFormProps {
  log: Log
  onSaved: () => void
}

export function PartialEvolutionForm({ log, onSaved }: PartialEvolutionFormProps) {
  const { addEvolutionEntry } = useLogs()
  const { toast } = useToast()

  // El turno al que pertenece este log: si el log ya trae
  // shiftDate/shiftType (registros creados después de este cambio) se
  // usan directo; los logs viejos lo derivan de endDate, igual que
  // hace shift-coverage.ts en cualquier otro lugar donde falten estos
  // campos — sin necesidad de migrar datos existentes.
  const logShift = log.shiftDate && log.shiftType
    ? { shiftDate: log.shiftDate, shiftType: log.shiftType }
    : (() => {
        const derived = getShiftForDate(new Date(log.endDate))
        return { shiftDate: derived.shiftDate, shiftType: derived.type }
      })()
  const shiftEnded = isShiftOver(logShift.shiftDate, logShift.shiftType, new Date())

  const form = useForm<EvolutionFormValues>({
    resolver: zodResolver(evolutionSchema),
    defaultValues: {
      note: "",
      heartRate: undefined,
      respiratoryRate: undefined,
      spo2: undefined,
      professionalName: "",
      entryTimeOfDay: "",
    },
  })

  async function onSubmit(data: EvolutionFormValues) {
    const enteredAt = new Date()

    if (shiftEnded && (!data.entryTimeOfDay || data.entryTimeOfDay.trim().length === 0)) {
      form.setError("entryTimeOfDay", {
        message: "La hora real del hecho es obligatoria porque el turno de este registro ya terminó.",
      })
      return
    }

    let eventDate = enteredAt
    if (data.entryTimeOfDay) {
      const resolved = resolveShiftEntryDateTime(logShift.shiftDate, logShift.shiftType, data.entryTimeOfDay)
      const validation = validateShiftEntryDateTime(logShift.shiftDate, logShift.shiftType, resolved, enteredAt)
      if (!validation.valid) {
        form.setError("entryTimeOfDay", { message: validation.error ?? "Hora inválida." })
        return
      }
      eventDate = resolved
    }

    const isLateEntry = calculateIsLateEntry(logShift.shiftDate, logShift.shiftType, enteredAt)

    const entry: EvolutionEntry = {
      id: crypto.randomUUID(),
      createdAt: eventDate.toISOString(),
      createdTimeLabel: eventDate.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      enteredAt: enteredAt.toISOString(),
      isLateEntry,
      note: data.note,
    }

    // arrayUnion() rechaza cualquier elemento con un valor `undefined`
    // explicito, sin excepcion. Estos campos son opcionales y quedan
    // `undefined` si el auxiliar deja el input vacio - se omiten en vez
    // de asignarse para que la clave nunca exista en el objeto.
    if (data.heartRate !== undefined) entry.heartRate = data.heartRate
    if (data.respiratoryRate !== undefined) entry.respiratoryRate = data.respiratoryRate
    if (data.spo2 !== undefined) entry.spo2 = data.spo2
    if (data.professionalName !== undefined) entry.professionalName = data.professionalName

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
          name="entryTimeOfDay"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Hora real del hecho {shiftEnded && <span className="text-destructive">*</span>}
              </FormLabel>
              <FormControl>
                <Input type="time" className="text-lg h-12 max-w-[200px]" {...field} value={field.value || ""} />
              </FormControl>
              {shiftEnded ? (
                <p className="text-xs text-muted-foreground">
                  El turno de este registro ya terminó — indica a qué hora ocurrió realmente.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  El turno sigue en curso — puedes ajustar la hora si es necesario.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

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
