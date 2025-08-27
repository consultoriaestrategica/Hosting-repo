
"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Home, Users, ClipboardList, FileText, Settings, BookUser, HardHat, Car } from "lucide-react"

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { useUser } from "@/hooks/use-user"

export function DashboardNav() {
  const pathname = usePathname()
  const { user } = useUser();
  const searchParams = useSearchParams()
  const role = user?.role || searchParams.get('role') || 'staff'; 


  const isActive = (path: string) => {
    return pathname === path || (path !== "/dashboard" && pathname.startsWith(path))
  }
  
  const allNavItems = [
    { href: "/dashboard", label: "Inicio", icon: <Home />, roles: ['Admin', 'Family', 'Staff'] },
    { href: "/dashboard/residents", label: "Residentes", icon: <Users />, roles: ['Admin', 'Family', 'Staff'] },
    { href: "/dashboard/staff", label: "Personal", icon: <HardHat />, roles: ['Admin'] },
    { href: "/dashboard/logs", label: "Registro Diario", icon: <ClipboardList />, roles: ['Admin', 'Staff'] },
    { href: "/dashboard/visitors", label: "Visitantes", icon: <Car />, roles: ['Admin', 'Staff'] },
    { href: "/dashboard/contracts", label: "Contratos", icon: <BookUser />, roles: ['Admin'] },
    { href: "/dashboard/reports", label: "Reportes", icon: <FileText />, roles: ['Admin'] },
    { href: "/dashboard/settings", label: "Configuración", icon: <Settings />, roles: ['Admin'] },
  ]

  const navItems = allNavItems.filter(item => {
     if (item.href === "/dashboard" && role === 'Staff') return false;
     
     // Match user.role which can be "Administrativo", "Enfermera", etc.
     if (role === "Admin" || role === "Administrativo") {
        return item.roles.includes("Admin");
     }
      if (role === "Family") {
        return item.roles.includes("Family");
      }
     // Any other role is considered 'Staff' for navigation purposes
     return item.roles.includes("Staff");
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
            <Link href={`${item.href}?role=${role.toLowerCase()}`}>
              {item.icon}
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
