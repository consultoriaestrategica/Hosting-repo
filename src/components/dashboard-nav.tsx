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

export function DashboardNav() {
  const pathname = usePathname()
  const { user, isLoading, hasPermission } = useUser()

  const isActive = (path: string) => {
    return pathname === path || (path !== "/dashboard" && pathname.startsWith(path))
  }
  
  const navItems = [
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

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          Cargando...
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        hasPermission(item.permission) && (
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
        )
      ))}
    </SidebarMenu>
  )
}
