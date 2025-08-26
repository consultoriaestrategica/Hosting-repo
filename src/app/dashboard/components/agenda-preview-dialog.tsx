
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

  if (!resident) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
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
                                <TableCell>{event.type}</TableCell>
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

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button">Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
