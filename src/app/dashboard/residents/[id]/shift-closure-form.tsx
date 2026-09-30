"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DialogFooter, DialogClose } from "@/components/ui/dialog"
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Lock } from "lucide-react"

import { Resident } from "@/hooks/use-residents"
import { useAuth } from "@/hooks/use-auth"
import { useUser } from "@/hooks/use-user"
import { useToast } from "@/hooks/use-toast"
import { useShiftClosures, type ShiftClosure } from "@/hooks/use-shift-closures"
import {
  calculateShiftCoverage,
  getShiftForDate,
  getShiftWindow,
  getShiftClosingStatus,
  type CoverageResult,
  type ShiftType,
  type VitalReading,
} from "@/lib/shift-coverage"

interface ShiftClosureFormProps {
  resident: Resident
  onFormSubmit: () => void
}

const CATEGORY_ORDER = [
  "vitalSigns",
  "skinStatus",
  "nursingCare",
  "elimination",
  "behaviors",
  "feeding",
  "evolutionVisitType",
  "glucose",
] as const

function categoryLabel(key: string, shiftType: ShiftType): string {
  switch (key) {
    case "vitalSigns":
      return "Signos vitales (FC, FR, SpO₂, T/A, Temperatura)"
    case "skinStatus":
      return "Estado de la piel"
    case "nursingCare":
      return "Cuidados de enfermería (curación + medicación)"
    case "elimination":
      return "Eliminación (diuresis, deposición, pañal)"
    case "behaviors":
      return shiftType === "dia"
        ? "Comportamientos y terapias (síndrome vespertino, agitación, terapia física, terapia ocupacional)"
        : "Comportamientos (síndrome vespertino, agitación)"
    case "feeding":
      return "Alimentación"
    case "evolutionVisitType":
      return "Evolución con tipo de visita"
    case "glucose":
      return "Glucometría"
    default:
      return key
  }
}

