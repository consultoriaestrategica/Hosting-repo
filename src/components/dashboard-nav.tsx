
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
  const { user, role } = useUser();

  const isActive = (path: string) => {
    return pathname === path || (path !== "/dashboard" && pathname.startsWith(path))
  }
  
  const allNavItems = [
    { href: "/dashboard", label: "Inicio", icon: <Home />, roles: ['Admin', 'family', 'staff'] },
    { href: "/dashboard/residents", label: "Residentes", icon: <Users />, roles: ['Admin', 'family', 'staff'] },
    { href: "/dashboard/staff", label: "Personal", icon: <HardHat />, roles: ['Admin'] },
    { href: "/dashboard/logs", label: "Registro Diario", icon: <ClipboardList />, roles: ['Admin', 'staff'] },
    { href: "/dashboard/visitors", label: "Visitantes", icon: <Car />, roles: ['Admin', 'staff'] },
    { href: "/dashboard/contracts", label: "Contratos", icon: <BookUser />, roles: ['Admin'] },
    { href: "/dashboard/reports", label: "Reportes", icon: <FileText />, roles: ['Admin'] },
    { href: "/dashboard/settings", label: "Configuración", icon: <Settings />, roles: ['Admin'] },
  ]

  const navItems = allNavItems.filter(item => {
    if (!role) return false;
    
    // Admin sees everything in their list
    if (role === 'Admin') {
        return item.roles.includes('Admin');
    }

    // Staff sees their specific items
    if (role === 'staff') {
      return item.roles.includes('staff');
    }

    // Family sees their specific items
    if (role === 'family') {
      return item.roles.includes('family');
    }

    return false;
  });

  return (
    <SidebarMenu>
      {navItems.map((item) => (
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
      ))}
    </SidebarMenu>
  )
}
