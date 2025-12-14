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

function DashboardNav() {
  const pathname = usePathname()
  const { user, isLoading, hasPermission } = useUser()

  const isActive = (path: string) => {
    return pathname === path || (path !== "/dashboard" && pathname.startsWith(path))
  }
  
  const navItems = [
    { 
      href: "/dashboard", 
      label: "Inicio", 
      icon: <Home className="h-5 w-5" />, 
      permission: "dashboard"
    },
    { 
      href: "/dashboard/residents", 
      label: "Residentes", 
      icon: <Users className="h-5 w-5" />, 
      permission: "residents"
    },
    { 
      href: "/dashboard/staff", 
      label: "Personal", 
      icon: <HardHat className="h-5 w-5" />, 
      permission: "staff"
    },
    { 
      href: "/dashboard/contracts", 
      label: "Contratos", 
      icon: <BookUser className="h-5 w-5" />, 
      permission: "contracts"
    },
    { 
      href: "/dashboard/visitors", 
      label: "Visitantes", 
      icon: <Car className="h-5 w-5" />, 
      permission: "visitors"
    },
    { 
      href: "/dashboard/logs", 
      label: "Registro Diario", 
      icon: <ClipboardList className="h-5 w-5" />, 
      permission: "logs"
    },
    { 
      href: "/dashboard/reports", 
      label: "Reportes", 
      icon: <FileText className="h-5 w-5" />, 
      permission: "reports"
    },
    { 
      href: "/dashboard/settings", 
      label: "Configuración", 
      icon: <Settings className="h-5 w-5" />, 
      permission: "settings"
    },
  ]

  if (isLoading) {
    console.log("⏳ DashboardNav: Cargando usuario...")
    return (
      <SidebarMenu>
        <SidebarMenuItem className="px-4 py-2">
          <span className="text-sm text-muted-foreground">Cargando menú...</span>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!user) {
    console.log("⚠️ DashboardNav: No hay usuario")
    return (
      <SidebarMenu>
        <SidebarMenuItem className="px-4 py-2">
          <span className="text-sm text-muted-foreground">No autenticado</span>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  console.log("✅ DashboardNav: Renderizando menú para:", user.email, "| Rol:", user.role)

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        const canAccess = hasPermission(item.permission)
        console.log(`🔑 Item: ${item.label} | Permiso: ${item.permission} | Acceso: ${canAccess}`)
        
        return canAccess ? (
          <SidebarMenuItem key={item.href}>
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
        ) : null
      })}
    </SidebarMenu>
  )
}

// Export explícito al final
export { DashboardNav }