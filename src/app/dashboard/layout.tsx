"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { LogOut, ArrowLeft, Home, ChevronDown } from "lucide-react"

import DashboardGuard from "@/components/dashboard-guard"
import { DashboardNav } from "@/components/dashboard-nav"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { useUser } from "@/hooks/use-user"
import { useInactivityLogout } from "@/hooks/use-inactivity-logout"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"

function getInitials(name?: string | null): string {
  if (!name) return "?"
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  useInactivityLogout()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  const isDashboardHome = pathname === "/dashboard"

  return (
    <DashboardGuard>
    <SidebarProvider>
      {/* Contenedor raíz: ocupa toda la pantalla y no permite scroll horizontal */}
      <div className="min-h-screen flex w-full bg-background text-foreground overflow-x-hidden">
        {/* ======= SIDEBAR ======= */}
        <Sidebar className="border-r bg-sidebar">
          <SidebarHeader className="px-4 py-4 border-b">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold tracking-tight text-[#EAF2F7]">
                Hogar San Juan
              </p>
              <p className="text-xs text-[#8FB0C2]">
                {user?.role === "Administrador" ? "Panel de administración" : user?.role === "Líder de Enfermería" ? "Panel de enfermería" : "Panel clínico"}
              </p>
            </div>
          </SidebarHeader>

          <SidebarContent className="py-3">
            <DashboardNav />
          </SidebarContent>

        </Sidebar>

        {/* ======= COLUMNA DERECHA ======= */}
        <div className="flex-1 flex flex-col min-h-screen w-full overflow-x-hidden">
          {/* HEADER SUPERIOR */}
          <header className="border-b bg-card/80 backdrop-blur">
            <div className="mx-auto flex h-14 md:h-16 max-w-6xl w-full items-center justify-between px-4 md:px-6">
              <div className="flex items-center gap-3 min-w-0">
                {/* Hamburguesa SOLO en móvil */}
                <SidebarTrigger className="-ml-1 md:hidden" />

                {/* Botones de navegación: Atrás / Inicio */}
                {!isDashboardHome && (
                  <div className="flex items-center gap-2">
                    {/* Atrás – solo escritorio / tablets */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hidden sm:inline-flex"
                      onClick={() => router.back()}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span className="sr-only">Volver atrás</span>
                    </Button>

                    {/* Inicio – botón con texto en desktop */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="hidden md:inline-flex"
                      onClick={() => router.push("/dashboard")}
                    >
                      <Home className="h-4 w-4 mr-1" />
                      Inicio
                    </Button>

                    {/* Inicio – solo icono en mobile */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="inline-flex md:hidden"
                      onClick={() => router.push("/dashboard")}
                    >
                      <Home className="h-4 w-4" />
                      <span className="sr-only">Ir al inicio</span>
                    </Button>
                  </div>
                )}

                <div className="flex flex-col min-w-0">
                  <h1 className="text-base font-semibold leading-tight md:text-lg truncate">
                    Bienvenido{user?.name ? `, ${user.name}` : ""}
                  </h1>
                  <p className="text-[11px] md:text-xs text-muted-foreground hidden sm:block truncate">
                    Gestiona residentes, personal, contratos y agenda en un solo
                    lugar.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Menu de usuario: agrupa nombre/email/cerrar sesion en un
                    solo control, en vez de mostrarlos sueltos en el header.
                    El avatar solo (sin nombre) sigue siendo el trigger en
                    mobile — mismo target de toque que antes tenia el boton
                    "Salir", ahora unificado en un solo elemento. */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-11 md:h-10 gap-2 rounded-full md:rounded-md px-1.5 md:px-2"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                          {getInitials(user?.name)}
                        </AvatarFallback>
                      </Avatar>
                      {user && (
                        <span className="hidden md:inline text-sm font-medium truncate max-w-[160px]">
                          {user.name}
                        </span>
                      )}
                      <ChevronDown className="hidden md:inline h-4 w-4 text-muted-foreground" />
                      <span className="sr-only">Abrir menú de usuario</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    {user && (
                      <>
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-0.5">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      onSelect={() => setIsLogoutDialogOpen(true)}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* CONTENIDO PRINCIPAL */}
          <main className="flex-1 bg-background w-full">
            <div className="mx-auto max-w-6xl w-full px-4 md:px-6 py-4 md:py-6 pb-8">
              {children}
            </div>
          </main>

          {/* FOOTER GLOBAL */}
          <footer className="border-t bg-card/90 backdrop-blur px-4 md:px-6 py-2 text-[11px] md:text-xs text-muted-foreground flex items-center justify-between w-full">
            <span>© {new Date().getFullYear()} Hogar San Juan</span>
            <span className="hidden sm:inline">
              Plataforma de gestión integral del hogar.
            </span>
          </footer>
        </div>
      </div>
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cerrar sesión</DialogTitle>
            <DialogDescription>¿Está seguro que desea cerrar sesión? Deberá iniciar sesión nuevamente para acceder al sistema.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleLogout}>Cerrar sesión</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
    </DashboardGuard>
  )
}
