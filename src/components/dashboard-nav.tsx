
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

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: ('Admin' | 'staff')[];
};

export function DashboardNav() {
  const pathname = usePathname()
  const { role } = useUser()

  const isActive = (path: string) => {
    return pathname === path || (path !== "/dashboard" && pathname.startsWith(path))
  }
  
  const allNavItems: NavItem[] = [
    { href: "/dashboard", label: "Inicio", icon: <Home />, roles: ['Admin'] },
    { href: "/dashboard/residents", label: "Residentes", icon: <Users />, roles: ['Admin', 'staff'] },
    { href: "/dashboard/staff", label: "Personal", icon: <HardHat />, roles: ['Admin'] },
    { href: "/dashboard/contracts", label: "Contratos", icon: <BookUser />, roles: ['Admin'] },
    { href: "/dashboard/visitors", label: "Visitantes", icon: <Car />, roles: ['Admin', 'staff'] },
    { href: "/dashboard/logs", label: "Registro Diario", icon: <ClipboardList />, roles: ['Admin', 'staff'] },
    { href: "/dashboard/reports", label: "Reportes", icon: <FileText />, roles: ['Admin'] },
    { href: "/dashboard/settings", label: "Configuración", icon: <Settings />, roles: ['Admin'] },
  ];

  const navItems = useMemo(() => {
    if (!role) return [];
    // The role from useUser is either 'Admin' or 'staff'.
    // We filter the nav items based on whether the item's roles array includes the user's role.
    return allNavItems.filter(item => item.roles.includes(role as 'Admin' | 'staff'));
  }, [role, allNavItems]);


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
