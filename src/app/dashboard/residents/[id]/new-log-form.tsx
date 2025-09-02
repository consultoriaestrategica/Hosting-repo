
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
import { Mic, MicOff, Camera, X, PlusCircle, Trash2, Upload, FileIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

const photoEvidenceSchema = z.object({
  name: z.string(),
  url: z.string(), // Base64 Data URI
});

const reportFormSchema = z.object({
  residentId: z.string({ required_error: "Debe seleccionar un residente." }),
  reportType: z.enum(["medico", "suministro"], { required_error: "Debe seleccionar un tipo de reporte." }),

  // Medical fields
  heartRate: z.coerce.number().optional(),
  respiratoryRate: z.coerce.number().optional(),
  spo2: z.coerce.number().optional(),
  feedingType: z.string().optional(),
  evolutionNotes: z.array(z.object({
    note: z.string().optional(),
  })).optional(),
  photoEvidence: z.array(photoEvidenceSchema).optional(),
  visitType: z.string().optional(),
  professionalName: z.string().optional(),
  entryTime: z.string().optional(),
  exitTime: z.string().optional(),

  // Supply fields
  supplierName: z.string().optional(),
  supplyDate: z.string().optional(),
  supplyDescription: z.string().optional(),
  supplyNotes: z.string().optional(),
  supplyPhotoEvidence: z.array(photoEvidenceSchema).optional(),
}).superRefine((data, ctx) => {
    if (data.reportType === 'suministro') {
        if (!data.supplierName || data.supplierName.trim().length < 3) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['supplierName'],
                message: "El nombre de quien entrega es requerido (mín. 3 caracteres).",
            });
        }
        if (!data.supplyDescription || data.supplyDescription.trim().length < 3) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['supplyDescription'],
                message: "La descripción del suministro es requerida (mín. 3 caracteres).",
            });
        }
    }
     if (data.reportType === 'medico' && (!data.evolutionNotes || data.evolutionNotes.every(n => !n.note?.trim()))) {
         // This check can be made if medical notes are mandatory
        // For now, we keep it optional as per previous implementation
    }
});


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
  const startDateRef = useRef<string>(new Date().toISOString());
  const [isListening, setIsListening] = useState(false);
  const [activeDictationField, setActiveDictationField] = useState<DictationField | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      residentId: residentId || "",
      reportType: undefined,
      evolutionNotes: [{ note: "" }],
      supplyNotes: "",
      photoEvidence: [],
      supplyPhotoEvidence: [],
    },
  })
  
  const reportType = form.watch("reportType");
  const photoPreviews = reportType === 'medico' ? form.watch("photoEvidence") : form.watch("supplyPhotoEvidence");

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

  // --- Camera & Upload Logic ---
  const updatePhotoEvidence = (newPhotos: {name: string, url: string}[]) => {
    const fieldToUpdate = reportType === 'medico' ? 'photoEvidence' : 'supplyPhotoEvidence';
    const currentPhotos = form.getValues(fieldToUpdate) || [];
    form.setValue(fieldToUpdate, [...currentPhotos, ...newPhotos], { shouldValidate: true });
  };
  
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
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      if (err.name === 'NotAllowedError') {
         setCameraError("Permiso de cámara denegado. Por favor, habilítelo en la configuración de su navegador para usar esta función.");
      } else {
         setCameraError("No se pudo acceder a la cámara. Verifique que no esté siendo usada por otra aplicación.");
      }
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
        updatePhotoEvidence([{ name: `captura-${Date.now()}.jpg`, url: photoDataUrl }]);
        toast({ title: "Evidencia Capturada", description: "La foto se ha añadido a la galería." });
    }
    closeCamera();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newPhotos: {name: string, url: string}[] = [];
    let filesProcessed = 0;

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          newPhotos.push({ name: file.name, url: e.target.result });
        }
        filesProcessed++;
        if (filesProcessed === files.length) {
            updatePhotoEvidence(newPhotos);
            toast({ title: `${files.length} imagen(es) cargada(s)`, description: "Las fotos se han añadido a la galería." });
        }
      };
      reader.readAsDataURL(file);
    }
    if(fileInputRef.current) fileInputRef.current.value = "";
  };


  const removePhoto = (index: number) => {
    const fieldToUpdate = reportType === 'medico' ? 'photoEvidence' : 'supplyPhotoEvidence';
    const currentPhotos = form.getValues(fieldToUpdate) || [];
    const newPhotos = [...currentPhotos];
    newPhotos.splice(index, 1);
    form.setValue(fieldToUpdate, newPhotos, { shouldValidate: true });
  }

  // --- Lifecycle and Submit ---
  useEffect(() => {
    if (residentId) {
        form.setValue("residentId", residentId);
    }
    return () => {
      recognitionRef.current?.stop();
      closeCamera();
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
        photoEvidenceUrl: data.photoEvidence?.map(p => p.url),
        visitType: data.visitType,
        professionalName: data.professionalName,
        entryTime: data.entryTime,
        exitTime: data.exitTime,
      };
    } else { // suministro
      finalLogData = {
        ...baseLog,
        supplierName: data.supplierName,
        supplyDate: data.supplyDate,
        supplyDescription: data.supplyDescription,
        supplyNotes: data.supplyNotes,
        supplyPhotoEvidenceUrl: data.supplyPhotoEvidence?.map(p => p.url),
      };
    }

    addLog(finalLogData);
    toast({
      title: "Reporte Guardado",
      description: `Se ha añadido un nuevo reporte de ${data.reportType}.`,
    })
    onFormSubmit();
    form.reset();
  }

  const renderPhotoEvidence = () => (
    <FormItem>
      <FormLabel>Evidencia Fotográfica</FormLabel>
      <FormControl>
        <div className="space-y-4">
             {photoPreviews && photoPreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {photoPreviews.map((photo, index) => (
                        <div key={index} className="relative group border rounded-lg overflow-hidden">
                            <img src={photo.url} alt={`Vista previa ${index + 1}`} className="w-full h-24 object-cover"/>
                             <div className="absolute bottom-0 w-full p-1 bg-black/50 text-white text-xs truncate">
                                <FileIcon className="h-3 w-3 inline-block mr-1"/>
                                {photo.name}
                            </div>
                            <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removePhoto(index)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
             )}

            {isCameraOpen ? (
                 <div className="space-y-2 rounded-md border p-2">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-video rounded-md bg-muted"></video>
                    <div className="flex justify-center gap-2">
                        <Button type="button" onClick={takePhoto} className="w-full">
                            <Camera className="mr-2 h-4 w-4" />
                            Capturar Foto
                        </Button>
                        <Button type="button" variant="outline" onClick={closeCamera} className="w-full">
                            <X className="mr-2 h-4 w-4" />
                            Cerrar Cámara
                        </Button>
                    </div>
                </div>
            ) : (
                 <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="outline" onClick={openCamera} className="w-full">
                        <Camera className="mr-2 h-4 w-4" />
                        Abrir Cámara
                    </Button>
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                         <Upload className="mr-2 h-4 w-4" />
                         Cargar Archivo(s)
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                    />
                </div>
            )}
            
            {cameraError && (
                <Alert variant="destructive">
                    <AlertTitle>Error de Cámara</AlertTitle>
                    <AlertDescription>{cameraError}</AlertDescription>
                </Alert>
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
                                const currentResidentId = form.getValues("residentId");
                                form.reset({
                                    residentId: currentResidentId,
                                    reportType: value as "medico" | "suministro",
                                    evolutionNotes: [{ note: "" }],
                                    supplyNotes: "",
                                    photoEvidence: [],
                                    supplyPhotoEvidence: [],
                                });
                                field.onChange(value);
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
                    <h3 className="text-base font-semibold">Signos Vitales</h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FormField control={form.control} name="heartRate" render={({ field }) => (<FormItem><FormLabel>Frecuencia Cardíaca (lpm)</FormLabel><FormControl><Input type="number" placeholder="85" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="respiratoryRate" render={({ field }) => (<FormItem><FormLabel>Frecuencia Respiratoria (rpm)</FormLabel><FormControl><Input type="number" placeholder="18" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="spo2" render={({ field }) => (<FormItem><FormLabel>Saturación de Oxígeno (SPO2 %)</FormLabel><FormControl><Input type="number" placeholder="97" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="feedingType" render={({ field }) => (<FormItem><FormLabel>Alimentación</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione un tipo" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Vía Oral">Vía Oral</SelectItem><SelectItem value="Parental">Parental</SelectItem><SelectItem value="Sonda">Sonda</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                    </div>
                    <Separator className="my-6" />
                     <h3 className="text-base font-semibold">Visitas Profesionales</h3>
                     <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FormField
                            control={form.control}
                            name="visitType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Visita</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Seleccione un tipo" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Médica">Médica</SelectItem>
                                        <SelectItem value="Terapia física">Terapia física</SelectItem>
                                        <SelectItem value="TEO (Ocupacional)">TEO (Ocupacional)</SelectItem>
                                        <SelectItem value="Terapia Fonoaudiología">Terapia Fonoaudiología</SelectItem>
                                        <SelectItem value="Terapia Respiratoria">Terapia Respiratoria</SelectItem>
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField control={form.control} name="professionalName" render={({ field }) => (<FormItem><FormLabel>Nombre del Profesional</FormLabel><FormControl><Input placeholder="Ej. Dr. Carlos" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="entryTime" render={({ field }) => (<FormItem><FormLabel>Hora de Llegada</FormLabel><FormControl><Input type="time" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="exitTime" render={({ field }) => (<FormItem><FormLabel>Hora de Salida</FormLabel><FormControl><Input type="time" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                     </div>

                    <Separator className="my-6" />
                    <div>
                        <h3 className="text-base font-semibold">Notas de Evolución</h3>
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
                    {renderPhotoEvidence()}
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
                     {renderPhotoEvidence()}
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
