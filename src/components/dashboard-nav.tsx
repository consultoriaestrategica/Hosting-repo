"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebarContext,
} from "@/components/ui/sidebar"
import { useUser } from "@/hooks/use-user"
import { dashboardNavItems, isDashboardNavItemActive } from "@/lib/dashboard-nav-items"

function DashboardNav() {
  const pathname = usePathname()
  const { user, isLoading, hasPermission } = useUser()
  const { setIsOpen, isMobile } = useSidebarContext()

  const handleNavClick = () => {
    if (isMobile) {
      setIsOpen(false)
    }
  }

  const isActive = (path: string) => isDashboardNavItemActive(pathname, path)

  const navItems = dashboardNavItems

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem className="px-4 py-2">
          <span className="text-sm text-muted-foreground">Cargando menú...</span>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem className="px-4 py-2">
          <span className="text-sm text-muted-foreground">No autenticado</span>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        const canAccess = hasPermission(item.permission)
        const Icon = item.icon
        return canAccess ? (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={isActive(item.href)}
              tooltip={item.label}
              className={isActive(item.href) ? "text-white" : "text-sidebar-foreground hover:text-sidebar-hover-foreground"}
            >
              <Link href={item.href} onClick={handleNavClick}>
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ) : null
      })}
    </SidebarMenu>
  )
}

// Export explícito al final
export { DashboardNav }