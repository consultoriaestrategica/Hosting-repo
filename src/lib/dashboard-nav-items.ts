import { Home, Users, ClipboardList, FileText, Settings, HardHat, Car, type LucideIcon } from "lucide-react"

export interface DashboardNavItem {
  href: string
  label: string
  icon: LucideIcon
  permission: string
}

// Fuente unica para el sidebar de escritorio (dashboard-nav.tsx) y la
// barra inferior de mobile (bottom-nav.tsx) — mismo orden, mismos
// iconos, mismos permisos en los dos lugares.
//
// El orden importa: en mobile, la barra inferior toma los primeros 4
// items a los que el usuario tiene permiso y el resto cae al panel
// "Mas". Prioridad confirmada con el cliente: Inicio siempre primero,
// Registro Diario en 2do lugar porque es donde el personal trabaja el
// dia a dia (no el perfil del residente), Residentes 3ro, Personal 4to
// (o el siguiente disponible si el rol no tiene permiso de "staff").
export const dashboardNavItems: DashboardNavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: Home, permission: "dashboard" },
  { href: "/dashboard/logs", label: "Registro Diario", icon: ClipboardList, permission: "logs" },
  { href: "/dashboard/residents", label: "Residentes", icon: Users, permission: "residents" },
  { href: "/dashboard/staff", label: "Personal", icon: HardHat, permission: "staff" },
  { href: "/dashboard/visitors", label: "Visitantes", icon: Car, permission: "visitors" },
  { href: "/dashboard/reports", label: "Reportes", icon: FileText, permission: "reports" },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings, permission: "settings" },
]

export function isDashboardNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
}
