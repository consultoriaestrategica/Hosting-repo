"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Home, Users, ClipboardList, FileText, Settings, BookUser, HardHat, Car } from "lucide-react"

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

export function DashboardNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'admin'; // Default to admin if no role

  const isActive = (path: string) => {
    return pathname === path || (path !== "/dashboard" && pathname.startsWith(path))
  }
  
  const allNavItems = [
    { href: "/dashboard", label: "Inicio", icon: <Home />, roles: ['admin', 'family', 'staff'] },
    { href: "/dashboard/residents", label: "Residentes", icon: <Users />, roles: ['admin', 'family', 'staff'] },
    { href: "/dashboard/staff", label: "Personal", icon: <HardHat />, roles: ['admin'] },
    { href: "/dashboard/logs", label: "Registro Diario", icon: <ClipboardList />, roles: ['admin', 'staff'] },
    { href: "/dashboard/visitors", label: "Visitantes", icon: <Car />, roles: ['admin', 'staff'] },
    { href: "/dashboard/contracts", label: "Contratos", icon: <BookUser />, roles: ['admin'] },
    { href: "/dashboard/reports", label: "Reportes", icon: <FileText />, roles: ['admin'] },
    { href: "/dashboard/settings", label: "Configuración", icon: <Settings />, roles: ['admin'] },
  ]

  const navItems = allNavItems.filter(item => {
     if (item.href === "/dashboard" && role === 'staff') return false;
    return item.roles.includes(role)
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
            <Link href={`${item.href}?role=${role}`}>
              {item.icon}
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
