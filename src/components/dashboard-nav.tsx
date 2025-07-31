"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Users, ClipboardList, FileText, Settings } from "lucide-react"

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

export function DashboardNav() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path || (path !== "/dashboard" && pathname.startsWith(path))
  }

  const navItems = [
    { href: "/dashboard", label: "Panel de Control", icon: <BarChart3 /> },
    { href: "/dashboard/residents", label: "Residentes", icon: <Users /> },
    { href: "/dashboard/logs", label: "Registro Diario", icon: <ClipboardList /> },
    { href: "/dashboard/reports", label: "Reportes", icon: <FileText /> },
    { href: "/dashboard/settings", label: "Configuración", icon: <Settings /> },
  ]

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
