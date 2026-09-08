"use client"

import FamilyPortalGuard from "@/components/family-portal-guard"

/**
 * Layout del Portal Familiar
 *
 * Protege todas las páginas dentro de /family-portal vía
 * FamilyPortalGuard: solo permite el acceso a familiares
 * autenticados con rol "family" válido en user_roles.
 *
 * @param {Object} props - Props del componente
 * @param {React.ReactNode} props.children - Contenido de las páginas hijas
 */
export default function FamilyPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <FamilyPortalGuard>
      {/* Metadata del portal (opcional) */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      {/* Contenido de las páginas hijas */}
      {children}
    </FamilyPortalGuard>
  )
}