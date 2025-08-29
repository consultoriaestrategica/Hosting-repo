
"use client"
import { useEffect } from "react"
import { usePathname } from "next/navigation"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  useSidebarContext,
} from "@/components/ui/sidebar"
import { UserNav } from "@/components/user-nav"
import { DashboardNav } from "@/components/dashboard-nav"
import { Home, Bell } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useResidents } from "@/hooks/use-residents"
import { useToast } from "@/hooks/use-toast"
import { isTomorrow, parseISO } from "date-fns"


function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isOpen, isMobile, setIsOpen } = useSidebarContext()
  const { residents, isLoading: residentsLoading } = useResidents()
  const { toast } = useToast()
  const pathname = usePathname()

  useEffect(() => {
    if (isMobile) {
      setIsOpen(false)
    }
  }, [pathname, isMobile, setIsOpen])


  useEffect(() => {
    if (residentsLoading) return;

    const LAST_CHECK_KEY = 'agenda_notification_last_check';
    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
    const today = new Date().toISOString().split('T')[0];

    if (lastCheck === today) {
      return; // Already checked today
    }

    let upcomingEvents = 0;

    residents.forEach(resident => {
      resident.agendaEvents?.forEach(event => {
        if (event.status === 'Pendiente' && isTomorrow(parseISO(event.date))) {
            upcomingEvents++;
            toast({
                title: `Evento Próximo: ${resident.name}`,
                description: `Mañana: ${event.title} a las ${new Date(event.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
            });
        }
      });
    });

    if (upcomingEvents > 0) {
       toast({
          title: "Recordatorio de Agenda",
          description: `Tienes ${upcomingEvents} evento(s) programado(s) para mañana. Revisa las agendas.`,
          variant: "default",
       });
    }

    localStorage.setItem(LAST_CHECK_KEY, today);

  }, [residents, residentsLoading, toast]);


  return (
    <div className="flex min-h-screen">
      <Sidebar>
        <SidebarHeader>
          <Link href="/dashboard" className="flex items-center gap-2 font-headline text-lg font-semibold">
            <Home className="h-6 w-6" />
            <span className={cn("font-semibold")}>Ángel Guardián</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <DashboardNav />
        </SidebarContent>
        <SidebarFooter>
          {/* Footer content can go here */}
        </SidebarFooter>
      </Sidebar>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="w-full flex-1">
            {/* Header content can go here */}
          </div>
          <UserNav />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  )
}
