"use client"

import * as React from "react"
import { cva } from "class-variance-authority"
import { Menu, X } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// ======================
// Hook de estado global del sidebar
// ======================

const useSidebar = () => {
  const [isOpen, setIsOpen] = React.useState(false)
  const isMobile = useIsMobile()

  // En desktop: sidebar siempre abierto
  // En móvil: cerrado por defecto
  React.useEffect(() => {
    if (!isMobile) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [isMobile])

  // Bloquea el scroll del body cuando el sidebar móvil está abierto
  React.useEffect(() => {
    if (isMobile && isOpen) {
      const original = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = original
      }
    }
  }, [isMobile, isOpen])

  // Cierra con tecla ESC en móvil
  React.useEffect(() => {
    if (!isMobile || !isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isMobile, isOpen])

  return { isOpen, setIsOpen, isMobile }
}

type SidebarContextProps = ReturnType<typeof useSidebar>

const SidebarContext = React.createContext<SidebarContextProps | undefined>(
  undefined
)

function SidebarProvider({ children }: { children: React.ReactNode }) {
  const value = useSidebar()
  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  )
}

function useSidebarContext() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebarContext must be used within a SidebarProvider")
  }
  return context
}

// ======================
// Componente principal Sidebar
// ======================

const Sidebar = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => {
  const { isOpen, isMobile, setIsOpen } = useSidebarContext()

  return (
    <>
      {/* Overlay en móvil para cerrar al hacer clic fuera */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        ref={ref}
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-shrink-0 flex-col border-r bg-card transition-[width,transform] duration-300 ease-in-out md:relative",
          isMobile ? "w-72 max-w-xs md:w-72" : "",
          isMobile && !isOpen ? "-translate-x-full" : "",
          !isMobile && (isOpen ? "w-72" : "w-20"),
          className
        )}
        {...props}
      />
    </>
  )
})
Sidebar.displayName = "Sidebar"

// ======================
// Secciones del sidebar
// ======================

function SidebarHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isOpen } = useSidebarContext()
  return (
    <div
      className={cn(
        "flex h-14 items-center border-b p-4 lg:h-[60px]",
        !isOpen && "justify-center px-2",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-1 items-center gap-2",
          !isOpen && "justify-center"
        )}
      >
        {isOpen ? props.children : <SidebarToggle />}
      </div>
      {isOpen && <SidebarToggle />}
    </div>
  )
}
SidebarHeader.displayName = "SidebarHeader"

function SidebarContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 overflow-y-auto", className)} {...props} />
}
SidebarContent.displayName = "SidebarContent"

function SidebarFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isOpen } = useSidebarContext()
  return (
    <div
      className={cn(
        "mt-auto flex items-center justify-center border-t p-4",
        !isOpen && "p-2",
        className
      )}
      {...props}
    />
  )
}
SidebarFooter.displayName = "SidebarFooter"

// ======================
// Menú y botones
// ======================

const sidebarMenuStyles = cva("flex flex-col text-card-foreground", {
  variants: {},
})

function SidebarMenu({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isOpen } = useSidebarContext()
  return (
    <div className={cn("p-2", isOpen && "space-y-1 p-4")}>
      <div
        className={cn(
          sidebarMenuStyles({ className }),
          !isOpen && "items-center"
        )}
        {...props}
      />
    </div>
  )
}
SidebarMenu.displayName = "SidebarMenu"

function SidebarMenuItem({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex", className)} {...props} />
}
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonStyles = cva(
  "group flex w-full items-center justify-start rounded-md p-3 text-sm font-medium transition-colors duration-200 ease-in-out",
  {
    variants: {
      isActive: {
        true: "bg-primary text-primary-foreground",
        false: "bg-transparent hover:bg-accent hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      isActive: false,
    },
  }
)

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & { isActive?: boolean; asChild?: boolean; tooltip?: string }
>(({ className, isActive, asChild = false, tooltip, ...props }, ref) => {
  const { isOpen } = useSidebarContext()

  const button = (
    <Button
      ref={ref}
      variant="ghost"
      className={cn(
        sidebarMenuButtonStyles({ isActive, className }),
        !isOpen && "justify-center"
      )}
      asChild={asChild}
      {...props}
    >
      {asChild ? (
        React.isValidElement(props.children) &&
        React.cloneElement(props.children as React.ReactElement<any>, {
          children: (
            <>
              {(props.children as any).props.children[0]}
              <span className={cn("ml-2", isOpen ? "inline" : "hidden")}>
                {(props.children as any).props.children[1]}
              </span>
            </>
          ),
        })
      ) : (
        <>
          {React.isValidElement(props.children) && props.children}
          <span className={cn("ml-2", isOpen ? "inline" : "hidden")}>
            {props.title}
          </span>
        </>
      )}
    </Button>
  )

  if (!isOpen && tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return button
})
SidebarMenuButton.displayName = "SidebarMenuButton"

// ======================
// Triggers / toggles
// ======================

// Botón que se usa fuera del sidebar (por ejemplo en el header)
// Solo se muestra en móvil
function SidebarTrigger({ className, ...props }: ButtonProps) {
  const { isMobile, setIsOpen } = useSidebarContext()
  if (!isMobile) return null
  return (
    <Button
      variant="ghost"
      className={cn("p-2", className)}
      onClick={() => setIsOpen(true)}
      {...props}
    >
      <Menu />
      <span className="sr-only">Abrir menú</span>
    </Button>
  )
}
SidebarTrigger.displayName = "SidebarTrigger"

// Botón que se muestra dentro del sidebar (header lateral)
function SidebarToggle({ className, ...props }: ButtonProps) {
  const { isMobile, isOpen, setIsOpen } = useSidebarContext()
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("shrink-0", className)}
      onClick={() => setIsOpen(!isOpen)}
      {...props}
    >
      {isMobile && isOpen ? (
        <X className="h-6 w-6" />
      ) : (
        <Menu className="h-6 w-6" />
      )}
      <span className="sr-only">Alternar menú</span>
    </Button>
  )
}

export {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebarContext,
  SidebarToggle,
}
