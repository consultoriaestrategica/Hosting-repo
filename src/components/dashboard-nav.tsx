
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
    // Hide dashboard home for staff, it's not very useful for them
    if (item.href === "/dashboard" && role === 'staff') return false;
     
    // Determine the main role category for permission checking
    let userRoleCategory = 'Staff'; // Default to staff
    if (role === 'admin' || role === 'Administrativo') {
        userRoleCategory = 'Admin';
    } else if (role === 'family') {
        userRoleCategory = 'Family';
    }

    // Check if the item's roles array includes the user's category
    return item.roles.includes(userRoleCategory);
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
