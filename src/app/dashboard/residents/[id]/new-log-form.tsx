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
import { 
  Mic, 
  MicOff, 
  Camera, 
  X, 
  PlusCircle, 
  Trash2, 
  Upload, 
  FileIcon,
  Eye,
  Edit2,
  Check,
  AlertTriangle
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

// Declaraciones de tipos para Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  readonly isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

// Esquema mejorado para evidencia fotográfica
const photoEvidenceSchema = z.object({
  id: z.string(),
  name: z.string(),
  originalName: z.string(),
  url: z.string(),
  size: z.number(),
  type: z.string(),
  uploadDate: z.string(),
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
});

type ReportFormValues = z.infer<typeof reportFormSchema>
type PhotoEvidence = z.infer<typeof photoEvidenceSchema>
type DictationField = `evolutionNotes.${number}.note` | "supplyNotes";

interface NewReportFormProps {
    residentId?: string;
    onFormSubmit: () => void;
}

export default function NewLogForm({ residentId, onFormSubmit }: NewReportFormProps) {
  const { toast } = useToast()
  const { addLog, isLoading } = useLogs()
  const { residents } = useResidents()

  // Formatos de imagen permitidos
  const allowedImageTypes = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'image/bmp': ['.bmp'],
    'image/svg+xml': ['.svg']
  };

  const allowedExtensions = Object.values(allowedImageTypes).flat();
  const allowedMimeTypes = Object.keys(allowedImageTypes);
  const maxFileSize = 10 * 1024 * 1024; // 10MB

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
  
  // Estados para gestión de archivos mejorada
  const [editingPhoto, setEditingPhoto] = useState<string | null>(null);
  const [newPhotoName, setNewPhotoName] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState<PhotoEvidence | null>(null);

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

  // --- Utility Functions ---
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateImageFile = (file: File): string | null => {
    // Validar tipo MIME
    if (!allowedMimeTypes.includes(file.type)) {
      return `Formato no permitido: ${file.name}.\nFormatos permitidos: ${allowedExtensions.join(', ')}`;
    }

    // Validar tamaño
    if (file.size > maxFileSize) {
      return `El archivo ${file.name} es muy grande.\nTamaño máximo permitido: ${formatFileSize(maxFileSize)}`;
    }

    return null;
  };

  // --- Dictation Logic ---
  const handleToggleDictation = (field: DictationField) => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ 
        variant: "destructive", 
        title: "Navegador no compatible", 
        description: "El dictado por voz no es soportado en este navegador." 
      });
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

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results).map(result => result[0].transcript).join('');
      const currentNotes = form.getValues(field) || "";
      form.setValue(field, currentNotes ? `${currentNotes} ${transcript}`.trim() : transcript, { shouldValidate: true });
    };

    recognition.onend = () => {
      setIsListening(false);
      setActiveDictationField(null);
      recognitionRef.current = null;
    };
    
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
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

  // --- Enhanced Photo Management ---
  const updatePhotoEvidence = (newPhotos: PhotoEvidence[]) => {
    const fieldToUpdate = reportType === 'medico' ? 'photoEvidence' : 'supplyPhotoEvidence';
    const currentPhotos = form.getValues(fieldToUpdate) || [];
    form.setValue(fieldToUpdate, [...currentPhotos, ...newPhotos], { shouldValidate: true });
  };
  
  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const photoData: PhotoEvidence = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: `captura-${Date.now()}.jpg`,
          originalName: `captura-${Date.now()}.jpg`,
          url: photoDataUrl,
          size: Math.round(photoDataUrl.length * 0.75), // Aproximación del tamaño
          type: 'image/jpeg',
          uploadDate: new Date().toISOString(),
        };
        updatePhotoEvidence([photoData]);
        toast({ title: "Evidencia Capturada", description: "La foto se ha añadido a la galería." });
    }
    closeCamera();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validar cada archivo
    for (const file of Array.from(files)) {
      const error = validateImageFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    }

    // Mostrar errores si los hay
    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Archivos rechazados",
        description: errors.join('\n\n')
      });
    }

    // Procesar archivos válidos
    if (validFiles.length > 0) {
      const newPhotos: PhotoEvidence[] = [];
      let filesProcessed = 0;

      for (const file of validFiles) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (typeof e.target?.result === 'string') {
            newPhotos.push({
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              name: file.name,
              originalName: file.name,
              url: e.target.result,
              size: file.size,
              type: file.type,
              uploadDate: new Date().toISOString(),
            });
          }
          filesProcessed++;
          if (filesProcessed === validFiles.length) {
              updatePhotoEvidence(newPhotos);
              toast({ 
                title: `${validFiles.length} imagen(es) cargada(s)`, 
                description: "Las fotos se han añadido a la galería." 
              });
          }
        };
        reader.readAsDataURL(file);
      }
    }

    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (photoId: string) => {
    const fieldToUpdate = reportType === 'medico' ? 'photoEvidence' : 'supplyPhotoEvidence';
    const currentPhotos = form.getValues(fieldToUpdate) || [];
    const newPhotos = currentPhotos.filter((photo: PhotoEvidence) => photo.id !== photoId);
    form.setValue(fieldToUpdate, newPhotos, { shouldValidate: true });
    
    if (previewPhoto && previewPhoto.id === photoId) {
      setPreviewPhoto(null);
    }
  };

  const startRename = (photoId: string, currentName: string) => {
    setEditingPhoto(photoId);
    // Quitar la extensión para edición
    const nameWithoutExt = currentName.replace(/\.[^/.]+$/, "");
    setNewPhotoName(nameWithoutExt);
  };

  const saveRename = (photoId: string) => {
    if (!newPhotoName.trim()) return;

    const fieldToUpdate = reportType === 'medico' ? 'photoEvidence' : 'supplyPhotoEvidence';
    const currentPhotos = form.getValues(fieldToUpdate) || [];
    
    const updatedPhotos = currentPhotos.map((photo: PhotoEvidence) => {
      if (photo.id === photoId) {
        // Conservar la extensión original
        const extension = photo.originalName.match(/\.[^/.]+$/)?.[0] || '';
        return {
          ...photo,
          name: newPhotoName.trim() + extension
        };
      }
      return photo;
    });

    form.setValue(fieldToUpdate, updatedPhotos, { shouldValidate: true });
    setEditingPhoto(null);
    setNewPhotoName('');
    toast({ title: "Archivo renombrado", description: "El nombre se ha actualizado correctamente." });
  };

  const cancelRename = () => {
    setEditingPhoto(null);
    setNewPhotoName('');
  };

  const previewImage = (photo: PhotoEvidence) => {
    setPreviewPhoto(photo);
  };

  // --- Lifecycle ---
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
    
    // Crear el log base con propiedades comunes
    const baseLogData = {
      residentId: data.residentId,
      startDate: startDateRef.current,
      endDate: new Date().toISOString(),
      reportType: data.reportType, // Usar reportType en lugar de type
    }

    // Crear datos específicos según el tipo de reporte
    if (data.reportType === 'medico') {
      const medicalLogData = {
        ...baseLogData,
        notes: data.evolutionNotes?.map(n => n.note).filter(Boolean)?.join('\n') || "",
        heartRate: data.heartRate,
        respiratoryRate: data.respiratoryRate,
        spo2: data.spo2,
        feedingType: data.feedingType,
        evolutionNotes: data.evolutionNotes?.map(n => n.note).filter(Boolean),
        photoEvidence: data.photoEvidence,
        visitType: data.visitType,
        professionalName: data.professionalName,
        entryTime: data.entryTime,
        exitTime: data.exitTime,
      };
      addLog(medicalLogData);
    } else {
      const supplyLogData = {
        ...baseLogData,
        notes: data.supplyNotes || "",
        supplierName: data.supplierName,
        supplyDate: data.supplyDate,
        supplyDescription: data.supplyDescription,
        supplyNotes: data.supplyNotes,
        supplyPhotoEvidence: data.supplyPhotoEvidence,
      };
      addLog(supplyLogData);
    }

    toast({
      title: "Reporte Guardado",
      description: `Se ha añadido un nuevo reporte de ${data.reportType}.`,
    })
    onFormSubmit();
    form.reset();
  }

  // --- Enhanced Photo Evidence Render ---
  const renderPhotoEvidence = () => (
    <FormItem>
      <FormLabel>Evidencia Fotográfica</FormLabel>
      <FormControl>
        <div className="space-y-4">
          {/* Información de formatos permitidos */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <p className="font-medium">Formatos permitidos:</p>
                <p>{allowedExtensions.join(', ')} • Tamaño máximo: {formatFileSize(maxFileSize)}</p>
              </div>
            </div>
          </div>

          {/* Galería de imágenes */}
          {photoPreviews && photoPreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {photoPreviews.map((photo: PhotoEvidence) => (
                <div key={photo.id} className="relative group border rounded-lg overflow-hidden bg-gray-50">
                  {/* Imagen */}
                  <div className="aspect-square cursor-pointer" onClick={() => previewImage(photo)}>
                    <img 
                      src={photo.url} 
                      alt={photo.name} 
                      className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                    />
                  </div>
                  
                  {/* Información del archivo */}
                  <div className="p-2 bg-white border-t">
                    {editingPhoto === photo.id ? (
                      <div className="space-y-2">
                        <Input
                          value={newPhotoName}
                          onChange={(e) => setNewPhotoName(e.target.value)}
                          className="text-xs h-7"
                          placeholder="Nuevo nombre"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveRename(photo.id);
                            if (e.key === 'Escape') cancelRename();
                          }}
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            size="sm"
                            className="h-6 text-xs flex-1"
                            onClick={() => saveRename(photo.id)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs flex-1"
                            onClick={cancelRename}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <FileIcon className="h-3 w-3 text-gray-500 flex-shrink-0" />
                          <p className="text-xs font-medium text-gray-900 truncate flex-1">
                            {photo.name}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(photo.size)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(photo.uploadDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Botones de acción */}
                  {editingPhoto !== photo.id && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="h-6 w-6 bg-white/90 hover:bg-white"
                        onClick={() => previewImage(photo)}
                        title="Ver imagen completa"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="h-6 w-6 bg-white/90 hover:bg-white"
                        onClick={() => startRename(photo.id, photo.name)}
                        title="Renombrar archivo"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="h-6 w-6"
                        onClick={() => removePhoto(photo.id)}
                        title="Eliminar archivo"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Cámara o botones de acción */}
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
                accept={allowedMimeTypes.join(',')}
                multiple
                onChange={handleFileChange}
              />
            </div>
          )}

          {cameraError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
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
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4 p-4 max-h-[70vh] overflow-y-auto">
            {/* Tipo de registro */}
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

            {/* Sección médica */}
            {reportType === 'medico' && (
              <div className="space-y-4 pt-4 border-t">
                {/* Signos vitales */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="heartRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frecuencia Cardíaca (bpm)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="80" {...field} />
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
                        <FormLabel>Frecuencia Respiratoria (rpm)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="20" {...field} />
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
                        <FormLabel>SpO2 (%)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="98" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Tipo de alimentación */}
                <FormField
                  control={form.control}
                  name="feedingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Alimentación</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione tipo de alimentación" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="oral">Oral</SelectItem>
                          <SelectItem value="nasogastrica">Nasogástrica</SelectItem>
                          <SelectItem value="gastrostomia">Gastrostomía</SelectItem>
                          <SelectItem value="parenteral">Parenteral</SelectItem>
                          <SelectItem value="mixta">Mixta</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notas de evolución */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel>Notas de Evolución</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendEvolutionNote({ note: "" })}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Agregar Nota
                    </Button>
                  </div>
                  {evolutionNoteFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <div className="flex-1 relative">
                        <FormField
                          control={form.control}
                          name={`evolutionNotes.${index}.note`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea
                                  placeholder="Escriba las observaciones médicas..."
                                  className="min-h-20 pr-10"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={() => handleToggleDictation(`evolutionNotes.${index}.note`)}
                        >
                          {isListening && activeDictationField === `evolutionNotes.${index}.note` ? (
                            <MicOff className="h-4 w-4 text-red-500" />
                          ) : (
                            <Mic className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {evolutionNoteFields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeEvolutionNote(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Información de visita */}
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="visitType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Visita</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione tipo de visita" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="medica">Médica</SelectItem>
                            <SelectItem value="enfermeria">Enfermería</SelectItem>
                            <SelectItem value="fisioterapia">Fisioterapia</SelectItem>
                            <SelectItem value="psicologia">Psicología</SelectItem>
                            <SelectItem value="nutricion">Nutrición</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="professionalName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Profesional</FormLabel>
                        <FormControl>
                          <Input placeholder="Dr. Juan Pérez" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="entryTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de Entrada</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="exitTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de Salida</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Evidencia fotográfica médica */}
                {renderPhotoEvidence()}
              </div>
            )}

            {/* Sección suministro */}
            {reportType === 'suministro' && (
              <div className="space-y-4 pt-4 border-t">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="supplierName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de quien entrega</FormLabel>
                        <FormControl>
                          <Input placeholder="María González" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="supplyDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Suministro</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="supplyDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción del Suministro</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describa los elementos entregados..."
                          className="min-h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="relative">
                  <FormField
                    control={form.control}
                    name="supplyNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas Adicionales</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Observaciones o comentarios adicionales..."
                            className="min-h-20 pr-10"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-8 right-2 h-8 w-8"
                    onClick={() => handleToggleDictation("supplyNotes")}
                  >
                    {isListening && activeDictationField === "supplyNotes" ? (
                      <MicOff className="h-4 w-4 text-red-500" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Evidencia fotográfica suministro */}
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

      {/* Modal de vista previa */}
      {previewPhoto && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" onClick={() => setPreviewPhoto(null)}>
          <div className="relative max-w-4xl max-h-full bg-white rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800 truncate">
                {previewPhoto.name}
              </h3>
              <Button
                onClick={() => setPreviewPhoto(null)}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4 max-h-96 overflow-auto">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.name}
                className="max-w-full max-h-full object-contain mx-auto"
              />
            </div>
            
            <div className="p-4 border-t bg-gray-50">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p><span className="font-medium">Tamaño:</span> {formatFileSize(previewPhoto.size)}</p>
                  <p><span className="font-medium">Tipo:</span> {previewPhoto.type}</p>
                </div>
                <div>
                  <p><span className="font-medium">Nombre original:</span> {previewPhoto.originalName}</p>
                  <p><span className="font-medium">Fecha de carga:</span> {new Date(previewPhoto.uploadDate).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}