
"use client"
import { useState, useMemo, useEffect } from "react"
import { Users, CalendarCheck, PlusCircle, FileText, UserCheck, AlertTriangle } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useResidents, AgendaEvent } from "@/hooks/use-residents"
import { useStaff } from "@/hooks/use-staff"
import { useContracts as useResidentContracts } from "@/hooks/use-contracts"
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
import NewLogForm from "./residents/[id]/new-log-form"
import { useUser } from "@/hooks/use-user"
import { differenceInDays, parseISO } from "date-fns"

export default function DashboardPage() {
  const { residents, addAgendaEvent, isLoading: residentsLoading } = useResidents()
  const { staff, isLoading: staffLoading } = useStaff()
  const { contracts: residentContracts, isLoading: contractsLoading } = useResidentContracts()
  const [isClient, setIsClient] = useState(false)
  const [isAgendaFormOpen, setIsAgendaFormOpen] = useState(false)
  const [isNewLogDialogOpen, setIsNewLogDialogOpen] = useState(false);
  const { toast } = useToast()
  const { user } = useUser()

  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const stats = useMemo(() => {
    const activeResidents = residents.filter(r => r.status === 'Activo').length;
    const activeStaff = staff.filter(s => s.status === 'Activo').length;
    
    const expiringContracts = residentContracts.filter(c => {
        if (c.status !== 'Activo') return false;
        const diff = differenceInDays(parseISO(c.endDate), new Date());
        return diff >= 0 && diff <= 30;
    }).length;

    return { activeResidents, activeStaff, expiringContracts };
  }, [residents, staff, residentContracts]);


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


  if (!isClient || residentsLoading || staffLoading || contractsLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold font-headline">Bienvenido a Ángel Guardián</h1>
      </div>
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Residentes Activos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.activeResidents}</div>
                <p className="text-xs text-muted-foreground">Residentes actualmente en el hogar.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Personal Activo</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.activeStaff}</div>
                <p className="text-xs text-muted-foreground">Miembros del personal actualmente activos.</p>
            </CardContent>
          </Card>
           <Card className="border-amber-500/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contratos por Vencer</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.expiringContracts}</div>
                <p className="text-xs text-muted-foreground">Contratos que finalizan en los próximos 30 días.</p>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 gap-6 mt-6">
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
                 <div className="flex items-center gap-2">
                     <Dialog open={isNewLogDialogOpen} onOpenChange={setIsNewLogDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                                <FileText className="mr-2 h-4 w-4" />
                                Agregar Registro
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-4xl">
                            <DialogHeader>
                                <DialogTitle>Agregar Registro de Evolución</DialogTitle>
                                <DialogDescription>Seleccione el tipo de reporte y complete la información.</DialogDescription>
                            </DialogHeader>
                            <NewLogForm onFormSubmit={() => setIsNewLogDialogOpen(false)} />
                        </DialogContent>
                    </Dialog>
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
                 </div>
            </CardHeader>
            <CardContent>
                <AgendaDashboard />
            </CardContent>
          </Card>
        </div>
    </>
  )
}
