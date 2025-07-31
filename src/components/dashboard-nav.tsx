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
    return pathname === path
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive("/dashboard")}
          tooltip="Dashboard"
        >
          <Link href="/dashboard">
            <BarChart3 />
            <span>Dashboard</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive("/dashboard/residents")}
          tooltip="Residents"
        >
          <Link href="/dashboard/residents">
            <Users />
            <span>Residents</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive("/dashboard/logs")}
          tooltip="Daily Log"
        >
          <Link href="#">
            <ClipboardList />
            <span>Daily Log</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
       <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive("/dashboard/reports")}
          tooltip="Reports"
        >
          <Link href="#">
            <FileText />
            <span>Reports</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
       <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive("/dashboard/settings")}
          tooltip="Settings"
        >
          <Link href="#">
            <Settings />
            <span>Settings</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
