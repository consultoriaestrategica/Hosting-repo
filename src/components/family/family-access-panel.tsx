"use client"

import { FamilyNursingModal } from "@/components/family/family-nursing-modal" // si luego quieres mostrar el modal aquí (por ahora puede no existir)
import { useFamilyAuth } from "@/hooks/use-family-auth"
import { Button } from "@/components/ui/button"

export function FamilyAccessPanel() {
  const { familyMember, isFamily, isLoading } = useFamilyAuth()

  return (
    <div className="mt-8 border rounded-lg p-4 bg-slate-50">
      <h2 className="text-lg font-semibold mb-1">
        Acceso a familiares
      </h2>
      <p className="text-sm text-muted-foreground mb-3">
        Si eres familiar, inicia sesión con el usuario y contraseña 
        asignados por el hogar. Podrás consultar únicamente la 
        información de tu ser querido.
      </p>

      {/* Este botón por ahora solo es informativo: el login sigue siendo el mismo formulario */}
      <Button type="submit" className="w-full">
        Ingresar como familiar
      </Button>

      {/* Si ya está logueado y es familiar, aquí podrías mostrar algo extra */}
      {(!isLoading && isFamily && familyMember) && (
        <p className="mt-2 text-xs text-muted-foreground">
          Sesión activa como familiar de <strong>{familyMember.residentName}</strong>.
        </p>
      )}
    </div>
  )
}
