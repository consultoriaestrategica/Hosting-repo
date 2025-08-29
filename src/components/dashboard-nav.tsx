
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, ClipboardList, FileText, Settings, BookUser, HardHat, Car } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

type NavGroup = {
    title: string;
    icon: React.ReactNode;
    items: NavItem[];
};

export function DashboardNav() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path || (path !== "/dashboard" && pathname.startsWith(path))
  }
  
  const navGroups: NavGroup[] = [
    {
        title: "Gestión Principal",
        icon: <Home />,
        items: [
            { href: "/dashboard", label: "Inicio", icon: <Home /> },
            { href: "/dashboard/residents", label: "Residentes", icon: <Users /> },
        ]
    },
    {
        title: "Administración",
        icon: <ClipboardList />,
        items: [
            { href: "/dashboard/staff", label: "Personal", icon: <HardHat /> },
            { href: "/dashboard/contracts", label: "Contratos", icon: <BookUser /> },
            { href: "/dashboard/visitors", label: "Visitantes", icon: <Car /> },
            { href: "/dashboard/logs", label: "Registro Diario", icon: <ClipboardList /> },
        ]
    },
    {
        title: "Sistema",
        icon: <Settings />,
        items: [
            { href: "/dashboard/reports", label: "Reportes", icon: <FileText /> },
            { href: "/dashboard/settings", label: "Configuración", icon: <Settings /> },
        ]
    }
  ];

  const getActiveGroup = () => {
     for (const group of navGroups) {
        if (group.items.some(item => isActive(item.href))) {
            return group.title;
        }
    }
    return navGroups.length > 0 ? navGroups[0].title : "";
  }
  
  return (
    <SidebarMenu>
        <Accordion type="multiple" defaultValue={[getActiveGroup()]} className="w-full">
            {navGroups.map((group) => (
                <AccordionItem value={group.title} key={group.title} className="border-b-0">
                    <AccordionTrigger className="justify-start py-3 px-4 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground hover:no-underline rounded-md [&[data-state=open]>svg]:rotate-180">
                        <div className="flex items-center gap-2">
                             {group.icon}
                            <span>{group.title}</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pl-4">
                        {group.items.map((item) => (
                            <SidebarMenuItem key={item.href} className="my-1">
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive(item.href)}
                                    tooltip={item.label}
                                >
                                    <Link href={item.href}>
                                    {item.icon}
                                    <span>{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    </SidebarMenu>
  )
}
