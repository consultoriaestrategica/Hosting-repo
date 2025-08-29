
"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useUser } from "@/hooks/use-user"
import { useAuth } from "@/hooks/use-auth"
import { useSidebarContext } from "@/components/ui/sidebar"
import { useRouter } from "next/navigation"
import { getAuth, signOut } from "firebase/auth"
import { cn } from "@/lib/utils"

export function UserNav() {
  const { user: appUser, role } = useUser();
  const { user: authUser } = useAuth();
  const { isOpen } = useSidebarContext();
  const router = useRouter();

  if (!authUser || !appUser) {
    return (
       <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>--</AvatarFallback>
          </Avatar>
        </Button>
    )
  }
  
  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push('/');
  }

  const getInitials = (name: string) => {
    if (!name) return "--";
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className={cn("flex w-full items-center", !isOpen && "justify-center")}>
           <Button variant="ghost" className={cn("relative h-10 w-full justify-start gap-2 px-3", !isOpen && "h-10 w-10 justify-center p-0")}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={`https://placehold.co/40x40.png?text=${getInitials(appUser.name)}`} alt={`@${appUser.email}`} />
                <AvatarFallback>{getInitials(appUser.name)}</AvatarFallback>
              </Avatar>
              <div className={cn("flex flex-col items-start", !isOpen && "hidden")}>
                <span className="text-sm font-medium">{appUser.name}</span>
                 <span className="text-xs text-muted-foreground">{role}</span>
              </div>
            </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{appUser.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {appUser.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            Perfil
          </DropdownMenuItem>
           <DropdownMenuItem asChild>
             <Link href="/dashboard/settings">Configuración</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
