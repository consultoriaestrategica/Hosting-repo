
"use client"

import { useMemo } from 'react';
import Link from 'next/link';
import { useResidents, AgendaEvent } from '@/hooks/use-residents';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { isWithinInterval, addDays, startOfDay } from 'date-fns';

type EnrichedEvent = AgendaEvent & {
    residentName: string;
    residentId: string;
};

export default function AgendaDashboard() {
    const { residents, isLoading: residentsLoading } = useResidents();

    const upcomingEvents = useMemo(() => {
        const today = startOfDay(new Date());
        const nextSevenDays = addDays(today, 7);

        const allPendingEvents: EnrichedEvent[] = residents.flatMap(resident =>
            (resident.agendaEvents || [])
                .filter(event => event.status === 'Pendiente')
                .map(event => ({
                    ...event,
                    residentName: resident.name,
                    residentId: resident.id,
                }))
        );

        return allPendingEvents
            .filter(event => {
                const eventDate = new Date(event.date);
                return isWithinInterval(eventDate, { start: today, end: nextSevenDays });
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    }, [residents]);

    const getEventTypeVariant = (type: string) => {
        switch (type) {
            case 'Cita Médica': return 'destructive';
            case 'Gestión Personal': return 'secondary';
            case 'Otro':
            default: return 'outline';
        }
    };

    if (residentsLoading) {
        return <p>Cargando eventos...</p>;
    }
    
    if (upcomingEvents.length === 0) {
        return <p className="text-muted-foreground text-center">No hay eventos programados para los próximos 7 días.</p>
    }

    return (
        <div className="w-full">
            {/* Desktop View: Table */}
            <div className="hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[180px]">Fecha y Hora</TableHead>
                            <TableHead>Residente</TableHead>
                            <TableHead>Evento</TableHead>
                            <TableHead>Tipo</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {upcomingEvents.map((event) => (
                            <TableRow key={event.id}>
                                <TableCell className="font-medium">
                                    {new Date(event.date).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}
                                </TableCell>
                                <TableCell>
                                    <Link href={`/dashboard/residents/${event.residentId}`} className="font-semibold hover:underline">
                                        {event.residentName}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <p className="font-medium">{event.title}</p>
                                    {event.description && <p className="text-xs text-muted-foreground">{event.description}</p>}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getEventTypeVariant(event.type)}>{event.type}</Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile View: Card List */}
            <div className="md:hidden space-y-4">
                {upcomingEvents.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4 space-y-3">
                        <div>
                            <p className="font-semibold text-sm">{new Date(event.date).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Residente</p>
                            <Link href={`/dashboard/residents/${event.residentId}`} className="font-semibold hover:underline text-base">
                                {event.residentName}
                            </Link>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Evento</p>
                            <p className="font-medium">{event.title}</p>
                            {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                        </div>
                        <div>
                           <Badge variant={getEventTypeVariant(event.type)}>{event.type}</Badge>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
