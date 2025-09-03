
"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Resident } from "@/hooks/use-residents"
import { Calendar } from "lucide-react"
import { useMemo } from "react"

interface AgendaPreviewDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  resident: Resident | null
}

export default function AgendaPreviewDialog({ isOpen, onOpenChange, resident }: AgendaPreviewDialogProps) {

  const sortedAgendaEvents = useMemo(() => {
    if (!resident?.agendaEvents) return [];
    return [...resident.agendaEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [resident]);

  const getAgendaStatusVariant = (status: string) => {
    switch (status) {
      case 'Pendiente': return 'default';
      case 'Completado': return 'secondary';
      case 'Cancelado': return 'destructive';
      default: return 'outline';
    }
  };

  const getEventTypeVariant = (type: string) => {
        switch (type) {
            case 'Cita Médica': return 'destructive';
            case 'Gestión Personal': return 'secondary';
            case 'Otro':
            default: return 'outline';
        }
    };


  if (!resident) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar className="mr-2" />
            Agenda de {resident.name}
          </DialogTitle>
          <DialogDescription>
            Listado de todos los eventos programados para este residente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Mobile View: Card List */}
            <div className="md:hidden space-y-4">
               {sortedAgendaEvents.length > 0 ? (
                  sortedAgendaEvents.map(event => (
                      <div key={event.id} className="border rounded-lg p-4 space-y-3">
                          <div>
                              <p className="font-semibold text-sm">{new Date(event.date).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}</p>
                          </div>
                           <div className="space-y-1 border-t pt-2">
                              <p className="font-medium">{event.title}</p>
                              {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <Badge variant={getEventTypeVariant(event.type)}>{event.type}</Badge>
                            <Badge variant={getAgendaStatusVariant(event.status)}>{event.status}</Badge>
                          </div>
                      </div>
                  ))
              ) : (
                  <p className="h-24 text-center text-muted-foreground flex items-center justify-center">No hay eventos agendados para este residente.</p>
              )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Fecha y Hora</TableHead>
                          <TableHead>Evento</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Estado</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {sortedAgendaEvents.length > 0 ? (
                          sortedAgendaEvents.map(event => (
                              <TableRow key={event.id}>
                                  <TableCell>{new Date(event.date).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</TableCell>
                                  <TableCell>
                                      <p className="font-semibold">{event.title}</p>
                                      <p className="text-xs text-muted-foreground">{event.description}</p>
                                  </TableCell>
                                  <TableCell><Badge variant={getEventTypeVariant(event.type)}>{event.type}</Badge></TableCell>
                                  <TableCell><Badge variant={getAgendaStatusVariant(event.status)}>{event.status}</Badge></TableCell>
                              </TableRow>
                          ))
                      ) : (
                          <TableRow>
                              <TableCell colSpan={4} className="h-24 text-center">No hay eventos agendados para este residente.</TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
            </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button">Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
