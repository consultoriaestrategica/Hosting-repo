"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useSettings } from "@/hooks/use-settings"
import { useStaff, Staff } from "@/hooks/use-staff"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  MoreHorizontal,
  PlusCircle,
  CalendarSync,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react"
import { useState, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth"
import { db, auth } from "@/lib/firebase"
import { authSecondary } from "@/lib/firebase-secondary"
import { collection, addDoc, deleteDoc, doc } from "firebase/firestore"
import { ROLE_PERMISSIONS, UserRole } from "@/types/user"
import FamilyMembersManagement from "./components/family-management"
import RouteGuard from "@/components/route-guard"

export default function SettingsPage() {
  const { toast } = useToast()
  const { settings, setSettings, isLoading: settingsLoading } = useSettings()
  const {
    staff,
    updateStaffMember,
    deleteStaffMember,
    isLoading: staffLoading,
  } = useStaff()

  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Staff | null>(null)
  const [syncingUser, setSyncingUser] = useState<Staff | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [usersCurrentPage, setUsersCurrentPage] = useState(1)
  const USERS_PER_PAGE = 10

  useEffect(() => {
    if (!isUserDialogOpen) {
      const cleanup = () => {
        if (!document.querySelector('[data-state="open"][role="dialog"]')) {
          document.body.style.pointerEvents = '';
          document.body.style.removeProperty('pointer-events');
          if (document.body.style.length === 0) document.body.removeAttribute('style');
        }
      };
      cleanup();
      const t1 = setTimeout(cleanup, 150);
      const t2 = setTimeout(cleanup, 500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [isUserDialogOpen]);

  useEffect(() => {
    if (!isSyncDialogOpen) {
      const cleanup = () => {
        if (!document.querySelector('[data-state="open"][role="dialog"]')) {
          document.body.style.pointerEvents = '';
          document.body.style.removeProperty('pointer-events');
          if (document.body.style.length === 0) document.body.removeAttribute('style');
        }
      };
      cleanup();
      const t1 = setTimeout(cleanup, 150);
      const t2 = setTimeout(cleanup, 500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [isSyncDialogOpen]);

  // 🔁 Mapea los valores del Select a los roles internos del sistema
  const mapRoleFromForm = (rawRole: string): UserRole => {
    const roleMap: Record<string, UserRole> = {
      Administrativo: "Administrador",
      "Líder de Enfermería": "Líder de Enfermería",
      "Personal Asistencial": "Personal de Cuidado",
    }
    return roleMap[rawRole] ?? "Personal de Cuidado"
  }

  // 🔁 Mapea el rol interno al valor que muestra el Select
  const mapRoleToForm = (role: UserRole): string => {
    const reverseMap: Record<UserRole, string> = {
      Administrador: "Administrativo",
      Supervisor: "Supervisor",
      "Líder de Enfermería": "Líder de Enfermería",
      "Personal de Cuidado": "Personal Asistencial",
      "Acceso Familiar": "Acceso Familiar",
    }
    return reverseMap[role] ?? "Personal Asistencial"
  }

  const handlePriceChange = (
    plan: "Habitación compartida" | "Habitación individual",
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      prices: {
        ...prev.prices,
        [plan]: Number(value),
      },
    }))
  }

  const handleVatChange = (key: "vatEnabled" | "vatRate", value: boolean | number) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSaveChanges = (section: string) => {
    // El hook ya guarda onChange, esto es solo feedback
    toast({
      title: "Configuración Guardada",
      description: `Los cambios en la sección de ${section} han sido guardados.`,
    })
  }

  const handleOpenUserDialog = (user: Staff | null = null) => {
    setEditingUser(user)
    setIsUserDialogOpen(true)
    setShowPassword(false)
  }

  const handleSaveUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsCreatingUser(true)

    try {
      const formData = new FormData(event.currentTarget)
      const userData = Object.fromEntries(formData.entries()) as any

      const userEmail = String(userData.email || "").trim().toLowerCase()

      // 1️⃣ Normalizamos el rol que viene del formulario
      const rawRole = userData.role as string
      const role: UserRole = mapRoleFromForm(rawRole)
      const permissions = ROLE_PERMISSIONS[role] || []
      const isAdministrative = role === "Administrador"
      const isNursingLead = role === "Líder de Enfermería"

      if (editingUser) {
        // ==========================
        // 📝 EDICIÓN DE USUARIO
        // ==========================
        const updatedData = {
          name: userData.name,
          phone: userData.phone,
          address: userData.address,
          contactEmail: userData.contactEmail || "",
          role: role,
          isActive: userData.status === "Activo",
          permissions: permissions,
          position: rawRole,
          department: isAdministrative ? "Administración" : isNursingLead ? "Enfermería" : "Cuidado",
          updatedAt: new Date(),
        }

        // ❌ Cambio de contraseña NO implementado para otros usuarios (por seguridad)
        if (userData.password && userData.password.length > 0) {
          toast({
            variant: "destructive",
            title: "Función no implementada",
            description:
              "Por seguridad, la actualización de contraseñas de otros usuarios no está permitida desde este panel. Usa recuperación de contraseña.",
          })
        }

        await updateStaffMember(editingUser.id, updatedData)

        toast({
          title: "Usuario Actualizado",
          description: `Los datos de ${userData.name} han sido actualizados.`,
        })
      } else {
        // ==========================
        // 🆕 CREACIÓN DE USUARIO
        // ==========================
        if (!userData.password || String(userData.password).length < 6) {
          throw new Error("La contraseña debe tener al menos 6 caracteres.")
        }

        // 1. Crear cuenta en Firebase Auth USANDO LA APP SECUNDARIA
        const userCredential = await createUserWithEmailAndPassword(
          authSecondary,
          userEmail,
          String(userData.password)
        )

        // 2. Definir colección según el rol interno
        const collectionName = "staff"

        const staffData = {
          name: userData.name,
          email: userEmail,
          phone: userData.phone,
          address: userData.address,
          contactEmail: userData.contactEmail || "",
          role: role, // rol interno consistente
          position: rawRole, // texto mostrado (Administrativo / Personal Asistencial)
          documentNumber: userData.idNumber,
          isActive: userData.status === "Activo",
          hireDate: new Date().toISOString().split("T")[0],
          createdAt: new Date(),
          updatedAt: new Date(),
          permissions: permissions,
          department: isAdministrative ? "Administración" : isNursingLead ? "Enfermería" : "Cuidado",
          uid: userCredential.user.uid,
        }

        await addDoc(collection(db, collectionName), staffData)

        toast({
          title: "Usuario Creado",
          description: `El usuario ${userData.name} ha sido creado con cuenta de acceso.`,
        })

      }

      setIsUserDialogOpen(false)
      setEditingUser(null)
    } catch (error: unknown) {
      console.error("Error en operación de usuario:", error)
      const code = (error as { code?: string }).code
      const errorMessage =
        error instanceof Error ? error.message :
        code === "auth/email-already-in-use" ? "Este correo electrónico ya está registrado en el sistema." :
        code === "auth/weak-password" ? "La contraseña es muy débil. Use al menos 6 caracteres." :
        code === "auth/invalid-email" ? "El correo electrónico no tiene un formato válido." :
        "No se pudo completar la operación."

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    } finally {
      setIsCreatingUser(false)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      await deleteDoc(doc(db, "staff", userId))
      toast({
        title: "Usuario eliminado",
        description: `${userName} ha sido eliminado permanentemente del sistema.`,
      })
    } catch (error) {
      console.error("Error al eliminar de staff, intentando en users:", error)
      try {
        await deleteDoc(doc(db, "users", userId))
        toast({
          title: "Usuario eliminado",
          description: `${userName} ha sido eliminado permanentemente del sistema.`,
        })
      } catch (error2) {
        console.error("Error al eliminar de users también:", error2)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo eliminar el usuario. El documento puede no existir.",
        })
      }
    }
  }

  const [isResettingPassword, setIsResettingPassword] = useState(false)

  const handleResetPassword = async (userEmail: string) => {
    setIsResettingPassword(true)
    try {
      await sendPasswordResetEmail(auth, userEmail)
      toast({
        title: "Correo enviado",
        description: `Se ha enviado un enlace de recuperación de contraseña a ${userEmail}`,
      })
    } catch (error: any) {
      console.error("Error al enviar reset de contraseña:", error)
      let errorMessage = "No se pudo enviar el correo de recuperación."
      if (error.code === "auth/user-not-found") {
        errorMessage = "No se encontró una cuenta con este correo."
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "El correo electrónico no es válido."
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleSyncCalendar = (user: Staff) => {
    setSyncingUser(user)
    setIsSyncDialogOpen(true)
  }

  const handleConfirmSync = () => {
    if (!syncingUser) return

    toast({
      title: "¡Sincronización Exitosa!",
      description: `El calendario de ${syncingUser.name} ha sido vinculado.`,
    })
    setIsSyncDialogOpen(false)
    setSyncingUser(null)
  }

  const totalUsersPages = Math.ceil(staff.length / USERS_PER_PAGE)
  const paginatedUsers = staff.slice(
    (usersCurrentPage - 1) * USERS_PER_PAGE,
    usersCurrentPage * USERS_PER_PAGE
  )

  if (settingsLoading || staffLoading) {
    return <div>Cargando configuración...</div>
  }

  return (
    <RouteGuard permission="settings">
      <div className="flex items-center">
        <h1 className="text-3xl font-bold font-headline">Configuración</h1>
      </div>

      <Tabs defaultValue="general" className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="users">Gestión de Usuarios</TabsTrigger>
          <TabsTrigger value="family">Usuarios Familiares</TabsTrigger>
        </TabsList>

        {/* ================= GENERAL ================= */}
        <TabsContent value="general">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>
                Ajuste los precios base y el IVA para los contratos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Precios por Tipo de Habitación
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price-shared">
                      Valor Habitación Compartida (COP)
                    </Label>
                    <Input
                      id="price-shared"
                      type="number"
                      value={settings.prices["Habitación compartida"]}
                      onChange={(e) =>
                        handlePriceChange("Habitación compartida", e.target.value)
                      }
                      placeholder="2000000"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price-individual">
                      Valor Habitación Individual (COP)
                    </Label>
                    <Input
                      id="price-individual"
                      type="number"
                      value={settings.prices["Habitación individual"]}
                      onChange={(e) =>
                        handlePriceChange("Habitación individual", e.target.value)
                      }
                      placeholder="3500000"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Impuestos</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="vat-enabled"
                      checked={settings.vatEnabled}
                      onCheckedChange={(checked) =>
                        handleVatChange("vatEnabled", checked)
                      }
                    />
                    <Label htmlFor="vat-enabled">Habilitar IVA</Label>
                  </div>
                  {settings.vatEnabled && (
                    <div className="grid gap-2 w-40">
                      <Label htmlFor="vat-rate">Tasa de IVA (%)</Label>
                      <Input
                        id="vat-rate"
                        type="number"
                        value={settings.vatRate}
                        onChange={(e) =>
                          handleVatChange("vatRate", Number(e.target.value))
                        }
                        placeholder="19"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Capacidad del Hogar</h3>
                <div className="grid gap-2 max-w-xs">
                  <Label htmlFor="total-beds">Número Total de Camas</Label>
                  <Input
                    id="total-beds"
                    type="number"
                    min={1}
                    value={settings.totalBeds}
                    onChange={(e) => setSettings((prev) => ({ ...prev, totalBeds: Number(e.target.value) || 1 }))}
                    placeholder="10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Este valor se usa para calcular el porcentaje de ocupación del hogar.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleSaveChanges("Configuración General")}
              >
                Guardar Cambios
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ================= GESTIÓN DE USUARIOS ================= */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>Gestión de Usuarios</CardTitle>
                <CardDescription>
                  Añada, edite o desactive usuarios del sistema.
                </CardDescription>
              </div>
              <Button
                size="sm"
                className="ml-auto gap-1"
                onClick={() => handleOpenUserDialog()}
              >
                <PlusCircle className="h-4 w-4" />
                Añadir Usuario
              </Button>
            </CardHeader>
            <CardContent>
              {/* Mobile: lista de tarjetas */}
              <div className="md:hidden space-y-4">
                {staff.length > 0 ? (
                  paginatedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="border rounded-lg p-4 flex justify-between items-start"
                    >
                      <div className="space-y-2 flex-1">
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">{user.role}</Badge>
                          <Badge
                            variant={user.isActive ? "default" : "secondary"}
                            className={
                              user.isActive ? "bg-green-500 text-white" : ""
                            }
                          >
                            {user.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 -mt-2 -mr-2"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Menú de acciones</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleOpenUserDialog(user)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPassword(user.email)}>
                            Restablecer contraseña
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              if (window.confirm(`⚠️ ELIMINAR PERMANENTEMENTE a ${user.name}?\n\nEsta acción NO se puede deshacer. Se eliminarán todos los datos del usuario.`)) {
                                handleDeleteUser(user.id, user.name)
                              }
                            }}
                          >
                            Eliminar permanentemente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No se encontraron usuarios.
                  </p>
                )}
              </div>

              {/* Desktop: tabla */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Correo Electrónico</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>
                        <span className="sr-only">Acciones</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div>{user.name}</div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                          <Badge
                            variant={user.isActive ? "default" : "secondary"}
                            className={
                              user.isActive ? "bg-green-500 text-white" : ""
                            }
                          >
                            {user.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                aria-haspopup="true"
                                size="icon"
                                variant="ghost"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Abrir menú</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleOpenUserDialog(user)}>
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResetPassword(user.email)}>
                                Restablecer contraseña
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  if (window.confirm(`⚠️ ELIMINAR PERMANENTEMENTE a ${user.name}?\n\nEsta acción NO se puede deshacer. Se eliminarán todos los datos del usuario.`)) {
                                    handleDeleteUser(user.id, user.name)
                                  }
                                }}
                              >
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
            </CardContent>
            {totalUsersPages > 1 && (
              <div className="flex items-center justify-between px-6 pb-4">
                <p className="text-sm text-muted-foreground">
                  Mostrando {Math.min((usersCurrentPage - 1) * USERS_PER_PAGE + 1, staff.length)}-{Math.min(usersCurrentPage * USERS_PER_PAGE, staff.length)} de {staff.length} usuarios
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setUsersCurrentPage(p => Math.max(1, p - 1))} disabled={usersCurrentPage === 1}>
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">Página {usersCurrentPage} de {totalUsersPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setUsersCurrentPage(p => Math.min(totalUsersPages, p + 1))} disabled={usersCurrentPage === totalUsersPages}>
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ================= USUARIOS FAMILIARES ================= */}
        <TabsContent value="family">
          <FamilyMembersManagement />
        </TabsContent>
      </Tabs>

      {/* ========== DIALOGO CREAR / EDITAR USUARIO ========== */}
      <Dialog
        open={isUserDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) setEditingUser(null)
          setIsUserDialogOpen(isOpen)
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Editar Usuario" : "Añadir Nuevo Usuario"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Actualice los detalles del usuario."
                : "Complete la información para crear una nueva cuenta de acceso."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveUser}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="user-name">Nombre Completo</Label>
                  <Input
                    id="user-name"
                    name="name"
                    defaultValue={editingUser?.name || ""}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="user-idNumber">
                    Número de Identificación
                  </Label>
                  <Input
                    id="user-idNumber"
                    name="idNumber"
                    defaultValue={(editingUser as any)?.documentNumber || ""}
                    required
                    disabled={!!editingUser}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="user-phone">Teléfono</Label>
                  <Input
                    id="user-phone"
                    name="phone"
                    type="tel"
                    defaultValue={editingUser?.phone || ""}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="user-email">Correo Electrónico</Label>
                  <Input
                    id="user-email"
                    name="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    defaultValue={editingUser?.email || ""}
                    required
                    disabled={!!editingUser}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="user-contact-email">Correo Alternativo (opcional)</Label>
                <Input
                  id="user-contact-email"
                  name="contactEmail"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  defaultValue={(editingUser as any)?.contactEmail || ""}
                />
                <p className="text-xs text-muted-foreground">
                  Correo secundario de contacto.
                </p>
              </div>

              {/* Contraseña SOLO al crear */}
              {!editingUser && (
                <div className="grid gap-2">
                  <Label htmlFor="user-password">Contraseña de Acceso</Label>
                  <div className="relative">
                    <Input
                      id="user-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="user-address">Dirección</Label>
                <Input
                  id="user-address"
                  name="address"
                  defaultValue={(editingUser as any)?.address || ""}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="user-role">Rol</Label>
                  <Select
                    name="role"
                    defaultValue={
                      editingUser ? mapRoleToForm(editingUser.role) : undefined
                    }
                  >
                    <SelectTrigger id="user-role">
                      <SelectValue placeholder="Seleccione un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Administrativo">
                        Administrativo
                      </SelectItem>
                      <SelectItem value="Líder de Enfermería">
                        Líder de Enfermería
                      </SelectItem>
                      <SelectItem value="Personal Asistencial">
                        Personal Asistencial
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="user-status">Estado</Label>
                  <Select
                    name="status"
                    defaultValue={editingUser?.isActive ? "Activo" : "Inactivo"}
                  >
                    <SelectTrigger id="user-status">
                      <SelectValue placeholder="Seleccione un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Activo">Activo</SelectItem>
                      <SelectItem value="Inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Campo de nueva contraseña SOLO visual, no implementado */}
              {editingUser && (
                <div className="grid gap-2 mt-2">
                  <Label htmlFor="user-new-password">
                    Nueva Contraseña (No implementado)
                  </Label>
                  <div className="relative">
                    <Input
                      id="user-new-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Por ahora use recuperación de contraseña"
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isCreatingUser}>
                {isCreatingUser
                  ? "Guardando..."
                  : editingUser
                  ? "Actualizar"
                  : "Crear Usuario"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========== DIALOGO SINCRONIZACIÓN CALENDARIO (mock) ========== */}
      <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarSync />
              Sincronizar con Google Calendar
            </DialogTitle>
            <DialogDescription>
              Estás a punto de conectar el calendario para{" "}
              <strong>{syncingUser?.email}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm space-y-4">
            <p>Para completar la sincronización, se seguirán los siguientes pasos:</p>
            <ol className="list-decimal list-inside space-y-2 bg-muted p-4 rounded-md">
              <li>Serás redirigido a la página de inicio de sesión de Google.</li>
              <li>
                Inicia sesión con la cuenta <strong>{syncingUser?.email}</strong>.
              </li>
              <li>
                Google te pedirá permiso para que &quot;Ángel Guardián&quot; pueda ver y
                gestionar los eventos de tu calendario.
              </li>
              <li>Al aceptar, la conexión quedará establecida.</li>
            </ol>
            <p className="text-xs text-muted-foreground">
              Esta aplicación podrá crear, modificar y eliminar eventos en tu Google
              Calendar para mantenerte informado sobre la agenda. Puedes revocar este
              permiso en cualquier momento desde la configuración de tu cuenta de Google.
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleConfirmSync}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Autorizar en Google
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RouteGuard>
  )
}
