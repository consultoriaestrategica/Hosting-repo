"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useFamilyAuth } from "@/hooks/use-family-auth"

/**
 * Layout del Portal Familiar
 * 
 * Este layout protege todas las páginas dentro de /family-portal
 * Solo permite el acceso a familiares autenticados
 * 
 * Características:
 * - Verifica autenticación del familiar
 * - Redirecciona al login si no está autenticado
 * - Muestra loading mientras verifica
 * - Envuelve el contenido de las páginas hijas
 * 
 * @param {Object} props - Props del componente
 * @param {React.ReactNode} props.children - Contenido de las páginas hijas
 */
export default function FamilyPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { familyMember, isLoading } = useFamilyAuth()

  useEffect(() => {
    console.log('🔒 FamilyPortalLayout: Verificando acceso...', {
      isLoading,
      familyMember: familyMember?.name,
      residentId: familyMember?.residentId
    })

    // Redirigir si no es un familiar autenticado
    if (!isLoading && !familyMember) {
      console.log('❌ FamilyPortalLayout: No hay familiar autenticado, redirigiendo a /login')
      router.push("/login")
    }
  }, [familyMember, isLoading, router])

  // Mostrar loading mientras verifica autenticación
  if (isLoading) {
    console.log('⏳ FamilyPortalLayout: Verificando autenticación...')
    
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  // No mostrar contenido si no está autenticado
  if (!familyMember) {
    console.log('⚠️ FamilyPortalLayout: Sin familiar, no renderizar contenido')
    return null
  }

  // Usuario familiar autenticado, mostrar contenido
  console.log('✅ FamilyPortalLayout: Familiar autenticado, mostrando contenido')
  
  return (
    <>
      {/* Metadata del portal (opcional) */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Contenido de las páginas hijas */}
      {children}
    </>
  )
}