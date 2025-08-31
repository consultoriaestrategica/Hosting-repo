
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

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: Staff['role'][]; // Allows any role from the Staff type
};

export function DashboardNav() {
  const pathname = usePathname()
  const { user, role: userRole } = useUser()

  const isActive = (path: string) => {
    return pathname === path || (path !== "/dashboard" && pathname.startsWith(path))
  }
  
  const allNavItems: NavItem[] = [
    { href: "/dashboard", label: "Inicio", icon: <Home />, roles: ['Admin'] },
    { href: "/dashboard/residents", label: "Residentes", icon: <Users />, roles: ['Admin', 'Enfermera', 'Médico', 'Fisioterapeuta'] },
    { href: "/dashboard/staff", label: "Personal", icon: <HardHat />, roles: ['Admin'] },
    { href: "/dashboard/contracts", label: "Contratos", icon: <BookUser />, roles: ['Admin'] },
    { href: "/dashboard/visitors", label: "Visitantes", icon: <Car />, roles: ['Admin', 'Enfermera', 'Médico', 'Fisioterapeuta'] },
    { href: "/dashboard/logs", label: "Registro Diario", icon: <ClipboardList />, roles: ['Admin', 'Enfermera', 'Médico', 'Fisioterapeuta'] },
    { href: "/dashboard/reports", label: "Reportes", icon: <FileText />, roles: ['Admin'] },
    { href: "/dashboard/settings", label: "Configuración", icon: <Settings />, roles: ['Admin'] },
  ];

  const navItems = useMemo(() => {
    if (!userRole) return [];
    // Filter items based on whether the user's specific role is included in the item's roles array
    return allNavItems.filter(item => item.roles.includes(userRole));
  }, [userRole]);


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
