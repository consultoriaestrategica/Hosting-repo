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

/**
 * Gestión de usuarios familiares
 *
 * Permite:
 * - Listar familiares registrados
 * - Crear un nuevo usuario familiar asociado a un residente
 *
 * El alta utiliza useFamilyMembers.addFamilyMember, que:
 * - Crea el usuario en Firebase Auth
 * - Crea el documento en la colección family_members
 */
export default function FamilyManagement() {
  const { familyMembers, isLoading, addFamilyMember } = useFamilyMembers()
  const { residents } = useResidents()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [relationship, setRelationship] = useState("")
  const [phone, setPhone] = useState("")
  const [residentId, setResidentId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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

      setSuccess("Familiar creado correctamente. Podrá acceder desde el login en la pestaña 'Familiares'.")
      setName("")
      setEmail("")
      setPassword("")
      setRelationship("")
      setPhone("")
      setResidentId("")
    } catch (err: any) {
      setError(err.message || "No se pudo crear el familiar.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Alta de nuevo familiar */}
      <Card>
        <CardHeader>
          <CardTitle>Crear usuario familiar</CardTitle>
          <CardDescription>
            Registre un familiar y vincúlelo a un residente. Este usuario
            podrá acceder al <strong>Portal Familiar</strong> usando correo y
            contraseña en el login (pestaña &quot;Familiares&quot;).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="resident">Residente *</Label>
                <select
                  id="resident"
                  className="border rounded-md px-3 py-2 text-sm w-full"
                  value={residentId}
                  onChange={(e) => setResidentId(e.target.value)}
                >
                  <option value="">Seleccione un residente</option>
                  {residents.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nombre del familiar *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña inicial *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="relationship">Parentesco *</Label>
                <Input
                  id="relationship"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="Hijo/a, Esposo/a, Hermano/a, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            {success && (
              <p className="text-sm text-green-600">{success}</p>
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando familiar..." : "Crear familiar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Listado de familiares */}
      <Card>
        <CardHeader>
          <CardTitle>Familiares registrados</CardTitle>
          <CardDescription>
            Usuarios con acceso al Portal Familiar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Cargando familiares...
            </p>
          ) : familyMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay familiares registrados.
            </p>
          ) : (
            <div className="space-y-2">
              {familyMembers.map((f) => (
                <div
                  key={f.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between border rounded-md px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-semibold">{f.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {f.email} · {f.relationship}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Residente: {f.residentName}
                    </p>
                  </div>
                  <div className="mt-2 md:mt-0 flex items-center gap-2">
                    <Badge variant={f.isActive ? "default" : "outline"}>
                      {f.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
