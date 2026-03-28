"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { LogOut, ArrowLeft, Home } from "lucide-react"

import { DashboardNav } from "@/components/dashboard-nav"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
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
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)

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
    <SidebarProvider>
      {/* Contenedor raíz: ocupa toda la pantalla y no permite scroll horizontal */}
      <div className="min-h-screen flex w-full bg-slate-50 text-slate-900 overflow-x-hidden">
        {/* ======= SIDEBAR ======= */}
        <Sidebar className="border-r bg-white/90 backdrop-blur">
          <SidebarHeader className="px-4 py-4 border-b">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold tracking-tight">
                Hogar San Juan
              </p>
              <p className="text-xs text-muted-foreground">
                Panel de administración
              </p>
            </div>
          </SidebarHeader>

          <SidebarContent className="py-3">
            <DashboardNav />
          </SidebarContent>

          {/* Footer lateral solo para la barra */}
          <SidebarFooter className="px-4 py-3 border-t text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} Hogar San Juan
          </SidebarFooter>
        </Sidebar>

        {/* ======= COLUMNA DERECHA ======= */}
        <div className="flex-1 flex flex-col min-h-screen w-full overflow-x-hidden">
          {/* HEADER SUPERIOR */}
          <header className="border-b bg-white/80 backdrop-blur">
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
                {user && (
                  <div className="hidden md:flex flex-col items-end max-w-[220px]">
                    <span className="text-sm font-medium truncate">
                      {user.name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </span>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setIsLogoutDialogOpen(true)}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Cerrar sesión</span>
                  <span className="sm:hidden">Salir</span>
                </Button>
              </div>
            </div>
          </header>

          {/* CONTENIDO PRINCIPAL */}
          <main className="flex-1 bg-slate-50 w-full">
            <div className="mx-auto max-w-6xl w-full px-4 md:px-6 py-4 md:py-6 pb-8">
              {children}
            </div>
          </main>

          {/* FOOTER GLOBAL */}
          <footer className="border-t bg-white/90 backdrop-blur px-4 md:px-6 py-2 text-[11px] md:text-xs text-muted-foreground flex items-center justify-between w-full">
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
  )
}
