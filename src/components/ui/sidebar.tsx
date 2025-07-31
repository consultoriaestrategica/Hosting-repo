"use client"

import * as React from "react"
import { cva } from "class-variance-authority"
import { Menu, X } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "@/components/ui/button"

const useSidebar = () => {
  const [isOpen, setIsOpen] = React.useState(false)
  const isMobile = useIsMobile()

  React.useEffect(() => {
    if (!isMobile) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [isMobile])

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

const Sidebar = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => {
  const { isOpen, isMobile } = useSidebarContext()

  return (
    <aside
      ref={ref}
      className={cn(
        "fixed left-0 top-0 z-50 flex h-full min-h-dvh w-full max-w-xs flex-shrink-0 flex-col border-r bg-card transition-[transform,width] duration-300 ease-in-out md:relative md:max-w-xs",
        !isOpen && isMobile && "-translate-x-full",
        !isOpen && !isMobile && "w-16",
        className
      )}
      {...props}
    />
  )
})
Sidebar.displayName = "Sidebar"

function SidebarHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isMobile, isOpen, setIsOpen } = useSidebarContext()
  return (
    <div
      className={cn(
        "flex h-14 items-center border-b p-4 lg:h-[60px]",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "flex w-full items-center justify-between",
          !isOpen && "justify-center"
        )}
      >
        <div
          className={cn(
            "flex flex-1 items-center",
            !isOpen && "hidden md:flex"
          )}
        >
          {props.children}
        </div>
        {isMobile && (
          <Button
            variant="ghost"
            className="p-1"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        )}
      </div>
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
  return (
    <div
      className={cn(
        "mt-auto border-t p-4",
        className
      )}
      {...props}
    />
  )
}
SidebarFooter.displayName = "SidebarFooter"

const sidebarMenuStyles = cva(
  "flex flex-col text-card-foreground [&>*:not(:last-child)]:mb-1",
  {
    variants: {},
  }
)

function SidebarMenu({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isOpen } = useSidebarContext()
  return (
    <div className="p-4">
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
        false:
          "bg-transparent hover:bg-accent hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      isActive: false,
    },
  }
)

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & { isActive?: boolean; asChild?: boolean }
>(({ className, isActive, asChild = false, ...props }, ref) => {
  const { isOpen } = useSidebarContext()
  const Comp = asChild ? "div" : Button
  return (
    <Comp
      ref={ref}
      variant="ghost"
      className={cn(
        sidebarMenuButtonStyles({ isActive, className }),
        !isOpen && "justify-center"
      )}
      {...props}
    >
      <div
        className={cn(
          "flex items-center",
          !isOpen &&
            "group-hover:absolute group-hover:left-1/2 group-hover:top-1/2 group-hover:-translate-x-1/2 group-hover:-translate-y-1/2"
        )}
      >
        <div
          className={cn(
            "flex w-full items-center gap-2",
            !isOpen && "justify-center"
          )}
        >
          {props.children}
        </div>
      </div>
    </Comp>
  )
})
SidebarMenuButton.displayName = "SidebarMenuButton"

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
    </Button>
  )
}
SidebarTrigger.displayName = "SidebarTrigger"

function SidebarInset({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isOpen } = useSidebarContext()

  return (
    <div
      className={cn(
        "flex min-h-dvh flex-1 flex-col transition-[margin-left] duration-300 ease-in-out",
        !isOpen ? "md:ml-16" : "md:ml-xs",
        className
      )}
      {...props}
    />
  )
}
SidebarInset.displayName = "SidebarInset"

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
  SidebarInset,
  useSidebarContext
}