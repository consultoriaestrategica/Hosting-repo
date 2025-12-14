"use client"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

/**
 * Componente base para la gestión de usuarios familiares.
 * Más adelante aquí conectamos con Firestore (family_members) y roles.
 */
export default function FamilyMembersManagement() {
  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center">
        <div className="space-y-1">
          <CardTitle>Usuarios Familiares</CardTitle>
          <CardDescription>
            Administre los accesos de familiares al portal Ángel Guardián.
          </CardDescription>
        </div>
        <Button size="sm" className="ml-auto gap-1">
          <PlusCircle className="h-4 w-4" />
          Añadir Familiar
        </Button>
      </CardHeader>
      <CardContent>
        {/* Placeholder - luego conectamos con Firestore */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Residente asociado</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                  La gestión de usuarios familiares está en construcción.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div className="md:hidden text-sm text-muted-foreground py-4">
          La gestión de usuarios familiares estará disponible pronto.
        </div>
      </CardContent>
    </Card>
  )
}
