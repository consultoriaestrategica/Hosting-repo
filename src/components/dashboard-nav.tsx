
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
import type { Staff } from "@/hooks/use-staff"

// Define los tipos de roles que se usarán para la navegación
type NavRole = "Administrativo" | "Personal médico" | "Familiares";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: NavRole[]; // Usa el tipo de rol de navegación
};

export function DashboardNav() {
  const pathname = usePathname()
  const { user, role: userRole, isLoading } = useUser()

  const isActive = (path: string) => {
    return pathname === path || (path !== "/dashboard" && pathname.startsWith(path))
  }
  
  const allNavItems: NavItem[] = [
    { 
      href: "/dashboard", 
      label: "Inicio", 
      icon: <Home />, 
      roles: ['Administrativo', 'Personal médico', 'Familiares'] 
    },
    { 
      href: "/dashboard/residents", 
      label: "Residentes", 
      icon: <Users />, 
      roles: ['Administrativo', 'Personal médico'] 
    },
    { 
      href: "/dashboard/staff", 
      label: "Personal", 
      icon: <HardHat />, 
      roles: ['Administrativo'] 
    },
    { 
      href: "/dashboard/contracts", 
      label: "Contratos", 
      icon: <BookUser />, 
      roles: ['Administrativo'] 
    },
    { 
      href: "/dashboard/visitors", 
      label: "Visitantes", 
      icon: <Car />, 
      roles: ['Administrativo', 'Personal médico'] 
    },
    { 
      href: "/dashboard/logs", 
      label: "Registro Diario", 
      icon: <ClipboardList />, 
      roles: ['Administrativo', 'Personal médico'] 
    },
    { 
      href: "/dashboard/reports", 
      label: "Reportes", 
      icon: <FileText />, 
      roles: ['Administrativo'] 
    },
    { 
      href: "/dashboard/settings", 
      label: "Configuración", 
      icon: <Settings />, 
      roles: ['Administrativo'] 
    },
  ];

  const navItems = useMemo(() => {
    if (!userRole) return [];
    
    // Simplificar el rol del usuario para la navegación
    let currentUserNavRole: NavRole;
    if (userRole === 'Admin') {
      currentUserNavRole = 'Administrativo';
    } else {
      // Agrupa todos los demás roles del personal bajo "Personal médico"
      currentUserNavRole = 'Personal médico';
    }
    
    return allNavItems.filter(item => item.roles.includes(currentUserNavRole));
  }, [userRole]);


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
