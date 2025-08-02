
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
import { useResidents } from "@/hooks/use-residents"
import { useState, useEffect, useRef } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Mic, MicOff } from "lucide-react"

const logFormSchema = z.object({
  residentId: z.string({ required_error: "Debe seleccionar un residente." }),
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
    residentId?: string;
    onFormSubmit: () => void;
}

export default function NewLogForm({ residentId, onFormSubmit }: NewLogFormProps) {
  const { toast } = useToast()
  const { addLog, isLoading } = useLogs()
  const { residents } = useResidents()
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  const form = useForm<LogFormValues>({
    resolver: zodResolver(logFormSchema),
    defaultValues: {
      residentId: residentId || undefined,
      date: new Date().toISOString().split('T')[0],
      medsAdministered: true,
      notes: ""
    },
  })
  
  useEffect(() => {
    if (residentId) {
        form.setValue("residentId", residentId);
    }
  }, [residentId, form]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.lang = 'es-ES'
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('')
        form.setValue("notes", form.getValues("notes") + transcript)
      }
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error)
        toast({
            variant: "destructive",
            title: "Error de Reconocimiento",
            description: "No se pudo iniciar el dictado por voz."
        })
        setIsListening(false)
      }
    }
  }, [form, toast])


  const handleToggleListening = () => {
    if (!recognitionRef.current) {
        toast({
            variant: "destructive",
            title: "Navegador no compatible",
            description: "Tu navegador no soporta el dictado por voz."
        })
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

 function onSubmit(data: LogFormValues) {
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
    const { residentId, ...logData } = data;
    const newLog = {
        residentId: residentId,
        ...logData,
    };
    addLog(newLog);
    toast({
      title: "Registro Guardado",
      description: `Se ha añadido una nueva entrada de evolución.`,
    })
    onFormSubmit();
    form.reset({
        residentId: residentId || undefined,
        date: new Date().toISOString().split('T')[0],
        medsAdministered: true,
        notes: ""
    });
  }

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4 p-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {!residentId && (
                   <FormField
                    control={form.control}
                    name="residentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Residente</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un residente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {residents.map(r => (
                                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
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
                            <div className="relative">
                                <Textarea placeholder="Describa cualquier observación relevante..." {...field} />
                                <Button
                                    type="button"
                                    size="icon"
                                    variant={isListening ? "destructive" : "outline"}
                                    className="absolute bottom-2 right-2 h-7 w-7"
                                    onClick={handleToggleListening}
                                >
                                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                    <span className="sr-only">{isListening ? 'Dejar de grabar' : 'Empezar a grabar'}</span>
                                </Button>
                            </div>
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
    
