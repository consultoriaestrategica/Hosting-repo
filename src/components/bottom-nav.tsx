"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MoreHorizontal } from "lucide-react"

import { useUser } from "@/hooks/use-user"
import { dashboardNavItems, isDashboardNavItemActive } from "@/lib/dashboard-nav-items"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const MAX_DIRECT_ITEMS = 4

// Etiquetas mas cortas solo para la barra inferior, donde el espacio
// horizontal es mucho mas chico que en el sidebar. El label completo
// (usado en el sidebar y en el panel "Mas") no cambia.
const SHORT_LABELS: Record<string, string> = {
  "Registro Diario": "Registro",
}

export function BottomNav() {
  const pathname = usePathname()
  const { hasPermission } = useUser()
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  const isActive = (href: string) => isDashboardNavItemActive(pathname, href)

  const accessibleItems = dashboardNavItems.filter((item) => hasPermission(item.permission))
  if (accessibleItems.length === 0) return null

  const directItems = accessibleItems.slice(0, MAX_DIRECT_ITEMS)
  const overflowItems = accessibleItems.slice(MAX_DIRECT_ITEMS)
  const hasOverflow = overflowItems.length > 0
  const isOverflowActive = overflowItems.some((item) => isActive(item.href))

  const totalSlots = directItems.length + (hasOverflow ? 1 : 0)
  const gridColsClass =
    totalSlots >= 5 ? "grid-cols-5" :
    totalSlots === 4 ? "grid-cols-4" :
    totalSlots === 3 ? "grid-cols-3" :
    totalSlots === 2 ? "grid-cols-2" :
    "grid-cols-1"

  return (
    <>
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className={cn("grid h-16", gridColsClass)}>
          {directItems.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-1"
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200",
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span
                  className={cn(
                    "text-[10px] font-medium leading-none",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {SHORT_LABELS[item.label] ?? item.label}
                </span>
              </Link>
            )
          })}

          {hasOverflow && (
            <button
              type="button"
              onClick={() => setIsMoreOpen(true)}
              className="flex flex-col items-center justify-center gap-1"
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200",
                  isOverflowActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}
              >
                <MoreHorizontal className="h-5 w-5" />
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium leading-none",
                  isOverflowActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                Más
              </span>
            </button>
          )}
        </div>
      </nav>

      {hasOverflow && (
        <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl md:hidden">
            <SheetHeader>
              <SheetTitle>Más secciones</SheetTitle>
            </SheetHeader>
            <div className="mt-4 grid grid-cols-3 gap-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
              {overflowItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMoreOpen(false)}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition-colors hover:bg-accent/50"
                  >
                    <span
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-full",
                        active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  )
}
