
"use client"
import { useState, useMemo, useEffect } from "react"
import { Users, CalendarCheck, PlusCircle } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useResidents, AgendaEvent } from "@/hooks/use-residents"
import { useToast } from "@/hooks/use-toast"
import AgendaDashboard from "./components/agenda-dashboard"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import AgendaForm from "./components/agenda-form"
import { useUser } from "@/hooks/use-user"

export default function DashboardPage() {
  const { residents, addAgendaEvent, isLoading: residentsLoading } = useResidents()
  const [isClient, setIsClient] = useState(false)
  const [isAgendaFormOpen, setIsAgendaFormOpen] = useState(false)
  const { toast } = useToast()
  const { user } = useUser()

  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const totalActiveResidents = useMemo(() => {
    return residents.filter(r => r.status === 'Activo').length;
  }, [residents]);

  const generateGoogleCalendarLink = (event: Omit<AgendaEvent, 'id' | 'status'>, userEmail?: string) => {
    const startTime = new Date(event.date).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endTime = new Date(new Date(event.date).getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, ""); // Add 1 hour duration
    const details = encodeURIComponent(event.description || '');
    const text = encodeURIComponent(event.title);
    const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${startTime}/${endTime}&details=${details}`;
    
    if (userEmail) {
        return `${calendarUrl}&add=${encodeURIComponent(userEmail)}`;
    }
    return calendarUrl;
  };

  const handleAgendaFormSubmit = (residentId: string, data: Omit<AgendaEvent, 'id'>, syncWithCalendar: boolean) => {
    if (!residentId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Debe seleccionar un residente.'})
        return;
    }
    const resident = residents.find(r => r.id === residentId)
    if (!resident) return;

    addAgendaEvent(residentId, data);
    
    toast({ 
        title: "Evento Agendado", 
        description: `Se ha añadido un nuevo evento para ${resident.name}.`,
    });
    
    if (syncWithCalendar) {
        const calendarLink = generateGoogleCalendarLink(data, user?.email);
        window.open(calendarLink, '_blank');
    }
    
    setIsAgendaFormOpen(false);
  };


  if (!isClient || residentsLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold font-headline">Bienvenido a Ángel Guardián</h1>
      </div>
       <div className="grid gap-6 md:grid-cols-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Residentes Activos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalActiveResidents}</div>
                <p className="text-xs text-muted-foreground">Residentes actualmente en el hogar.</p>
            </CardContent>
          </Card>
          <Card>
             <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarCheck />
                        Agenda de Próximos Eventos
                    </CardTitle>
                    <CardDescription>
                        Eventos programados para los próximos 7 días.
                    </CardDescription>
                </div>
                 <Dialog open={isAgendaFormOpen} onOpenChange={setIsAgendaFormOpen}>
                    <DialogTrigger asChild>
                         <Button size="sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Agregar Evento
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Agendar Nuevo Evento</DialogTitle>
                            <DialogDescription>
                                Complete los detalles del evento y seleccione al residente.
                            </DialogDescription>
                        </DialogHeader>
                        <AgendaForm 
                            event={null} 
                            onSubmit={handleAgendaFormSubmit}
                            onCancel={() => setIsAgendaFormOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <AgendaDashboard />
            </CardContent>
          </Card>
        </div>
    </>
  )
}
