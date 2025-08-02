
"use client"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  useSidebarContext,
} from "@/components/ui/sidebar"
import { UserNav } from "@/components/user-nav"
import { DashboardNav } from "@/components/dashboard-nav"
import { Home } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isOpen, isMobile } = useSidebarContext()

  return (
    <>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <Link href="/dashboard" className="flex items-center gap-2 font-headline text-lg font-semibold">
              <Home className="h-6 w-6" />
              <span className={cn("font-semibold", !isOpen && "hidden")}>Ángel Guardián</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <DashboardNav />
          </SidebarContent>
          <SidebarFooter>
            {/* Footer content can go here */}
          </SidebarFooter>
        </Sidebar>
        <div className={cn(
          "flex min-h-dvh w-full flex-1 flex-col transition-[margin-left] duration-300 ease-in-out",
          !isMobile && (isOpen ? "ml-72" : "ml-16")
        )}>
          <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="w-full flex-1">
              {/* Header content can go here */}
            </div>
            <UserNav />
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  )
}
