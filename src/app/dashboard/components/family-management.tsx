"use client"

import { useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Trash2, Users, Mail, Phone, UserCircle } from "lucide-react"
import { useFamilyMembers } from "@/hooks/use-family-members"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function FamilyMembersManagement() {
  const { familyMembers, isLoading, deleteFamilyMember } = useFamilyMembers()
  const { toast } = useToast()
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const ITEMS_PER_PAGE = 10

  const activeFamilyMembers = familyMembers.filter((m) => m.isActive !== false)
  const totalPages = Math.ceil(activeFamilyMembers.length / ITEMS_PER_PAGE)
  const paginatedMembers = activeFamilyMembers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleDeleteFamilyMember = async () => {
    if (!deleteTarget) return
    try {
      await deleteFamilyMember(deleteTarget.id)
      toast({
        title: "Familiar eliminado",
        description: `${deleteTarget.name} ha sido eliminado permanentemente del sistema.`,
      })
    } catch (error) {
      console.error("Error al eliminar familiar:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el familiar.",
      })
    } finally {
      setDeleteTarget(null)
    }
  }

  if (isLoading) {
    return (
      <Card className="mt-4">
        <CardContent className="py-8">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="mt-4">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-xl">Familiares Registrados</CardTitle>
              <CardDescription>
                Usuarios con acceso al Portal Familiar. Total: {activeFamilyMembers.length} familiar(es).
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeFamilyMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-base font-semibold text-muted-foreground">Sin familiares registrados</h3>
              <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm">
                Los familiares se registran desde la pestaña &quot;Contactos&quot; en el perfil de cada residente.
              </p>
            </div>
          ) : (
            <>
              {/* Vista mobile */}
              <div className="md:hidden space-y-3">
                {paginatedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="border rounded-xl p-4 space-y-3 bg-card shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserCircle className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{member.name || "Sin nombre"}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.relationship}</p>
                        </div>
                      </div>
                      <Badge
                        variant={member.isActive ? "default" : "secondary"}
                        className={member.isActive ? "bg-green-600 text-white shrink-0" : "shrink-0"}
                      >
                        {member.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 shrink-0" />
                        <span>
                          Residente:{" "}
                          <Link
                            href={`/dashboard/residents/${member.residentId}/`}
                            className="font-medium text-primary hover:underline"
                          >
                            {member.residentName}
                          </Link>
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget({ id: member.id, name: member.name })}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Vista desktop */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Correo</TableHead>
                      <TableHead>Residente</TableHead>
                      <TableHead>Parentesco</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[70px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name || "Sin nombre"}</TableCell>
                        <TableCell className="text-sm">{member.email}</TableCell>
                        <TableCell>
                          <Link
                            href={`/dashboard/residents/${member.residentId}/`}
                            className="text-primary hover:underline text-sm"
                          >
                            {member.residentName}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm">{member.relationship}</TableCell>
                        <TableCell className="text-sm">{member.phone || "—"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={member.isActive ? "default" : "secondary"}
                            className={member.isActive ? "bg-green-600 text-white" : ""}
                          >
                            {member.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteTarget({ id: member.id, name: member.name })}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar permanentemente
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, activeFamilyMembers.length)}-
                    {Math.min(currentPage * ITEMS_PER_PAGE, activeFamilyMembers.length)} de{" "}
                    {activeFamilyMembers.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar familiar permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará a <strong>{deleteTarget?.name}</strong> del sistema.
              Perderá acceso al Portal Familiar y esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFamilyMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
