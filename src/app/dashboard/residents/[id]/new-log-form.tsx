
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
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/hooks/use-toast"
import { useLogs } from "@/hooks/use-logs"
import { useResidents } from "@/hooks/use-residents"
import { useState, useEffect, useRef } from "react"
import { DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Mic, MicOff, Camera, X, PlusCircle, Trash2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const reportFormSchema = z.object({
  residentId: z.string({ required_error: "Debe seleccionar un residente." }),
  reportType: z.enum(["medico", "suministro"], { required_error: "Debe seleccionar un tipo de reporte." }),

  // Medical fields
  heartRate: z.coerce.number().optional(),
  respiratoryRate: z.coerce.number().optional(),
  spo2: z.coerce.number().optional(),
  feedingType: z.string().optional(),
  evolutionNotes: z.array(z.object({
    note: z.string().min(1, "La nota no puede estar vacía."),
  })).optional(),
  photoEvidence: z.string().optional(),

  // Supply fields
  supplierName: z.string().optional(),
  supplyDate: z.string().optional(),
  supplyDescription: z.string().optional(),
  supplyNotes: z.string().optional(),
  supplyPhotoEvidence: z.string().optional(),
})

type ReportFormValues = z.infer<typeof reportFormSchema>
type DictationField = `evolutionNotes.${number}.note` | "supplyNotes";

interface NewReportFormProps {
    residentId?: string;
    onFormSubmit: () => void;
}

export default function NewLogForm({ residentId, onFormSubmit }: NewReportFormProps) {
  const { toast } = useToast()
  const { addLog, isLoading } = useLogs()
  const { residents } = useResidents()

  // --- State and Refs ---
  const startDateRef = useRef<string>(new Date().toISOString()); // Capture start time on component mount
  const [isListening, setIsListening] = useState(false);
  const [activeDictationField, setActiveDictationField] = useState<DictationField | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      residentId: residentId || "",
      reportType: undefined,
      evolutionNotes: [{ note: "" }],
      supplyNotes: "",
    },
  })
  
  const reportType = form.watch("reportType");
  const { fields: evolutionNoteFields, append: appendEvolutionNote, remove: removeEvolutionNote } = useFieldArray({
    control: form.control,
    name: "evolutionNotes",
  });

  // --- Dictation Logic ---
  const handleToggleDictation = (field: DictationField) => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ variant: "destructive", title: "Navegador no compatible", description: "El dictado por voz no es soportado en este navegador." });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognitionRef.current = recognition;
    setActiveDictationField(field);

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map(result => result[0].transcript).join('');
      const currentNotes = form.getValues(field) || "";
      form.setValue(field, currentNotes ? `${currentNotes} ${transcript}`.trim() : transcript, { shouldValidate: true });
    };

    recognition.onend = () => {
      setIsListening(false);
      setActiveDictationField(null);
      recognitionRef.current = null;
    };
    
    recognition.onerror = (event) => {
      let description = "Ocurrió un error desconocido con el dictado.";
      if (event.error === 'no-speech') description = "No se detectó voz. Por favor, intente hablar de nuevo.";
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') description = "Permiso de micrófono denegado. Habilítelo en su navegador.";
      toast({ variant: "destructive", title: "Error de Dictado", description });
      setIsListening(false);
      setActiveDictationField(null);
    };

    recognition.start();
  };

  // --- Camera Logic ---
  const openCamera = async () => {
    if (isCameraOpen) return;
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraError("No se pudo acceder a la cámara. Por favor, asegúrese de haber otorgado los permisos necesarios en su navegador.");
      setIsCameraOpen(false);
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    streamRef.current = null;
    setIsCameraOpen(false);
  };
  
  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const photoDataUrl = canvas.toDataURL('image/jpeg');
        setPhotoPreview(photoDataUrl);
        const fieldToUpdate = reportType === 'medico' ? 'photoEvidence' : 'supplyPhotoEvidence';
        form.setValue(fieldToUpdate, photoDataUrl);
        toast({ title: "Evidencia Capturada", description: "La foto se ha guardado correctamente." });
    }
    closeCamera();
  };

  const resetPhoto = () => {
    setPhotoPreview(null);
    const fieldToUpdate = reportType === 'medico' ? 'photoEvidence' : 'supplyPhotoEvidence';
    form.setValue(fieldToUpdate, undefined);
  }

  // --- Lifecycle and Submit ---
  useEffect(() => {
    if (residentId) {
        form.setValue("residentId", residentId);
    }
    // Cleanup function when component unmounts
    return () => {
      recognitionRef.current?.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [residentId, form]);


  function onSubmit(data: ReportFormValues) {
    if (isListening) {
      recognitionRef.current?.stop()
    }
    
    const baseLog = {
      residentId: data.residentId,
      startDate: startDateRef.current,
      endDate: new Date().toISOString(),
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
        evolutionNotes: data.evolutionNotes?.map(n => n.note).filter(Boolean),
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

  const renderPhotoEvidence = (field: any) => (
    <FormItem>
      <FormLabel>{field.name === 'photoEvidence' ? 'Evidencia Fotográfica' : 'Evidencia Fotográfica del Suministro'}</FormLabel>
      <FormControl>
        <div className="space-y-2">
            {photoPreview ? (
                 <div className="relative aspect-video w-full">
                    <img src={photoPreview} alt="Vista previa de la foto" className="w-full h-full object-contain rounded-md border"/>
                    <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={resetPhoto}>
                        <X className="h-4 w-4" />
                    </Button>
                 </div>
            ) : isCameraOpen ? (
                 <div className="space-y-2 rounded-md border p-2">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-video rounded-md bg-muted"></video>
                    <div className="flex justify-center gap-2">
                        <Button type="button" onClick={takePhoto} className="w-full">
                            <Camera className="mr-2 h-4 w-4" />
                            Capturar Foto
                        </Button>
                        <Button type="button" variant="outline" onClick={closeCamera} className="w-full">
                            <X className="mr-2 h-4 w-4" />
                            Cerrar
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                <Button type="button" variant="outline" onClick={openCamera} className="w-full">
                    <Camera className="mr-2 h-4 w-4" />
                    Abrir Cámara
                </Button>
                {cameraError && (
                    <Alert variant="destructive">
                        <AlertTitle>Error de Cámara</AlertTitle>
                        <AlertDescription>{cameraError}</AlertDescription>
                    </Alert>
                )}
                </>
            )}
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );

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
                                    ...form.getValues(),
                                    reportType: value as "medico" | "suministro",
                                    evolutionNotes: [{ note: "" }],
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
                     <div className="p-2 bg-muted rounded-md col-span-full lg:col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">Fecha y Hora de Registro</p>
                        <p className="text-sm">{new Date(startDateRef.current).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</p>
                    </div>
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
                    <div>
                        <FormLabel>Notas de Evolución</FormLabel>
                        <div className="space-y-2 mt-2">
                        {evolutionNoteFields.map((field, index) => (
                            <FormField
                            key={field.id}
                            control={form.control}
                            name={`evolutionNotes.${index}.note`}
                            render={({ field: noteField }) => (
                                <FormItem>
                                <FormControl>
                                    <div className="relative flex items-center gap-2">
                                        <Textarea placeholder={`Nota de evolución #${index + 1}...`} {...noteField} />
                                        <div className="flex flex-col gap-1">
                                            <Button type="button" size="icon" variant={isListening && activeDictationField === `evolutionNotes.${index}.note` ? "destructive" : "outline"} className="h-7 w-7" onClick={() => handleToggleDictation(`evolutionNotes.${index}.note`)}>{isListening && activeDictationField === `evolutionNotes.${index}.note` ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}<span className="sr-only">Dictado</span></Button>
                                            {evolutionNoteFields.length > 1 && <Button type="button" variant="destructive" size="icon" className="h-7 w-7" onClick={() => removeEvolutionNote(index)}><Trash2 className="h-4 w-4" /></Button>}
                                        </div>
                                    </div>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        ))}
                        </div>
                        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendEvolutionNote({ note: "" })}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Agregar Nota
                        </Button>
                    </div>
                    <FormField control={form.control} name="photoEvidence" render={({ field }) => renderPhotoEvidence(field)} />
                </div>
              )}

              {reportType === 'suministro' && (
                 <div className="space-y-4 pt-4 border-t">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField control={form.control} name="supplierName" render={({ field }) => (<FormItem><FormLabel>Nombre de quien entrega</FormLabel><FormControl><Input placeholder="Ej. Carlos Rodriguez" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="supplyDate" render={({ field }) => (<FormItem><FormLabel>Fecha de Entrega</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                     <FormField control={form.control} name="supplyDescription" render={({ field }) => (<FormItem><FormLabel>Descripción del Suministro</FormLabel><FormControl><Textarea placeholder="Ej. 2 cajas de guantes, 5 kits de curación" {...field} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="supplyNotes" render={({ field }) => (<FormItem><FormLabel>Notas Adicionales</FormLabel><FormControl><div className="relative"><Textarea placeholder="Observaciones adicionales sobre la entrega..." {...field} /><Button type="button" size="icon" variant={isListening && activeDictationField === 'supplyNotes' ? "destructive" : "outline"} className="absolute bottom-2 right-2 h-7 w-7" onClick={() => handleToggleDictation('supplyNotes')}>{isListening && activeDictationField === 'supplyNotes' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}<span className="sr-only">Dictado de voz</span></Button></div></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="supplyPhotoEvidence" render={({ field }) => renderPhotoEvidence(field)} />
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
