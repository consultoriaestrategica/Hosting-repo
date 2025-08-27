
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, ClipboardList, FileText, Settings, BookUser, HardHat, Car, ChevronDown } from "lucide-react"
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
import { useUser } from "@/hooks/use-user"
import { cn } from "@/lib/utils"


type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
  subItems?: NavItem[];
};

type NavGroup = {
    title: string;
    icon: React.ReactNode;
    roles: string[];
    items: NavItem[];
};

export function DashboardNav() {
  const pathname = usePathname()
  const { role } = useUser();

  const isActive = (path: string) => {
    return pathname === path || (path !== "/dashboard" && pathname.startsWith(path))
  }
  
  const navGroups: NavGroup[] = [
    {
        title: "Gestión Principal",
        icon: <Home />,
        roles: ['Admin', 'staff', 'family'],
        items: [
            { href: "/dashboard", label: "Inicio", icon: <Home />, roles: ['Admin', 'staff', 'family'] },
            { href: "/dashboard/residents", label: "Residentes", icon: <Users />, roles: ['Admin', 'staff', 'family'] },
        ]
    },
    {
        title: "Administración",
        icon: <ClipboardList />,
        roles: ['Admin', 'staff'],
        items: [
            { href: "/dashboard/staff", label: "Personal", icon: <HardHat />, roles: ['Admin'] },
            { href: "/dashboard/contracts", label: "Contratos", icon: <BookUser />, roles: ['Admin'] },
            { href: "/dashboard/visitors", label: "Visitantes", icon: <Car />, roles: ['Admin', 'staff'] },
            { href: "/dashboard/logs", label: "Registro Diario", icon: <ClipboardList />, roles: ['Admin', 'staff'] },
        ]
    },
    {
        title: "Sistema",
        icon: <Settings />,
        roles: ['Admin'],
        items: [
            { href: "/dashboard/reports", label: "Reportes", icon: <FileText />, roles: ['Admin'] },
            { href: "/dashboard/settings", label: "Configuración", icon: <Settings />, roles: ['Admin'] },
        ]
    }
  ];

  const getVisibleGroups = () => {
    if (!role) return [];

    return navGroups
      .filter(group => group.roles.includes(role)) // Filtra grupos basados en el rol
      .map(group => ({
        ...group,
        items: group.items.filter(item => item.roles.includes(role)) // Filtra ítems dentro de cada grupo
      }))
      .filter(group => group.items.length > 0); // Solo muestra grupos que tengan al menos un ítem visible
  };

  const visibleGroups = getVisibleGroups();
  
  const getActiveGroup = () => {
     for (const group of visibleGroups) {
        if (group.items.some(item => isActive(item.href))) {
            return group.title;
        }
    }
    return visibleGroups.length > 0 ? visibleGroups[0].title : "";
  }
  
  return (
    <SidebarMenu>
        <Accordion type="multiple" defaultValue={[getActiveGroup()]} className="w-full">
            {visibleGroups.map((group) => (
                <AccordionItem value={group.title} key={group.title} className="border-b-0">
                    <AccordionTrigger className="py-3 px-4 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground hover:no-underline rounded-md [&[data-state=open]>svg]:rotate-180">
                        <div className="flex items-center gap-2">
                             {group.icon}
                            <span>{group.title}</span>
                        </div>
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
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
