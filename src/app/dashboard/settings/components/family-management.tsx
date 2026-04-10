"use client"

import { useState, FormEvent } from "react"
import { useFamilyMembers } from "@/hooks/use-family-members"
import { useResidents } from "@/hooks/use-residents"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Trash2, UserCircle, Mail, Phone, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function FamilyManagement() {
  const { familyMembers, isLoading, addFamilyMember, deleteFamilyMember } = useFamilyMembers()
  const { residents } = useResidents()
  const { toast } = useToast()

  // Form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [relationship, setRelationship] = useState("")
  const [phone, setPhone] = useState("")
  const [residentId, setResidentId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10
  const totalPages = Math.ceil(familyMembers.length / ITEMS_PER_PAGE)
  const paginatedMembers = familyMembers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!name || !email || !password || !residentId || !relationship) {
      setError("Todos los campos marcados con * son obligatorios.")
      return
    }

    const resident = residents.find((r) => r.id === residentId)
    if (!resident) {
      setError("Debe seleccionar un residente válido.")
      return
    }

    try {
      setIsSubmitting(true)
      await addFamilyMember(
        {
          email,
          name,
          residentId: resident.id,
          residentName: resident.name,
          relationship,
          phone: phone || undefined,
          isActive: true,
        },
        password
      )
      setSuccess("Familiar creado correctamente.")
      toast({ title: "Familiar creado", description: `${name} puede acceder al Portal Familiar.` })
      setName("")
      setEmail("")
      setPassword("")
      setRelationship("")
      setPhone("")
      setResidentId("")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo crear el familiar."
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteFamilyMember(deleteTarget.id)
      toast({
        title: "Familiar eliminado",
        description: `${deleteTarget.name} ha sido eliminado del sistema.`,
      })
    } catch (error) {
      console.error("Error eliminando familiar:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el familiar.",
      })
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Formulario de alta */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Crear usuario familiar</CardTitle>
          <CardDescription>
            Registre un familiar y vincúlelo a un residente. Podrá acceder al{" "}
            <strong>Portal Familiar</strong> con su correo y contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Residente *</Label>
                <Select value={residentId} onValueChange={setResidentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un residente" />
                  </SelectTrigger>
                  <SelectContent>
                    {residents
                      .filter((r) => r.status === "Activo")
                      .map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nombre del familiar *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo" />
              </div>

              <div className="space-y-2">
                <Label>Correo electrónico *</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" />
              </div>

              <div className="space-y-2">
                <Label>Contraseña inicial *</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
              </div>

              <div className="space-y-2">
                <Label>Parentesco *</Label>
                <Select value={relationship} onValueChange={setRelationship}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione parentesco" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hijo/a">Hijo/a</SelectItem>
                    <SelectItem value="Esposo/a">Esposo/a</SelectItem>
                    <SelectItem value="Hermano/a">Hermano/a</SelectItem>
                    <SelectItem value="Nieto/a">Nieto/a</SelectItem>
                    <SelectItem value="Sobrino/a">Sobrino/a</SelectItem>
                    <SelectItem value="Cuñado/a">Cuñado/a</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Opcional" />
              </div>
            </div>

            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
            {success && <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{success}</p>}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando..." : "Crear familiar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Listado de familiares */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Familiares registrados</CardTitle>
          <CardDescription>
            {familyMembers.length} usuario(s) con acceso al Portal Familiar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : familyMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No hay familiares registrados.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Use el formulario de arriba para crear el primero.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedMembers.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-start sm:items-center justify-between gap-3 border rounded-xl p-4 bg-card"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                        <UserCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="font-semibold text-sm truncate">{f.name || "Sin nombre"}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {f.email}
                          </span>
                          {f.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {f.phone}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {f.relationship} de{" "}
                          <Link
                            href={`/dashboard/residents/${f.residentId}/`}
                            className="font-medium text-primary hover:underline"
                          >
                            {f.residentName}
                          </Link>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={f.isActive ? "default" : "secondary"}
                        className={f.isActive ? "bg-green-600 text-white" : ""}
                      >
                        {f.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget({ id: f.id, name: f.name })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, familyMembers.length)}-
                    {Math.min(currentPage * ITEMS_PER_PAGE, familyMembers.length)} de{" "}
                    {familyMembers.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">{currentPage} de {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
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
              Se eliminará a <strong>{deleteTarget?.name}</strong> del sistema.
              Perderá su acceso al Portal Familiar. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
