
"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { BarChart3, Users, ClipboardList, FileText, Settings } from "lucide-react"

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
    { href: "/dashboard", label: "Panel de Control", icon: <BarChart3 />, roles: ['admin', 'staff', 'family'] },
    { href: "/dashboard/residents", label: "Residentes", icon: <Users />, roles: ['admin', 'staff', 'family'] },
    { href: "/dashboard/logs", label: "Registro Diario", icon: <ClipboardList />, roles: ['admin', 'staff'] },
    { href: "/dashboard/reports", label: "Reportes", icon: <FileText />, roles: ['admin', 'staff'] },
    { href: "/dashboard/settings", label: "Configuración", icon: <Settings />, roles: ['admin'] },
  ]

  const navItems = allNavItems.filter(item => item.roles.includes(role));


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
