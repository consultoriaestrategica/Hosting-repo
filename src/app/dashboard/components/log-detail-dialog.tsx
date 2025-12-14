"use client"

import React, { useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Stethoscope,
  Clock,
  Image as ImageIcon,
  FileText,
} from "lucide-react"
import { Log } from "@/hooks/use-logs"
import { cn } from "@/lib/utils"

interface LogDetailDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  log: Log
  residentName: string
}

type EvolutionBackend =
  | string
  | {
      text?: string
      note?: string
      createdAt?: string | Date
      time?: string
    }

type LogWithExtras = Log & {
  evolutionNotes?: EvolutionBackend[] | EvolutionBackend
  images?: string[]
  photoUrls?: string[]
  supplyDescription?: string
  supplyDate?: string
}

type EvolutionEntryUI = {
  text: string
  time?: string
}

export default function LogDetailDialog({
  isOpen,
  onOpenChange,
  log,
  residentName,
}: LogDetailDialogProps) {
  if (!log) return null

  const pdfRef = useRef<HTMLDivElement | null>(null)

  const typedLog = log as LogWithExtras
  const isMedical = typedLog.reportType === "medico"

  const endDate = new Date(typedLog.endDate)
  const formattedDate = endDate.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const formattedTime = endDate.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  })

  // =========================
  //   NORMALIZAR EVOLUCIONES
  // =========================
  const rawEvolution =
    "evolutionNotes" in typedLog && typedLog.evolutionNotes
      ? typedLog.evolutionNotes
      : []

  let evolutionEntries: EvolutionEntryUI[] = []

  if (Array.isArray(rawEvolution)) {
    // Puede ser array de strings o de objetos
    evolutionEntries = rawEvolution.map((item) => {
      if (typeof item === "string") {
        return { text: item }
      }
      const anyItem = item as any
      const text = anyItem.text ?? anyItem.note ?? String(anyItem ?? "")
      let time: string | undefined

      const rawCreatedAt: string | Date | undefined =
        anyItem.createdAt ?? anyItem.time

      if (rawCreatedAt) {
        const date =
          rawCreatedAt instanceof Date
            ? rawCreatedAt
            : new Date(rawCreatedAt)
        if (!isNaN(date.getTime())) {
          time = date.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })
        }
      }

      return { text, time }
    })

    // Orden cronológico ascendente (primero la evolución más antigua)
    evolutionEntries.sort((a, b) => {
      if (!a.time || !b.time) return 0
      // comparar solo por la cadena HH:mm
      return a.time.localeCompare(b.time)
    })
  } else if (rawEvolution) {
    // Un solo valor (string u objeto)
    if (typeof rawEvolution === "string") {
      evolutionEntries = [{ text: rawEvolution }]
    } else {
      const anyItem = rawEvolution as any
      const text = anyItem.text ?? anyItem.note ?? String(anyItem ?? "")
      let time: string | undefined
      const rawCreatedAt: string | Date | undefined =
        anyItem.createdAt ?? anyItem.time
      if (rawCreatedAt) {
        const date =
          rawCreatedAt instanceof Date
            ? rawCreatedAt
            : new Date(rawCreatedAt)
        if (!isNaN(date.getTime())) {
          time = date.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })
        }
      }
      evolutionEntries = [{ text, time }]
    }
  }

  const imageUrls: string[] = typedLog.images ?? typedLog.photoUrls ?? []

  const handleExportPdf = async () => {
    if (typeof window === "undefined") return
    if (!pdfRef.current) return

    const element = pdfRef.current

    const [{ jsPDF }, html2canvasModule] = await Promise.all([
      import("jspdf"),
      import("html2canvas"),
    ])
    const html2canvas = html2canvasModule.default

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    })

    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF("p", "mm", "a4")

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()

    const imgWidthPx = canvas.width
    const imgHeightPx = canvas.height
    const ratio = Math.min(pdfWidth / imgWidthPx, pdfHeight / imgHeightPx)

    const imgWidth = imgWidthPx * ratio
    const imgHeight = imgHeightPx * ratio

    const marginX = (pdfWidth - imgWidth) / 2
    const marginY = (pdfHeight - imgHeight) / 2

    pdf.addImage(imgData, "PNG", marginX, marginY, imgWidth, imgHeight)
    const safeName = (residentName || "residente").replace(/\s+/g, "-")
    const dateStr = endDate.toISOString().slice(0, 10)

    pdf.save(`reporte-${safeName}-${dateStr}.pdf`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full h-[90vh] flex flex-col p-0">
        {/* ZONA EXPORTABLE A PDF */}
        <div ref={pdfRef} className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* HEADER */}
          <DialogHeader className="px-6 pt-5 pb-3 border-b">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-blue-50 p-2 text-blue-600">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-semibold">
                  {isMedical ? "Detalle del Reporte Médico" : "Detalle del Registro"}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm">
                  Reporte para{" "}
                  <span className="font-medium text-slate-900">
                    {residentName || "Residente"}
                  </span>{" "}
                  del {formattedDate}, {formattedTime}.
                </DialogDescription>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "shrink-0",
                  isMedical
                    ? "border-blue-500 text-blue-700"
                    : "border-orange-500 text-orange-700"
                )}
              >
                {isMedical ? "Médico" : "Suministro"}
              </Badge>
            </div>
          </DialogHeader>

          {/* CONTENIDO SCROLLABLE */}
          <ScrollArea className="flex-1 px-6 py-4">
            {/* Hora general del registro */}
            <section className="mb-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Clock className="h-4 w-4" />
                <span>Hora del registro</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{formattedTime}</p>
            </section>

            {/* BLOQUE PRINCIPAL */}
            {isMedical ? (
              <section className="mb-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
                  <FileText className="h-4 w-4" />
                  <span>Notas de Evolución</span>
                </div>

                {evolutionEntries.length > 0 ? (
                  <div className="space-y-3">
                    {evolutionEntries.map((entry, index) => (
                      <div
                        key={index}
                        className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-sm text-slate-700"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs text-slate-500">
                            Evolución #{index + 1}
                          </span>
                          {entry.time && (
                            <span className="text-[11px] text-slate-500">
                              {entry.time}
                            </span>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {entry.text}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No hay notas de evolución registradas.
                  </p>
                )}
              </section>
            ) : (
              <section className="mb-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
                  <FileText className="h-4 w-4" />
                  <span>Detalle del suministro</span>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-sm text-slate-700 space-y-1">
                  <p className="whitespace-pre-wrap">
                    {typedLog.supplyDescription || "Sin descripción registrada."}
                  </p>
                  {typedLog.supplyDate && (
                    <p className="text-xs text-slate-500">
                      Fecha de suministro:{" "}
                      <span className="font-medium">{typedLog.supplyDate}</span>
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* FOTOS */}
            {imageUrls.length > 0 && (
              <section className="mb-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
                  <ImageIcon className="h-4 w-4" />
                  <span>Fotografías del reporte</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {imageUrls.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="group relative overflow-hidden rounded-lg border bg-slate-50"
                      onClick={() => window.open(url, "_blank")}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Foto ${idx + 1}`}
                        className="h-28 w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              </section>
            )}
          </ScrollArea>
        </div>

        {/* ACCIONES */}
        <div className="flex flex-col sm:flex-row gap-2 px-6 pb-4 pt-3 border-t bg-slate-50/60">
          <Button
            variant="outline"
            className="w-full sm:w-auto order-2 sm:order-1"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
          <Button
            className="w-full sm:w-auto order-1 sm:order-2"
            onClick={handleExportPdf}
          >
            <FileText className="h-4 w-4 mr-2" />
            Exportar a PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
