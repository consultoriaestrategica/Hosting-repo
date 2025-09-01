"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, ClipboardList, FileText, Settings, BookUser, HardHat, Car } from "lucide-react"
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { useUser } from "@/hooks/use-user"
import { useMemo } from "react"
import { UserRole } from "@/types/user"

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: UserRole[];
  permission: string;
};

export function DashboardNav() {
  const pathname = usePathname()
  const { user, role, isLoading, can } = useUser()

  const isActive = (path: string) => {
    return pathname === path || (path !== "/dashboard" && pathname.startsWith(path))
  }
  
  const allNavItems: NavItem[] = [
    { 
      href: "/dashboard", 
      label: "Inicio", 
      icon: <Home />, 
      roles: ['Administrativo', 'Personal Asistencial', 'Acceso Familiar'],
      permission: "dashboard"
    },
    { 
      href: "/dashboard/residents", 
      label: "Residentes", 
      icon: <Users />, 
      roles: ['Administrativo', 'Personal Asistencial'],
      permission: "residents"
    },
    { 
      href: "/dashboard/staff", 
      label: "Personal", 
      icon: <HardHat />, 
      roles: ['Administrativo'],
      permission: "staff"
    },
    { 
      href: "/dashboard/contracts", 
      label: "Contratos", 
      icon: <BookUser />, 
      roles: ['Administrativo'],
      permission: "contracts"
    },
    { 
      href: "/dashboard/visitors", 
      label: "Visitantes", 
      icon: <Car />, 
      roles: ['Administrativo', 'Personal Asistencial'],
      permission: "visitors"
    },
    { 
      href: "/dashboard/logs", 
      label: "Registro Diario", 
      icon: <ClipboardList />, 
      roles: ['Administrativo', 'Personal Asistencial'],
      permission: "logs"
    },
    { 
      href: "/dashboard/reports", 
      label: "Reportes", 
      icon: <FileText />, 
      roles: ['Administrativo'],
      permission: "reports"
    },
    { 
      href: "/dashboard/settings", 
      label: "Configuración", 
      icon: <Settings />, 
      roles: ['Administrativo'],
      permission: "settings"
    },
  ];

  const navItems = useMemo(() => {
    if (!role || !user) {
      return [];
    }
    
    // Filtrar elementos basándose en permisos
    return allNavItems.filter(item => {
      // Verificar si el rol está permitido Y si tiene el permiso específico
      const hasRoleAccess = item.roles.includes(role);
      const hasPermission = can(item.permission);
      
      return hasRoleAccess && hasPermission;
    });
  }, [role, user, can]);

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="p-4 text-sm text-gray-500">
            Cargando menú...
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }
  
  if (navItems.length === 0 && !isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="p-4 text-sm text-red-500">
            No tiene permisos para ver módulos.
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href} className="my-1">
          <SidebarMenuButton
            asChild
            isActive={isActive(item.href)}
            tooltip={item.label}
          >
            <Link href={item.href}>
              {item.icon}
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}