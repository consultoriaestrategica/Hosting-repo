"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useUser } from "@/hooks/use-user"

export function UserNav() {
  const { user, role, isLoading } = useUser()

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden sm:block text-right">
          <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
          <div className="h-3 w-16 bg-muted animate-pulse rounded mt-1"></div>
        </div>
        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Obtener iniciales del nombre
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex items-center gap-3">
      {/* Información del usuario - visible solo en desktop */}
      <div className="hidden sm:block text-right">
        <p className="text-sm font-medium leading-none">{user.name}</p>
        <p className="text-xs text-muted-foreground mt-1">{role}</p>
      </div>
      
      {/* Avatar con iniciales */}
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
    </div>
  )
}