function toDateInputValue(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function formatVital(reading: VitalReading | null): string[] {
  if (!reading) return ["Sin lecturas registradas en este turno."]
  const lines: string[] = []
  if (reading.heartRate !== undefined) lines.push(`FC: ${reading.heartRate} lpm`)
  if (reading.respiratoryRate !== undefined) lines.push(`FR: ${reading.respiratoryRate} rpm`)
  if (reading.spo2 !== undefined) lines.push(`SpO₂: ${reading.spo2}%`)
  if (reading.bloodPressureSys !== undefined && reading.bloodPressureDia !== undefined) {
    lines.push(`T/A: ${reading.bloodPressureSys}/${reading.bloodPressureDia} mmHg`)
  }
  if (reading.temperature !== undefined) lines.push(`Temp: ${reading.temperature}°C`)
  return lines.length > 0 ? lines : ["Sin lecturas registradas en este turno."]
}

export default function ShiftClosureForm({ resident, onFormSubmit }: ShiftClosureFormProps) {
  const { user: authUser } = useAuth()
  const { user: staffUser, hasPermission } = useUser()
  const { toast } = useToast()
  const { getShiftClosure, closeShift } = useShiftClosures()

  // Por defecto, el turno que acaba de terminar respecto a "ahora" (no
  // el turno "actual" — a las 7:05pm el turno actual ya es noche, pero
  // lo que hay que cerrar es el dia que recien termino). Se calcula
  // retrocediendo 1ms desde el inicio del turno actual.
  const [shiftType, setShiftType] = useState<ShiftType>("dia")
  const [shiftDateInput, setShiftDateInput] = useState<string>("")
  const [closingNote, setClosingNote] = useState("")
  const [requiresNightFollowUp, setRequiresNightFollowUp] = useState(false)

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingClosure, setExistingClosure] = useState<ShiftClosure | null>(null)
  const [coverage, setCoverage] = useState<CoverageResult | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const now = new Date()
    const currentShift = getShiftForDate(now)
    const previousShift = getShiftForDate(new Date(currentShift.start.getTime() - 1))
    setShiftType(previousShift.type)
    setShiftDateInput(previousShift.shiftDate)
  }, [])

  useEffect(() => {
    if (!shiftDateInput) return
    let cancelled = false
    setIsLoading(true)
    setLoadError(null)
    setCoverage(null)
    setExistingClosure(null)

    async function load() {
      try {
        const existing = await getShiftClosure(resident.id, shiftDateInput, shiftType)
        if (cancelled) return
        if (existing) {
          setExistingClosure(existing)
          setIsLoading(false)
          return
        }

        let nightFollowUpRequired = false
        if (shiftType === "noche") {
          const dayClosure = await getShiftClosure(resident.id, shiftDateInput, "dia")
          nightFollowUpRequired = dayClosure?.requiresNightFollowUp === true
        }
        if (cancelled) return

        const result = await calculateShiftCoverage(resident.id, shiftDateInput, shiftType, {
          requiresNightFollowUp: nightFollowUpRequired,
          requiresGlucoseMonitoring: resident.requiresGlucoseMonitoring === true,
        })
        if (cancelled) return
        setCoverage(result)
        setIsLoading(false)
      } catch (error) {
        if (cancelled) return
        console.error("Error al cargar el estado del turno:", error)
        setLoadError(
          error instanceof Error ? error.message : "No se pudo cargar la información del turno."
        )
        setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [resident.id, resident.requiresGlucoseMonitoring, shiftDateInput, shiftType, getShiftClosure])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No se pudo cargar el cierre de turno</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onFormSubmit}>Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </div>
    )
  }

  // ------- Turno ya cerrado: vista de solo lectura -------
  if (existingClosure) {
    return (
      <div className="space-y-4">
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertTitle>Este turno ya fue cerrado</AlertTitle>
          <AlertDescription>
            Cerrado por <span className="font-medium">{existingClosure.closedBy?.displayName || "—"}</span>
            {existingClosure.closedAt && ` el ${existingClosure.closedAt.toLocaleString("es-ES")}`}.
            {existingClosure.isLate && (
              <span className="block mt-1 text-amber-700 font-medium">
                Cerrado fuera de tiempo.
              </span>
            )}
          </AlertDescription>
        </Alert>

        {existingClosure.closingNote && (
          <div>
            <p className="text-sm font-medium mb-1">Comentario de cierre</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{existingClosure.closingNote}</p>
          </div>
        )}

        <div>
          <p className="text-sm font-medium mb-1">Último signo vital del turno</p>
          <p className="text-sm text-muted-foreground">{formatVital(existingClosure.lastVitalsSnapshot).join(" · ")}</p>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onFormSubmit}>Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </div>
    )
  }

  const shiftWindow = getShiftWindow(shiftDateInput, shiftType)
  const closingStatus = getShiftClosingStatus(shiftWindow.end, new Date())
  const canOverrideLate = hasPermission("close_shift_override")
  const isBlockedByTime = closingStatus === "too-early" || (closingStatus === "late" && !canOverrideLate)
  const isComplete = coverage?.isComplete ?? false
  const canSubmit = !isBlockedByTime && isComplete && !isSubmitting

  async function handleSubmit() {
    if (!coverage || !canSubmit) return
    if (!authUser) {
      toast({ variant: "destructive", title: "No se pudo identificar al usuario actual." })
      return
    }

    setIsSubmitting(true)
    try {
      const closedBy = {
        uid: authUser.uid,
        displayName: staffUser?.name || authUser.displayName || authUser.email || "—",
        email: authUser.email || "",
      }

      await closeShift({
        residentId: resident.id,
        shiftType,
        shiftDate: shiftDateInput,
        shiftStart: shiftWindow.start.toISOString(),
        shiftEnd: shiftWindow.end.toISOString(),
        closedBy,
        isLate: closingStatus === "late",
        lastVitalsSnapshot: coverage.lastVitalsSnapshot,
        closingNote,
        fieldsCovered: coverage.covered,
        requiresNightFollowUp: shiftType === "dia" ? requiresNightFollowUp : undefined,
        logIds: coverage.logIds,
      })

      toast({
        title: "Turno cerrado",
        description: `Turno ${shiftType === "dia" ? "día" : "noche"} del ${shiftDateInput} cerrado correctamente.`,
      })
      onFormSubmit()
    } catch (error) {
      console.error("Error al cerrar turno:", error)
      toast({
        variant: "destructive",
        title: "Error al cerrar el turno",
        description: error instanceof Error ? error.message : "Intenta de nuevo.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const categories = CATEGORY_ORDER.filter(
    (key) => coverage?.covered.includes(key) || coverage?.missing.includes(key)
  )

  return (
    <div className="space-y-5">
      {/* Selector de turno */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="text-sm font-medium mb-1 block">Fecha del turno</label>
          <input
            type="date"
            className="w-full border rounded-md px-3 py-2 text-sm"
            value={shiftDateInput}
            onChange={(e) => setShiftDateInput(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Turno</label>
          <div className="flex gap-1 border rounded-md p-1">
            <Button
              type="button"
              size="sm"
              variant={shiftType === "dia" ? "default" : "ghost"}
              onClick={() => setShiftType("dia")}
            >
              Día (7am-7pm)
            </Button>
            <Button
              type="button"
              size="sm"
              variant={shiftType === "noche" ? "default" : "ghost"}
              onClick={() => setShiftType("noche")}
            >
              Noche (7pm-7am)
            </Button>
          </div>
        </div>
      </div>

      {/* Estado de la ventana horaria */}
      {closingStatus === "too-early" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Este turno todavía no termina</AlertTitle>
          <AlertDescription>
            No se puede cerrar antes de las {shiftWindow.end.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}.
          </AlertDescription>
        </Alert>
      )}
      {closingStatus === "late" && !canOverrideLate && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Fuera de tiempo</AlertTitle>
          <AlertDescription>
            Este turno debía cerrarse antes de las 2 horas posteriores a su fin. Solo un Supervisor o Administrador puede cerrarlo ahora.
          </AlertDescription>
        </Alert>
      )}
      {closingStatus === "late" && canOverrideLate && (
        <Alert className="border-amber-300 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Vas a cerrar este turno fuera de tiempo</AlertTitle>
          <AlertDescription className="text-amber-800">
            Quedará registrado como "Cerrado fuera de tiempo por {staffUser?.name || "—"}".
          </AlertDescription>
        </Alert>
      )}

      {/* Checklist de cobertura */}
      <div>
        <p className="text-sm font-semibold mb-2">Campos obligatorios del turno</p>
        <div className="space-y-1.5">
          {categories.map((key) => {
            const ok = coverage?.covered.includes(key) ?? false
            return (
              <div key={key} className="flex items-start gap-2 text-sm">
                {ok ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                )}
                <span className={ok ? "text-slate-700" : "text-destructive font-medium"}>
                  {categoryLabel(key, shiftType)}
                </span>
              </div>
            )
          })}
        </div>
        {!isComplete && (
          <p className="text-xs text-destructive mt-2">
            Faltan campos obligatorios — no se puede cerrar el turno hasta que todos los registros estén completos.
          </p>
        )}
      </div>

      {/* Ultimo signo vital, solo lectura */}
      <div>
        <p className="text-sm font-semibold mb-1">Último signo vital registrado en el turno</p>
        <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-slate-600">
          {formatVital(coverage?.lastVitalsSnapshot ?? null).join(" · ")}
        </div>
      </div>

      {/* Seguimiento nocturno, solo turno dia */}
      {shiftType === "dia" && (
        <div className="flex flex-row items-center justify-between rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">Requiere seguimiento nocturno de signos vitales</p>
            <p className="text-xs text-muted-foreground">Exige signos vitales en el cierre del turno noche de hoy.</p>
          </div>
          <Switch checked={requiresNightFollowUp} onCheckedChange={setRequiresNightFollowUp} />
        </div>
      )}

      {/* Comentario de cierre */}
      <div>
        <label className="text-sm font-medium mb-1 block">Comentario de cierre</label>
        <Textarea
          rows={3}
          placeholder="Observaciones adicionales para el cierre de este turno..."
          value={closingNote}
          onChange={(e) => setClosingNote(e.target.value)}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onFormSubmit} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Cerrar turno
        </Button>
      </DialogFooter>
    </div>
  )
}
