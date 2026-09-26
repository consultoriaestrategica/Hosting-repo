"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Moon, Sun, UserCheck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useShiftClosures, type ShiftClosure, type ShiftClosureCursor } from "@/hooks/use-shift-closures"
import type { VitalReading } from "@/lib/shift-coverage"

const PAGE_SIZE = 10

// Etiquetas humanas para las claves internas que devuelve
// calculateShiftCoverage() en fieldsCovered — mismas categorias que se
// muestran en shift-closure-form.tsx al cerrar el turno.
const FIELD_LABELS: Record<string, string> = {
  vitalSigns: "Signos vitales",
  skinStatus: "Estado de la piel",
  nursingCare: "Cuidados de enfermería",
  elimination: "Eliminación",
  behaviors: "Comportamientos",
  feeding: "Alimentación",
  evolutionVisitType: "Evolución con tipo de visita",
  glucose: "Glucometría",
}

function formatVital(reading: VitalReading | null): string {
  if (!reading) return "Sin lecturas registradas."
  const parts: string[] = []
  if (reading.heartRate !== undefined) parts.push(`FC: ${reading.heartRate} lpm`)
  if (reading.respiratoryRate !== undefined) parts.push(`FR: ${reading.respiratoryRate} rpm`)
  if (reading.spo2 !== undefined) parts.push(`SpO₂: ${reading.spo2}%`)
  if (reading.bloodPressureSys !== undefined && reading.bloodPressureDia !== undefined) {
    parts.push(`T/A: ${reading.bloodPressureSys}/${reading.bloodPressureDia} mmHg`)
  }
  if (reading.temperature !== undefined) parts.push(`Temp: ${reading.temperature}°C`)
  return parts.length > 0 ? parts.join(" · ") : "Sin lecturas registradas."
}

interface ShiftClosuresTabProps {
  residentId: string
  residentName: string
}

export default function ShiftClosuresTab({ residentId, residentName }: ShiftClosuresTabProps) {
  const { listShiftClosures } = useShiftClosures()

  const [closures, setClosures] = useState<ShiftClosure[]>([])
  const [cursor, setCursor] = useState<ShiftClosureCursor | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedClosure, setSelectedClosure] = useState<ShiftClosure | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setLoadError(null)

    listShiftClosures({ residentId, pageSize: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return
        setClosures(result.closures)
        setCursor(result.nextCursor)
        setHasMore(result.hasMore)
      })
      .catch((error) => {
        if (cancelled) return
        console.error("Error al cargar el historial de cierres:", error)
        setLoadError(
          error instanceof Error ? error.message : "No se pudo cargar el historial de cierres."
        )
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [residentId, listShiftClosures])

  async function handleLoadMore() {
    if (!cursor) return
    setIsLoadingMore(true)
    try {
      const result = await listShiftClosures({ residentId, pageSize: PAGE_SIZE, cursor })
      setClosures((prev) => [...prev, ...result.closures])
      setCursor(result.nextCursor)
      setHasMore(result.hasMore)
    } catch (error) {
      console.error("Error al cargar más cierres:", error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Cierres de Turno</CardTitle>
        <CardDescription>Todos los turnos cerrados para {residentName}.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Cargando historial...</p>
        ) : loadError ? (
          <p className="text-center text-destructive py-8">{loadError}</p>
        ) : closures.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Todavía no hay turnos cerrados para este residente.
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {closures.map((closure) => (
                <button
                  key={closure.id}
                  type="button"
                  onClick={() => setSelectedClosure(closure)}
                  className="w-full text-left border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={closure.shiftType === "dia" ? "border-amber-500" : "border-indigo-500"}
                      >
                        {closure.shiftType === "dia" ? (
                          <Sun className="h-3 w-3 mr-1" />
                        ) : (
                          <Moon className="h-3 w-3 mr-1" />
                        )}
                        Turno {closure.shiftType === "dia" ? "Día" : "Noche"}
                      </Badge>
                      <span className="text-sm font-medium">{closure.shiftDate}</span>
                      {closure.isLate && (
                        <Badge variant="outline" className="border-amber-600 text-amber-700 gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Cierre tardío
                        </Badge>
                      )}
                      {closure.shiftType === "dia" && closure.requiresNightFollowUp && (
                        <Badge variant="outline" className="border-indigo-500 text-indigo-700 gap-1">
                          <Moon className="h-3 w-3" />
                          Seguimiento nocturno
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                      <UserCheck className="h-3 w-3" />
                      {closure.closedBy?.displayName || "—"}
                    </span>
                  </div>
                  {closure.closingNote && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {closure.closingNote}
                    </p>
                  )}
                </button>
              ))}
            </div>

            {hasMore && (
              <div className="mt-4 flex justify-center">
                <Button variant="outline" size="sm" onClick={handleLoadMore} disabled={isLoadingMore}>
                  {isLoadingMore ? "Cargando..." : "Cargar más"}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Detalle completo de un cierre puntual */}
      <Dialog open={!!selectedClosure} onOpenChange={(open) => !open && setSelectedClosure(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90dvh] overflow-y-auto">
          {selectedClosure && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Turno {selectedClosure.shiftType === "dia" ? "Día" : "Noche"} — {selectedClosure.shiftDate}
                </DialogTitle>
                <DialogDescription>
                  Cerrado por {selectedClosure.closedBy?.displayName || "—"}
                  {selectedClosure.closedAt &&
                    ` el ${selectedClosure.closedAt.toLocaleString("es-ES")}`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                {selectedClosure.isLate && (
                  <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-800">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Cerrado fuera de tiempo.
                  </div>
                )}

                {selectedClosure.shiftType === "dia" && selectedClosure.requiresNightFollowUp && (
                  <div className="flex items-center gap-2 rounded-md border border-indigo-300 bg-indigo-50 px-3 py-2 text-indigo-800">
                    <Moon className="h-4 w-4 shrink-0" />
                    Se marcó "Requiere seguimiento nocturno de signos vitales".
                  </div>
                )}

                <div>
                  <p className="font-medium mb-1">Último signo vital del turno</p>
                  <p className="text-muted-foreground">
                    {formatVital(selectedClosure.lastVitalsSnapshot)}
                  </p>
                </div>

                <div>
                  <p className="font-medium mb-1">Comentario de cierre</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {selectedClosure.closingNote || "Sin comentario."}
                  </p>
                </div>

                <div>
                  <p className="font-medium mb-2">Campos cubiertos al cerrar</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedClosure.fieldsCovered.length > 0 ? (
                      selectedClosure.fieldsCovered.map((field) => (
                        <Badge key={field} variant="secondary" className="text-xs">
                          {FIELD_LABELS[field] ?? field}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">Sin datos.</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
