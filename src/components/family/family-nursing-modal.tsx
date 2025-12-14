"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

import { useFamilyAuth } from "@/hooks/use-family-auth"
import { useFamilyLogs } from "@/hooks/use-family-logs"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"

import {
  Heart,
  Activity,
  Pill,
  FileText,
  Droplet,
  Package,
} from "lucide-react"

/**
 * Modal para mostrar los últimos registros médicos y de suministros
 * del residente asociado al familiar actualmente autenticado.
 *
 * Se puede usar en el portal familiar, en la página de inicio, etc.
 * Solo se muestra si el usuario actual es un familiar.
 */
export function FamilyNursingModal() {
  const [open, setOpen] = useState(false)
  const { familyMember, isFamily, isLoading: authLoading } = useFamilyAuth()
  const { logs, isLoading: logsLoading } = useFamilyLogs()

  // Si aún está cargando auth o no es familiar, no mostramos nada
  if (authLoading || !isFamily || !familyMember) {
    return null
  }

  const loading = logsLoading

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Botón que abre la modal */}
      <DialogTrigger asChild>
        <Button variant="outline">
          Ver últimos registros de enfermería
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registros recientes del residente</DialogTitle>
          <DialogDescription>
            Registros médicos y de suministros de{" "}
            <strong>{familyMember.residentName}</strong> en los últimos días.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="text-center py-6 text-muted-foreground">
            Cargando registros...
          </div>
        )}

        {!loading && logs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-base font-semibold">No hay registros recientes</p>
            <p className="text-xs mt-1">
              No se han registrado reportes en los últimos días.
            </p>
          </div>
        )}

        {!loading && logs.length > 0 && (
          <div className="space-y-4">
            {logs.map((log: any) => (
              <div
                key={log.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Header del registro */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {log.reportType === "medico" ? (
                      <Heart className="h-5 w-5 text-red-500" />
                    ) : (
                      <Package className="h-5 w-5 text-blue-500" />
                    )}
                    <Badge
                      variant={
                        log.reportType === "medico" ? "default" : "secondary"
                      }
                    >
                      {log.reportType === "medico"
                        ? "Reporte Médico"
                        : "Reporte de Suministro"}
                    </Badge>
                  </div>
                  {log.endDate && (
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(log.endDate), "PPp", { locale: es })}
                    </p>
                  )}
                </div>

                {/* Contenido del reporte médico */}
                {log.reportType === "medico" && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      {log.heartRate && (
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-red-500" />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Frecuencia Cardíaca
                            </p>
                            <p className="font-semibold">
                              {log.heartRate} lpm
                            </p>
                          </div>
                        </div>
                      )}
                      {log.respiratoryRate && (
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Freq. Respiratoria
                            </p>
                            <p className="font-semibold">
                              {log.respiratoryRate} rpm
                            </p>
                          </div>
                        </div>
                      )}
                      {log.spo2 && (
                        <div className="flex items-center gap-2">
                          <Droplet className="h-4 w-4 text-cyan-500" />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              SpO2
                            </p>
                            <p className="font-semibold">{log.spo2}%</p>
                          </div>
                        </div>
                      )}
                      {log.feedingType && (
                        <div className="flex items-center gap-2">
                          <Pill className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Alimentación
                            </p>
                            <p className="font-semibold">
                              {log.feedingType}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {log.evolutionNotes && log.evolutionNotes.length > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm font-semibold mb-2 text-blue-900">
                          Notas de evolución:
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                          {log.evolutionNotes.map(
                            (note: string, idx: number) => (
                              <li
                                key={idx}
                                className="text-sm text-blue-800"
                              >
                                {note}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    {log.professionalName && (
                      <p className="text-sm text-muted-foreground mt-3">
                        <span className="font-semibold">Profesional:</span>{" "}
                        {log.professionalName}
                      </p>
                    )}

                    {log.visitType && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold">Tipo de visita:</span>{" "}
                        {log.visitType}
                      </p>
                    )}
                  </>
                )}

                {/* Contenido del reporte de suministro */}
                {log.reportType === "suministro" && (
                  <div className="space-y-2">
                    {log.supplierName && (
                      <p className="text-sm">
                        <span className="font-semibold">Proveedor:</span>{" "}
                        {log.supplierName}
                      </p>
                    )}
                    {log.supplyDate && (
                      <p className="text-sm">
                        <span className="font-semibold">
                          Fecha de suministro:
                        </span>{" "}
                        {log.supplyDate}
                      </p>
                    )}
                    {log.supplyDescription && (
                      <p className="text-sm">
                        <span className="font-semibold">Descripción:</span>{" "}
                        {log.supplyDescription}
                      </p>
                    )}
                    {log.supplyNotes && (
                      <div className="mt-2 p-3 bg-green-50 rounded-md">
                        <p className="text-sm text-green-900">
                          {log.supplyNotes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
