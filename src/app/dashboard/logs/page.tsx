"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PlusCircle, Stethoscope, Truck, Eye } from "lucide-react"
import NewLogForm from "../residents/[id]/new-log-form"
import { useLogs, Log } from "@/hooks/use-logs"
import { useResidents } from "@/hooks/use-residents"
import LogDetailDialog from "../components/log-detail-dialog"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { PartialEvolutionForm } from "./partial-evolution-form"

function LogsPageContent() {
  const { logs, isLoading: logsLoading } = useLogs()
  const { residents, isLoading: residentsLoading } = useResidents()
  const [isNewLogDialogOpen, setIsNewLogDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<Log | null>(null)

  // Estado para evolución parcial
  const [isPartialDialogOpen, setIsPartialDialogOpen] = useState(false)
  const [logForPartial, setLogForPartial] = useState<Log | null>(null)

  useEffect(() => {
    if (!isNewLogDialogOpen && !isDetailDialogOpen && !isPartialDialogOpen) {
      const cleanup = () => {
        if (!document.querySelector('[data-state="open"][role="dialog"]')) {
          document.body.style.pointerEvents = '';
          document.body.style.removeProperty('pointer-events');
          if (document.body.style.length === 0) document.body.removeAttribute('style');
        }
      };
      cleanup();
      const t1 = setTimeout(cleanup, 150);
      const t2 = setTimeout(cleanup, 500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [isNewLogDialogOpen, isDetailDialogOpen, isPartialDialogOpen]);

  const isLoading = logsLoading || residentsLoading

  const enrichedLogs = useMemo(() => {
    return logs
      .map((log) => {
        const resident = residents.find((r) => r.id === log.residentId)
        return {
          ...log,
          residentName: resident?.name || "Residente no encontrado",
        }
      })
      .sort(
        (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
      )
  }, [logs, residents])

  const handleLogClick = (log: Log) => {
    setSelectedLog(log)
    setIsDetailDialogOpen(true)
  }

  const handlePartialEvolutionClick = (log: Log) => {
    setLogForPartial(log)
    setIsPartialDialogOpen(true)
  }

  if (isLoading) {
    return <div>Cargando registros...</div>
  }

  return (
    <div className="space-y-6">
      {/* HEADER RESPONSIVE */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold font-headline">
            Historial de Registros
          </h1>
          <p className="text-sm text-muted-foreground">
            Unifica todos los registros médicos y de suministros en un solo
            lugar.
          </p>
        </div>
        <div className="flex w-full sm:w-auto justify-start sm:justify-end">
          <Dialog
            open={isNewLogDialogOpen}
            onOpenChange={setIsNewLogDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto h-9 gap-1">
                <PlusCircle className="h-4 w-4" />
                <span className="whitespace-nowrap">
                  Añadir nuevo registro
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl">
              <DialogHeader>
                <DialogTitle>Agregar registro de evolución</DialogTitle>
                <DialogDescription>
                  Seleccione el tipo de reporte y complete la información.
                </DialogDescription>
              </DialogHeader>
              <NewLogForm onFormSubmit={() => setIsNewLogDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* LISTADO PRINCIPAL */}
      <Card className="mt-1">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">
            Todos los Registros
          </CardTitle>
          <CardDescription>
            Un listado completo de todos los registros médicos y de suministros
            del sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Vista Mobile (tarjetas) */}
          <div className="md:hidden space-y-4">
            {enrichedLogs.length > 0 ? (
              enrichedLogs.map((log) => (
                <div
                  key={log.id}
                  className="w-full border rounded-xl p-4 space-y-3 cursor-pointer bg-white shadow-sm"
                  onClick={() => handleLogClick(log)}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-base truncate">
                        {log.residentName}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {new Date(log.endDate).toLocaleString("es-ES", {
                          dateStyle: "long",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`shrink-0 ${
                        log.reportType === "medico"
                          ? "border-blue-500"
                          : "border-orange-500"
                      }`}
                    >
                      {log.reportType === "medico" ? (
                        <Stethoscope className="h-3 w-3 mr-1" />
                      ) : (
                        <Truck className="h-3 w-3 mr-1" />
                      )}
                      <span className="text-[11px]">
                        {log.reportType === "medico" ? "Médico" : "Suministro"}
                      </span>
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground pt-2 border-t line-clamp-2">
                    {log.reportType === "medico"
                      ? Array.isArray(log.evolutionNotes) &&
                        log.evolutionNotes.length > 0
                        ? log.evolutionNotes[0]
                        : "Sin notas de evolución"
                      : log.supplyDescription}
                  </p>

                  <div className="flex justify-end gap-2 pt-2">
                    {log.reportType === "medico" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-3 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePartialEvolutionClick(log)
                        }}
                      >
                        <PlusCircle className="mr-1 h-4 w-4" />
                        Evolución
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-3 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLogClick(log)
                      }}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      Ver
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8 text-sm">
                Aún no hay registros para mostrar.
              </p>
            )}
          </div>

          {/* Vista Desktop (tabla) */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Residente</TableHead>
                  <TableHead>Tipo de Reporte</TableHead>
                  <TableHead>Detalle Principal</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrichedLogs.length > 0 ? (
                  enrichedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {new Date(log.endDate).toLocaleString("es-ES", {
                          dateStyle: "long",
                          timeStyle: "short",
                        })}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/residents/${log.residentId}`}
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {log.residentName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            log.reportType === "medico"
                              ? "border-blue-500"
                              : "border-orange-500"
                          }
                        >
                          {log.reportType === "medico" ? (
                            <Stethoscope className="h-3 w-3 mr-1" />
                          ) : (
                            <Truck className="h-3 w-3 mr-1" />
                          )}
                          {log.reportType === "medico" ? "Médico" : "Suministro"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.reportType === "medico"
                          ? Array.isArray(log.evolutionNotes) &&
                            log.evolutionNotes.length > 0
                            ? log.evolutionNotes[0]
                            : "Sin notas de evolución"
                          : log.supplyDescription}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {log.reportType === "medico" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePartialEvolutionClick(log)}
                            >
                              <PlusCircle className="mr-1 h-4 w-4" />
                              Evolución
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLogClick(log)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalle
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Aún no hay registros para mostrar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de detalle */}
      {selectedLog && (
        <LogDetailDialog
          isOpen={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          log={selectedLog}
          residentName={
            enrichedLogs.find((l) => l.id === selectedLog.id)?.residentName ||
            ""
          }
        />
      )}

      {/* Dialog de evolución parcial */}
      {logForPartial && (
        <Dialog
          open={isPartialDialogOpen}
          onOpenChange={(open) => {
            setIsPartialDialogOpen(open)
            if (!open) setLogForPartial(null)
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Agregar evolución parcial</DialogTitle>
              <DialogDescription>
                Residente:{" "}
                {
                  enrichedLogs.find((l) => l.id === logForPartial.id)
                    ?.residentName
                }
              </DialogDescription>
            </DialogHeader>

            <PartialEvolutionForm
              log={logForPartial}
              onSaved={() => {
                setIsPartialDialogOpen(false)
                setLogForPartial(null)
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default function LogsPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <LogsPageContent />
    </Suspense>
  )
}
