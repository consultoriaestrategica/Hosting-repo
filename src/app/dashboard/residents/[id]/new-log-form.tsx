
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
import { DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Mic, MicOff, Upload, FileImage, Loader2 } from "lucide-react"

const reportFormSchema = z.object({
  residentId: z.string({ required_error: "Debe seleccionar un residente." }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha inválida." }),
  reportType: z.enum(["medico", "suministro"], { required_error: "Debe seleccionar un tipo de reporte." }),

  // Medical fields
  heartRate: z.coerce.number().optional(),
  respiratoryRate: z.coerce.number().optional(),
  spo2: z.coerce.number().optional(),
  feedingType: z.string().optional(),
  evolutionNotes: z.string().optional(),
  photoEvidence: z.any().optional(),

  // Supply fields
  supplierName: z.string().optional(),
  supplyDate: z.string().optional(),
  supplyDescription: z.string().optional(),
  supplyNotes: z.string().optional(),
  supplyPhotoEvidence: z.any().optional(),
})

type ReportFormValues = z.infer<typeof reportFormSchema>

interface NewReportFormProps {
    residentId?: string;
    onFormSubmit: () => void;
}

export default function NewLogForm({ residentId, onFormSubmit }: NewReportFormProps) {
  const { toast } = useToast()
  const { addLog, isLoading } = useLogs()
  const { residents } = useResidents()
  const [isListening, setIsListening] = useState(false)
  const [activeDictationField, setActiveDictationField] = useState<"evolutionNotes" | "supplyNotes" | null>(null);
  const recognitionRef = useRef<any>(null)
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);


  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      residentId: residentId || "",
      date: new Date().toISOString().substring(0, 16),
      reportType: undefined,
      heartRate: undefined,
      respiratoryRate: undefined,
      spo2: undefined,
      feedingType: "",
      evolutionNotes: "",
      supplierName: "",
      supplyDate: "",
      supplyDescription: "",
      supplyNotes: "",
      photoEvidence: null,
      supplyPhotoEvidence: null,
    },
  })
  
  const reportType = form.watch("reportType");

  useEffect(() => {
    if (residentId) {
        form.setValue("residentId", residentId);
    }
  }, [residentId, form]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ variant: "destructive", title: "Navegador no compatible", description: "Tu navegador no soporta el dictado por voz." });
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }
      
      setActiveDictationField(currentField => {
          if (currentField) {
              const currentNotes = form.getValues(currentField) || "";
              form.setValue(currentField, currentNotes ? `${currentNotes} ${transcript}`.trim() : transcript);
          }
          return currentField;
      });
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage = `Ocurrió un error: ${event.error}`;
      if (event.error === 'no-speech') {
        errorMessage = "No se detectó voz. Por favor, hable más claro.";
      } else if (event.error === 'not-allowed') {
        errorMessage = "Necesitas dar permiso al micrófono para usar esta función.";
      } else if (event.error === 'aborted') {
        // Don't show an error for aborted, as it's often user-initiated
        return;
      }
      toast({ variant: "destructive", title: "Error de Reconocimiento", description: errorMessage });
    };

    recognition.onend = () => {
      setIsListening(false);
      setActiveDictationField(null);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [form, toast]);


  const handleToggleListening = (fieldName: "evolutionNotes" | "supplyNotes") => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      setActiveDictationField(fieldName);
      setIsListening(true);
      recognition.start();
    }
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        // Simulate upload
        setTimeout(() => {
          setPhotoPreview(reader.result as string);
          if (reportType === 'medico') form.setValue('photoEvidence', reader.result);
          if (reportType === 'suministro') form.setValue('supplyPhotoEvidence', reader.result);
          setPhotoUploading(false);
          toast({ title: "Evidencia Cargada", description: "La foto se ha cargado correctamente." });
        }, 1500);
      };
      reader.readAsDataURL(file);
    }
  };

 function onSubmit(data: ReportFormValues) {
    if (isListening) {
      recognitionRef.current.stop()
    }
    
    const baseLog = {
      residentId: data.residentId,
      date: new Date(data.date).toISOString(),
      reportType: data.reportType,
    }

    let finalLogData;

    if (data.reportType === 'medico') {
      finalLogData = {
        ...baseLog,
        heartRate: data.heartRate,
        respiratoryRate: data.respiratoryRate,
        spo2: data.spo2,
        feedingType: data.feedingType,
        evolutionNotes: data.evolutionNotes,
        photoEvidenceUrl: data.photoEvidence,
      };
    } else { // suministro
      finalLogData = {
        ...baseLog,
        supplierName: data.supplierName,
        supplyDate: data.supplyDate,
        supplyDescription: data.supplyDescription,
        supplyNotes: data.supplyNotes,
        supplyPhotoEvidenceUrl: data.supplyPhotoEvidence,
      };
    }

    addLog(finalLogData);
    toast({
      title: "Reporte Guardado",
      description: `Se ha añadido un nuevo reporte de ${data.reportType}.`,
    })
    onFormSubmit();
    form.reset();
    setPhotoPreview(null);
  }

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4 p-4 max-h-[70vh] overflow-y-auto">
               <FormField
                    control={form.control}
                    name="reportType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Tipo de Registro</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => {
                                field.onChange(value);
                                form.reset({
                                    residentId: form.getValues("residentId"),
                                    date: form.getValues("date"),
                                    reportType: value as "medico" | "suministro",
                                    heartRate: undefined,
                                    respiratoryRate: undefined,
                                    spo2: undefined,
                                    feedingType: "",
                                    evolutionNotes: "",
                                    supplierName: "",
                                    supplyDate: "",
                                    supplyDescription: "",
                                    supplyNotes: "",
                                    photoEvidence: null,
                                    supplyPhotoEvidence: null,
                                });
                                setPhotoPreview(null);
                            }}
                            defaultValue={field.value}
                            className="flex items-center space-x-4"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="medico" />
                              </FormControl>
                              <FormLabel className="font-normal">Médico</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="suministro" />
                              </FormControl>
                              <FormLabel className="font-normal">Suministro</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

              {reportType && (
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
                                <SelectTrigger><SelectValue placeholder="Seleccione un residente" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {residents.map(r => (<SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>))}
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
                            <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
              )}

              {reportType === 'medico' && (
                <div className="space-y-4 pt-4 border-t">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FormField control={form.control} name="heartRate" render={({ field }) => (<FormItem><FormLabel>Frecuencia Cardíaca (lpm)</FormLabel><FormControl><Input type="number" placeholder="85" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="respiratoryRate" render={({ field }) => (<FormItem><FormLabel>Frecuencia Respiratoria (rpm)</FormLabel><FormControl><Input type="number" placeholder="18" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="spo2" render={({ field }) => (<FormItem><FormLabel>Saturación de Oxígeno (SPO2 %)</FormLabel><FormControl><Input type="number" placeholder="97" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="feedingType" render={({ field }) => (<FormItem><FormLabel>Alimentación</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione un tipo" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Vía Oral">Vía Oral</SelectItem><SelectItem value="Parental">Parental</SelectItem><SelectItem value="Sonda">Sonda</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                    </div>
                    <FormField control={form.control} name="evolutionNotes" render={({ field }) => (<FormItem><FormLabel>Notas de Evolución</FormLabel><FormControl><div className="relative"><Textarea placeholder="Describa cualquier observación relevante..." {...field} /><Button type="button" size="icon" variant={isListening && activeDictationField === 'evolutionNotes' ? "destructive" : "outline"} className="absolute bottom-2 right-2 h-7 w-7" onClick={() => handleToggleListening('evolutionNotes')}>{isListening && activeDictationField === 'evolutionNotes' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}<span className="sr-only">Dictado de voz</span></Button></div></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="photoEvidence" render={({ field }) => (<FormItem><FormLabel>Evidencia Fotográfica</FormLabel><FormControl><div><Input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} /><label htmlFor="photo-upload" className="cursor-pointer flex items-center gap-2 p-2 border-2 border-dashed rounded-md justify-center"> {photoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : photoPreview ? <FileImage className="h-4 w-4 text-green-500" /> : <Upload className="h-4 w-4" />} {photoUploading ? "Subiendo..." : photoPreview ? "Imagen cargada" : "Cargar Foto"}</label></div></FormControl><FormMessage /></FormItem>)} />
                </div>
              )}

              {reportType === 'suministro' && (
                 <div className="space-y-4 pt-4 border-t">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField control={form.control} name="supplierName" render={({ field }) => (<FormItem><FormLabel>Nombre de quien entrega</FormLabel><FormControl><Input placeholder="Ej. Carlos Rodriguez" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="supplyDate" render={({ field }) => (<FormItem><FormLabel>Fecha de Entrega</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                     <FormField control={form.control} name="supplyDescription" render={({ field }) => (<FormItem><FormLabel>Descripción del Suministro</FormLabel><FormControl><Textarea placeholder="Ej. 2 cajas de guantes, 5 kits de curación" {...field} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="supplyNotes" render={({ field }) => (<FormItem><FormLabel>Notas Adicionales</FormLabel><FormControl><div className="relative"><Textarea placeholder="Observaciones adicionales sobre la entrega..." {...field} /><Button type="button" size="icon" variant={isListening && activeDictationField === 'supplyNotes' ? "destructive" : "outline"} className="absolute bottom-2 right-2 h-7 w-7" onClick={() => handleToggleListening('supplyNotes')}>{isListening && activeDictationField === 'supplyNotes' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}<span className="sr-only">Dictado de voz</span></Button></div></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="supplyPhotoEvidence" render={({ field }) => (<FormItem><FormLabel>Evidencia Fotográfica del Suministro</FormLabel><FormControl><div><Input id="supply-photo-upload" type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} /><label htmlFor="supply-photo-upload" className="cursor-pointer flex items-center gap-2 p-2 border-2 border-dashed rounded-md justify-center"> {photoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : photoPreview ? <FileImage className="h-4 w-4 text-green-500" /> : <Upload className="h-4 w-4" />} {photoUploading ? "Subiendo..." : photoPreview ? "Imagen cargada" : "Cargar Foto"}</label></div></FormControl><FormMessage /></FormItem>)} />
                 </div>
              )}
            </div>

           {reportType && (
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={isLoading}>Guardar Reporte</Button>
            </DialogFooter>
           )}
        </form>
      </Form>
  )
}

    