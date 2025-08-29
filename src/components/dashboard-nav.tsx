
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, ClipboardList, FileText, Settings, BookUser, HardHat, Car } from "lucide-react"
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export function DashboardNav() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path || (path !== "/dashboard" && pathname.startsWith(path))
  }
  
  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Inicio", icon: <Home /> },
    { href: "/dashboard/residents", label: "Residentes", icon: <Users /> },
    { href: "/dashboard/staff", label: "Personal", icon: <HardHat /> },
    { href: "/dashboard/contracts", label: "Contratos", icon: <BookUser /> },
    { href: "/dashboard/visitors", label: "Visitantes", icon: <Car /> },
    { href: "/dashboard/logs", label: "Registro Diario", icon: <ClipboardList /> },
    { href: "/dashboard/reports", label: "Reportes", icon: <FileText /> },
    { href: "/dashboard/settings", label: "Configuración", icon: <Settings /> },
  ];

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
