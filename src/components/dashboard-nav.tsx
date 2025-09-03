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
  permission: string;
};

export function DashboardNav() {
  const pathname = usePathname()
  const { user, isLoading, can } = useUser()

  const isActive = (path: string) => {
    return pathname === path || (path !== "/dashboard" && pathname.startsWith(path))
  }
  
  const allNavItems: NavItem[] = [
    { 
      href: "/dashboard", 
      label: "Inicio", 
      icon: <Home />, 
      permission: "dashboard"
    },
    { 
      href: "/dashboard/residents", 
      label: "Residentes", 
      icon: <Users />, 
      permission: "residents"
    },
    { 
      href: "/dashboard/staff", 
      label: "Personal", 
      icon: <HardHat />, 
      permission: "staff"
    },
    { 
      href: "/dashboard/contracts", 
      label: "Contratos", 
      icon: <BookUser />, 
      permission: "contracts"
    },
    { 
      href: "/dashboard/visitors", 
      label: "Visitantes", 
      icon: <Car />, 
      permission: "visitors"
    },
    { 
      href: "/dashboard/logs", 
      label: "Registro Diario", 
      icon: <ClipboardList />, 
      permission: "logs"
    },
    { 
      href: "/dashboard/reports", 
      label: "Reportes", 
      icon: <FileText />, 
      permission: "reports"
    },
    { 
      href: "/dashboard/settings", 
      label: "Configuración", 
      icon: <Settings />, 
      permission: "settings"
    },
  ];

  const navItems = useMemo(() => {
    if (!user || isLoading) {
      return [];
    }
    // Filter items based on user's permissions
    return allNavItems.filter(item => can(item.permission));
  }, [user, isLoading, can]);

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
