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
import { useUser } from "@/hooks/use-user"
import { useAuth } from "@/hooks/use-auth"
import React, { useState, useEffect, useRef } from "react"
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
  AlertTriangle,
  RefreshCw
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

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

const photoEvidenceSchema = z.object({
  id: z.string(),
  name: z.string(),
  originalName: z.string(),
  url: z.string(),
  size: z.number(),
  type: z.string(),
  uploadDate: z.string(),
});

// ✅ Esquema del formulario, extendido con campos médicos adicionales
const reportFormSchema = z.object({
  residentId: z.string({ required_error: "Debe seleccionar un residente." }),
  reportType: z.enum(["medico", "suministro"], { required_error: "Debe seleccionar un tipo de reporte." }),
  heartRate: z.coerce.number().optional(),
  respiratoryRate: z.coerce.number().optional(),
  spo2: z.coerce.number().optional(),

  // Nuevos campos de signos vitales
  bloodPressureSys: z.coerce.number().optional(),
  bloodPressureDia: z.coerce.number().optional(),
  temperature: z.coerce.number().optional(),

  // Glucometría (valores numéricos)
  glucoAyuno: z.coerce.number().optional(),
  glucoAntesAlmuerzo: z.coerce.number().optional(),
  glucoAntesCena: z.coerce.number().optional(),
  gluco2hAlmuerzo: z.coerce.number().optional(),
  gluco2hCena: z.coerce.number().optional(),

  // Estado de piel
  skinStatus: z.array(z.string()).optional(),

  // Texto libre adicional
  finalComment: z.string().optional(),
  pendingTasks: z.string().optional(),
  diuresisColor: z.string().optional(),
  deposicionConsistencia: z.string().optional(),

  // Ya existentes
  feedingType: z.string().optional(),
  evolutionNotes: z.array(z.object({
    note: z.string(),
  })).optional(),
  photoEvidence: z.array(photoEvidenceSchema).optional(),
  visitType: z.string().optional(),
  professionalName: z.string().optional(),

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
  const { user: authUser } = useAuth()
  const { user: staffUser } = useUser()

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
  const maxFileSize = 10 * 1024 * 1024;

  const startDateRef = React.useRef<string>(new Date().toISOString());
  const [isListening, setIsListening] = useState(false);
  const [activeDictationField, setActiveDictationField] = useState<DictationField | null>(null);
  const recognitionRef = React.useRef<SpeechRecognition | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [editingPhoto, setEditingPhoto] = useState<string | null>(null);
  const [newPhotoName, setNewPhotoName] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState<PhotoEvidence | null>(null);

  // ✅ Estados locales para campos Sí/No y checkboxes que no necesitamos en schema
  type YesNo = "si" | "no" | ""
  const [curacion, setCuracion] = useState<YesNo>("")
  const [medsAdmin, setMedsAdmin] = useState<YesNo>("")
  const [feedingComplete, setFeedingComplete] = useState<YesNo>("")
  const [feedingPartial, setFeedingPartial] = useState<YesNo>("")
  const [diaperUse, setDiaperUse] = useState<YesNo>("")
  const [diuresis, setDiuresis] = useState<YesNo>("")
  const [deposicion, setDeposicion] = useState<YesNo>("")
  const [sindromeVespertino, setSindromeVespertino] = useState<YesNo>("")
  const [agitation, setAgitation] = useState<YesNo>("")
  const [physicalTherapy, setPhysicalTherapy] = useState<YesNo>("")
  const [occupationalTherapy, setOccupationalTherapy] = useState<YesNo>("")
  const [spiritualSupport, setSpiritualSupport] = useState<YesNo>("")

  // Glucometría – checkboxes para saber qué se midió
  const [glucoAyunoChecked, setGlucoAyunoChecked] = useState(false)
  const [glucoAntesAlmuerzoChecked, setGlucoAntesAlmuerzoChecked] = useState(false)
  const [glucoAntesCenaChecked, setGlucoAntesCenaChecked] = useState(false)
  const [gluco2hAlmuerzoChecked, setGluco2hAlmuerzoChecked] = useState(false)
  const [gluco2hCenaChecked, setGluco2hCenaChecked] = useState(false)

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      residentId: residentId || "",
      reportType: undefined,
      heartRate: undefined,
      respiratoryRate: undefined,
      spo2: undefined,

      bloodPressureSys: undefined,
      bloodPressureDia: undefined,
      temperature: undefined,

      glucoAyuno: undefined,
      glucoAntesAlmuerzo: undefined,
      glucoAntesCena: undefined,
      gluco2hAlmuerzo: undefined,
      gluco2hCena: undefined,

      skinStatus: [],
      finalComment: "",
      pendingTasks: "",
      diuresisColor: "",
      deposicionConsistencia: "",

      feedingType: "",
      evolutionNotes: [{ note: "" }],
      photoEvidence: [],
      visitType: "",
      professionalName: "",

      supplierName: "",
      supplyDate: "",
      supplyDescription: "",
      supplyNotes: "",
      supplyPhotoEvidence: [],
    },
  })
  const reportType = form.watch("reportType");
  const photoPreviews = reportType === 'medico' ? form.watch("photoEvidence") : form.watch("supplyPhotoEvidence");
  const skinStatus = form.watch("skinStatus") || []
  const diuresisColor = form.watch("diuresisColor")
  const deposicionConsistencia = form.watch("deposicionConsistencia")

  const { fields: evolutionNoteFields, append: appendEvolutionNote, remove: removeEvolutionNote } = useFieldArray({
    control: form.control,
    name: "evolutionNotes",
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateImageFile = (file: File): string | null => {
    if (!allowedMimeTypes.includes(file.type)) {
      return `Formato no permitido: ${file.name}.\nFormatos permitidos: ${allowedExtensions.join(', ')}`;
    }
    if (file.size > maxFileSize) {
      return `El archivo ${file.name} es muy grande.\nTamaño máximo permitido: ${formatFileSize(maxFileSize)}`;
    }
    return null;
  };

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

  const openCamera = async () => {
    if (isCameraOpen) return;
    setCameraError(null);
    setIsCameraOpen(true);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode },
        audio: false 
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        (videoRef.current as HTMLVideoElement).srcObject = stream;
      } else {
        await new Promise(resolve => setTimeout(resolve, 200));
        if (videoRef.current) {
          (videoRef.current as HTMLVideoElement).srcObject = stream;
        } else {
          throw new Error("No se pudo acceder al elemento video");
        }
      }
    } catch (err: any) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (err.name === 'NotAllowedError') {
         setCameraError("Permiso de cámara denegado. Por favor, habilítelo en la configuración de su navegador para usar esta función.");
      } else {
         setCameraError("No se pudo acceder a la cámara. Verifique que no esté siendo usada por otra aplicación.");
      }
      setIsCameraOpen(false);
    }
  };

  const switchCamera = async () => {
    closeCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    await new Promise(resolve => setTimeout(resolve, 300));
    openCamera();
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    streamRef.current = null;
    setIsCameraOpen(false);
  };

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
          size: Math.round(photoDataUrl.length * 0.75),
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
    for (const file of Array.from(files)) {
      const error = validateImageFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Archivos rechazados",
        description: errors.join('\n\n')
      });
    }

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
    const nameWithoutExt = currentName.replace(/\.[^/.]+$/, "");
    setNewPhotoName(nameWithoutExt);
  };

  const saveRename = (photoId: string) => {
    if (!newPhotoName.trim()) return;

    const fieldToUpdate = reportType === 'medico' ? 'photoEvidence' : 'supplyPhotoEvidence';
    const currentPhotos = form.getValues(fieldToUpdate) || [];
    
    const updatedPhotos = currentPhotos.map((photo: PhotoEvidence) => {
      if (photo.id === photoId) {
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

  useEffect(() => {
    if (residentId) {
        form.setValue("residentId", residentId);
    }
    return () => {
      recognitionRef.current?.stop();
      closeCamera();
    };
  }, [residentId, form]);

  // 👉 Construye un resumen estructurado con todos los campos médicos
  function buildMedicalSummary(data: ReportFormValues) {
    const lines: string[] = []

    if (data.heartRate || data.respiratoryRate || data.spo2 || data.bloodPressureSys || data.bloodPressureDia || data.temperature) {
      lines.push("Signos vitales:")
      if (data.heartRate) lines.push(`- F.C: ${data.heartRate} lpm`)
      if (data.respiratoryRate) lines.push(`- F.R: ${data.respiratoryRate} rpm`)
      if (data.spo2) lines.push(`- SpO₂: ${data.spo2} %`)
      if (data.bloodPressureSys || data.bloodPressureDia) {
        lines.push(`- T/A: ${data.bloodPressureSys ?? "?"}/${data.bloodPressureDia ?? "?"} mmHg`)
      }
      if (data.temperature) lines.push(`- Temperatura: ${data.temperature} °C`)
      lines.push("")
    }

    // Glucometría
    const glucoLines: string[] = []
    if (glucoAyunoChecked && data.glucoAyuno) glucoLines.push(`Ayuno: ${data.glucoAyuno} mg/dl`)
    if (glucoAntesAlmuerzoChecked && data.glucoAntesAlmuerzo) glucoLines.push(`Antes del almuerzo: ${data.glucoAntesAlmuerzo} mg/dl`)
    if (glucoAntesCenaChecked && data.glucoAntesCena) glucoLines.push(`Antes de la cena: ${data.glucoAntesCena} mg/dl`)
    if (gluco2hAlmuerzoChecked && data.gluco2hAlmuerzo) glucoLines.push(`2h después del almuerzo: ${data.gluco2hAlmuerzo} mg/dl`)
    if (gluco2hCenaChecked && data.gluco2hCena) glucoLines.push(`2h después de la cena: ${data.gluco2hCena} mg/dl`)
    if (glucoLines.length > 0) {
      lines.push("Glucometría:")
      glucoLines.forEach(l => lines.push(`- ${l}`))
      lines.push("")
    }

    // Piel
    if (skinStatus && skinStatus.length > 0) {
      lines.push("Estado de la piel:")
      lines.push(`- ${skinStatus.join(", ")}`)
      lines.push("")
    }

    // Cuidados y observaciones (sí/no)
    const yn = (v: YesNo) => v === "si" ? "Sí" : v === "no" ? "No" : "No registrado"
    const boolLines: string[] = []
    boolLines.push(`Curación: ${yn(curacion)}`)
    boolLines.push(`Administración de medicamentos: ${yn(medsAdmin)}`)
    boolLines.push(`Alimentación completa: ${yn(feedingComplete)}`)
    boolLines.push(`Alimentación parcial: ${yn(feedingPartial)}`)
    boolLines.push(`Uso de pañal: ${yn(diaperUse)}`)
    boolLines.push(`Diuresis: ${yn(diuresis)}${diuresis === "si" && data.diuresisColor ? ` (Color: ${data.diuresisColor})` : ""}`)
    boolLines.push(`Deposición: ${yn(deposicion)}${deposicion === "si" && data.deposicionConsistencia ? ` (Consistencia: ${data.deposicionConsistencia})` : ""}`)
    boolLines.push(`Síndrome vespertino: ${yn(sindromeVespertino)}`)
    boolLines.push(`Agitación: ${yn(agitation)}`)
    boolLines.push(`Terapia física: ${yn(physicalTherapy)}`)
    boolLines.push(`Terapia ocupacional: ${yn(occupationalTherapy)}`)
    boolLines.push(`Acompañamiento espiritual: ${yn(spiritualSupport)}`)

    lines.push("Cuidados y terapias:")
    boolLines.forEach(l => lines.push(`- ${l}`))
    lines.push("")

    if (data.finalComment) {
      lines.push("Comentario final del día/turno:")
      lines.push(data.finalComment)
      lines.push("")
    }

    if (data.pendingTasks) {
      lines.push("Pendientes:")
      lines.push(data.pendingTasks)
      lines.push("")
    }

    return lines.join("\n")
  }

  function resetMedicalStates() {
    setCuracion("")
    setMedsAdmin("")
    setFeedingComplete("")
    setFeedingPartial("")
    setDiaperUse("")
    setDiuresis("")
    setDeposicion("")
    setSindromeVespertino("")
    setAgitation("")
    setPhysicalTherapy("")
    setOccupationalTherapy("")
    setSpiritualSupport("")
    setGlucoAyunoChecked(false)
    setGlucoAntesAlmuerzoChecked(false)
    setGlucoAntesCenaChecked(false)
    setGluco2hAlmuerzoChecked(false)
    setGluco2hCenaChecked(false)
  }

  function onSubmit(data: ReportFormValues) {
    if (isListening) {
      recognitionRef.current?.stop()
    }

    const currentTime = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const baseLogData = {
      residentId: data.residentId,
      startDate: startDateRef.current,
      endDate: new Date().toISOString(),
      reportType: data.reportType,
    }

    if (data.reportType === 'medico') {
      // Notas escritas manualmente
      const manualNotesArray =
        data.evolutionNotes?.map(n => n.note).filter(Boolean) ?? []

      // Resumen estructurado con todos los campos nuevos
      const structuredSummary = buildMedicalSummary(data)

      const combinedEvolutionNotes: string[] = []
      if (manualNotesArray.length > 0) {
        combinedEvolutionNotes.push("Notas de evolución:")
        combinedEvolutionNotes.push(...manualNotesArray)
      }
      if (structuredSummary.trim().length > 0) {
        combinedEvolutionNotes.push("Resumen clínico del día:")
        combinedEvolutionNotes.push(structuredSummary)
      }

      // Crear el evolutionEntry inicial con todos los detalles
      const initialEvolutionEntry = {
        id: `evo-${Date.now()}`,
        createdAt: new Date().toISOString(),
        createdTimeLabel: currentTime,
        professionalName: data.professionalName,
        visitType: data.visitType,
        note: combinedEvolutionNotes.join("\n\n"),
        heartRate: data.heartRate,
        respiratoryRate: data.respiratoryRate,
        spo2: data.spo2,
        bloodPressureSys: data.bloodPressureSys,
        bloodPressureDia: data.bloodPressureDia,
        temperature: data.temperature,
      };

      const createdBy = authUser
        ? {
            uid: authUser.uid,
            displayName: staffUser?.name || authUser.displayName || authUser.email || "—",
            email: authUser.email || "",
          }
        : undefined

      const medicalLogData = {
        ...baseLogData,
        notes: combinedEvolutionNotes.join("\n\n"),
        heartRate: data.heartRate,
        respiratoryRate: data.respiratoryRate,
        spo2: data.spo2,
        feedingType: data.feedingType,
        evolutionNotes: combinedEvolutionNotes,
        evolutionEntries: [initialEvolutionEntry], // Nuevo campo con detalles completos
        photoEvidence: data.photoEvidence,
        visitType: data.visitType,
        professionalName: data.professionalName,
        exitTime: currentTime,
        createdBy,
      };

      addLog(medicalLogData);
      resetMedicalStates();
    } else {
      const createdBy = authUser
        ? {
            uid: authUser.uid,
            displayName: staffUser?.name || authUser.displayName || authUser.email || "—",
            email: authUser.email || "",
          }
        : undefined

      const supplyLogData = {
        ...baseLogData,
        notes: data.supplyNotes || "",
        supplierName: data.supplierName,
        supplyDate: data.supplyDate,
        supplyDescription: data.supplyDescription,
        supplyNotes: data.supplyNotes,
        supplyPhotoEvidence: data.supplyPhotoEvidence,
        createdBy,
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

  const renderPhotoEvidence = () => (
    <FormItem>
      <FormLabel>Evidencia Fotográfica</FormLabel>
      <FormControl>
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <p className="font-medium">Formatos permitidos:</p>
                <p>{allowedExtensions.join(', ')} • Tamaño máximo: {formatFileSize(maxFileSize)}</p>
              </div>
            </div>
          </div>

          {photoPreviews && photoPreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {photoPreviews.map((photo: PhotoEvidence) => (
                <div key={photo.id} className="relative group border rounded-lg overflow-hidden bg-gray-50">
                  <div className="aspect-square cursor-pointer" onClick={() => previewImage(photo)}>
                    <img 
                      src={photo.url} 
                      alt={photo.name} 
                      className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                    />
                  </div>
                  
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

          {isCameraOpen ? (
            <div className="space-y-2 rounded-md border p-2">
              <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-video rounded-md bg-muted"></video>
              <div className="flex justify-center gap-2">
                <Button type="button" onClick={takePhoto} className="flex-1">
                  <Camera className="mr-2 h-4 w-4" />
                  Capturar
                </Button>
                <Button type="button" variant="outline" onClick={switchCamera} className="px-3">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" onClick={closeCamera} className="flex-1">
                  <X className="mr-2 h-4 w-4" />
                  Cerrar
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

                              heartRate: undefined,
                              respiratoryRate: undefined,
                              spo2: undefined,
                              bloodPressureSys: undefined,
                              bloodPressureDia: undefined,
                              temperature: undefined,
                              glucoAyuno: undefined,
                              glucoAntesAlmuerzo: undefined,
                              glucoAntesCena: undefined,
                              gluco2hAlmuerzo: undefined,
                              gluco2hCena: undefined,
                              skinStatus: [],
                              finalComment: "",
                              pendingTasks: "",
                              diuresisColor: "",
                              deposicionConsistencia: "",

                              feedingType: "",
                              visitType: "",
                              professionalName: "",
                              supplierName: "",
                              supplyDate: "",
                              supplyDescription: "",
                          });
                          resetMedicalStates();
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                  <p className="text-sm">
                    {new Date(startDateRef.current).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
            )}

            {reportType === 'medico' && (
              <div className="space-y-4 pt-4 border-t">
                {/* SIGNOS VITALES */}
                <div className="space-y-3">
                  <FormLabel className="font-semibold">Signos vitales</FormLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
                              placeholder="80"
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
                              placeholder="20"
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
                              placeholder="98"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2">
                      <FormField
                        control={form.control}
                        name="bloodPressureSys"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>T/A Sistólica (mmHg)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={500}
                                placeholder="120"
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
                        name="bloodPressureDia"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>T/A Diastólica (mmHg)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={500}
                                placeholder="80"
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
                      name="temperature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Temperatura (°C)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={70}
                              step="0.1"
                              placeholder="36.5"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* GLUCOMETRÍA */}
                <Separator />
                <div className="space-y-3">
                  <FormLabel className="font-semibold">Glucometría (mg/dl)</FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={glucoAyunoChecked}
                        onChange={(e) => setGlucoAyunoChecked(e.target.checked)}
                      />
                      <span className="flex-1">Ayuno</span>
                      <FormField
                        control={form.control}
                        name="glucoAyuno"
                        render={({ field }) => (
                          <FormItem className="w-24">
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={600}
                                disabled={!glucoAyunoChecked}
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={glucoAntesAlmuerzoChecked}
                        onChange={(e) => setGlucoAntesAlmuerzoChecked(e.target.checked)}
                      />
                      <span className="flex-1">Antes del almuerzo</span>
                      <FormField
                        control={form.control}
                        name="glucoAntesAlmuerzo"
                        render={({ field }) => (
                          <FormItem className="w-24">
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={600}
                                disabled={!glucoAntesAlmuerzoChecked}
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={glucoAntesCenaChecked}
                        onChange={(e) => setGlucoAntesCenaChecked(e.target.checked)}
                      />
                      <span className="flex-1">Antes de la cena</span>
                      <FormField
                        control={form.control}
                        name="glucoAntesCena"
                        render={({ field }) => (
                          <FormItem className="w-24">
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={600}
                                disabled={!glucoAntesCenaChecked}
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={gluco2hAlmuerzoChecked}
                        onChange={(e) => setGluco2hAlmuerzoChecked(e.target.checked)}
                      />
                      <span className="flex-1">2h después del almuerzo</span>
                      <FormField
                        control={form.control}
                        name="gluco2hAlmuerzo"
                        render={({ field }) => (
                          <FormItem className="w-24">
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={600}
                                disabled={!gluco2hAlmuerzoChecked}
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={gluco2hCenaChecked}
                        onChange={(e) => setGluco2hCenaChecked(e.target.checked)}
                      />
                      <span className="flex-1">2h después de la cena</span>
                      <FormField
                        control={form.control}
                        name="gluco2hCena"
                        render={({ field }) => (
                          <FormItem className="w-24">
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={600}
                                disabled={!gluco2hCenaChecked}
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* ESTADO DE PIEL */}
                <Separator />
                <div className="space-y-3">
                  <FormLabel className="font-semibold">Estado de la piel</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {["Integra", "Zonas de presión", "Úlcera por presión", "Heridas"].map((opt) => (
                      <label key={opt} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={skinStatus.includes(opt)}
                          onChange={() => {
                            const current = form.getValues("skinStatus") || []
                            const exists = current.includes(opt)
                            const updated = exists
                              ? current.filter((v: string) => v !== opt)
                              : [...current, opt]
                            form.setValue("skinStatus", updated, { shouldValidate: true })
                          }}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* TIPO DE ALIMENTACIÓN (vía) */}
                <Separator />
                <FormField
                  control={form.control}
                  name="feedingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de alimentación (vía)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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

                {/* SI/NO DE CUIDADOS BÁSICOS */}
                <Separator />
                <div className="space-y-3">
                  <FormLabel className="font-semibold">Cuidados de enfermería</FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    {[
                      { label: "Curación", value: curacion, setter: setCuracion },
                      { label: "Administración de medicamentos", value: medsAdmin, setter: setMedsAdmin },
                      { label: "Alimentación completa", value: feedingComplete, setter: setFeedingComplete },
                      { label: "Alimentación parcial", value: feedingPartial, setter: setFeedingPartial },
                      { label: "Uso de pañal", value: diaperUse, setter: setDiaperUse },
                    ].map(({ label, value, setter }) => (
                      <div key={label}>
                        <FormLabel>{label}</FormLabel>
                        <div className="flex items-center gap-4 mt-1">
                          <label className="flex items-center gap-1">
                            <input
                              type="radio"
                              checked={value === "si"}
                              onChange={() => setter("si")}
                            />
                            <span>Sí</span>
                          </label>
                          <label className="flex items-center gap-1">
                            <input
                              type="radio"
                              checked={value === "no"}
                              onChange={() => setter("no")}
                            />
                            <span>No</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DIURESIS Y DEPOSICIÓN */}
                <Separator />
                <div className="space-y-3">
                  <FormLabel className="font-semibold">Eliminación</FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <FormLabel>Diuresis</FormLabel>
                      <div className="flex items-center gap-4 mt-1">
                        <label className="flex items-center gap-1">
                          <input
                            type="radio"
                            checked={diuresis === "si"}
                            onChange={() => setDiuresis("si")}
                          />
                          <span>Sí</span>
                        </label>
                        <label className="flex items-center gap-1">
                          <input
                            type="radio"
                            checked={diuresis === "no"}
                            onChange={() => setDiuresis("no")}
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <FormLabel>Color de la orina</FormLabel>
                      <select
                        className="mt-1 w-full border rounded-md px-2 py-1 text-sm"
                        value={diuresisColor ?? ""}
                        onChange={(e) => form.setValue("diuresisColor", e.target.value)}
                        disabled={diuresis !== "si"}
                      >
                        <option value="">Seleccione...</option>
                        <option value="Amarillo Claro">Amarillo Claro</option>
                        <option value="Amarillo Oscuro">Amarillo Oscuro</option>
                        <option value="Café claro">Café claro</option>
                        <option value="Café oscuro">Café oscuro</option>
                        <option value="Con sangre">Con sangre</option>
                        <option value="Azul o verde">Azul o verde</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <FormLabel>Deposición</FormLabel>
                      <div className="flex items-center gap-4 mt-1">
                        <label className="flex items-center gap-1">
                          <input
                            type="radio"
                            checked={deposicion === "si"}
                            onChange={() => setDeposicion("si")}
                          />
                          <span>Sí</span>
                        </label>
                        <label className="flex items-center gap-1">
                          <input
                            type="radio"
                            checked={deposicion === "no"}
                            onChange={() => setDeposicion("no")}
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <FormLabel>Consistencia</FormLabel>
                      <select
                        className="mt-1 w-full border rounded-md px-2 py-1 text-sm"
                        value={deposicionConsistencia ?? ""}
                        onChange={(e) => form.setValue("deposicionConsistencia", e.target.value)}
                        disabled={deposicion !== "si"}
                      >
                        <option value="">Seleccione...</option>
                        <option value="Líquida">Líquida</option>
                        <option value="Pastosa">Pastosa</option>
                        <option value="Suave y blanda">Suave y blanda</option>
                        <option value="Dura">Dura</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* COMPORTAMIENTO Y TERAPIAS */}
                <Separator />
                <div className="space-y-3">
                  <FormLabel className="font-semibold">Comportamiento y terapias</FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    {[
                      { label: "Síndrome vespertino", value: sindromeVespertino, setter: setSindromeVespertino },
                      { label: "Agitación", value: agitation, setter: setAgitation },
                      { label: "Terapia física", value: physicalTherapy, setter: setPhysicalTherapy },
                      { label: "Terapia ocupacional", value: occupationalTherapy, setter: setOccupationalTherapy },
                      { label: "Acompañamiento espiritual", value: spiritualSupport, setter: setSpiritualSupport },
                    ].map(({ label, value, setter }) => (
                      <div key={label}>
                        <FormLabel>{label}</FormLabel>
                        <div className="flex items-center gap-4 mt-1">
                          <label className="flex items-center gap-1">
                            <input
                              type="radio"
                              checked={value === "si"}
                              onChange={() => setter("si")}
                            />
                            <span>Sí</span>
                          </label>
                          <label className="flex items-center gap-1">
                            <input
                              type="radio"
                              checked={value === "no"}
                              onChange={() => setter("no")}
                            />
                            <span>No</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* NOTAS DE EVOLUCIÓN (múltiples) */}
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel className="font-semibold">Evoluciones del día</FormLabel>
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
                                  value={field.value || ""}
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

                {/* TIPO DE VISITA Y PROFESIONAL */}
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="visitType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Visita</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
                          <Input placeholder="Dr. Juan Pérez" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* COMENTARIO FINAL DEL DÍA */}
                <Separator />
                <FormField
                  control={form.control}
                  name="finalComment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comentario final del día / turno</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder="Evolución general del residente durante el día/turno."
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* PENDIENTES */}
                <FormField
                  control={form.control}
                  name="pendingTasks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pendientes</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Prescripciones, interconsultas, exámenes pendientes, observaciones para el siguiente turno, etc."
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {renderPhotoEvidence()}
              </div>
            )}

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
                          <Input placeholder="María González" {...field} value={field.value || ""} />
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
                          <Input type="date" {...field} value={field.value || ""} />
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
                          value={field.value || ""}
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
                            value={field.value || ""}
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
