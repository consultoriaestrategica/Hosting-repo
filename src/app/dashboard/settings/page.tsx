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
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, PlusCircle, CalendarSync, CheckCircle, ExternalLink, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { collection, addDoc } from 'firebase/firestore'

export default function SettingsPage() {
  const { toast } = useToast()
  const { settings, setSettings, isLoading: settingsLoading } = useSettings()
  const { staff, addStaffMember, updateStaffMember, isLoading: staffLoading } = useStaff()
  
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Staff | null>(null);
  const [syncingUser, setSyncingUser] = useState<Staff | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const handlePriceChange = (plan: 'Habitación compartida' | 'Habitación individual', value: string) => {
    setSettings(prev => ({
        ...prev,
        prices: {
            ...prev.prices,
            [plan]: Number(value)
        }
    }));
  };

  const handleVatChange = (key: 'vatEnabled' | 'vatRate', value: boolean | number) => {
    setSettings(prev => ({
        ...prev,
        [key]: value
    }));
  };

  const handleSaveChanges = (section: string) => {
    // The hook already saves on change, this is just for user feedback
    toast({
      title: "Configuración Guardada",
      description: `Los cambios en la sección de ${section} han sido guardados.`,
    })
  };

  const handleOpenUserDialog = (user: Staff | null = null) => {
    setEditingUser(user);
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreatingUser(true);
    
    try {
      const formData = new FormData(event.currentTarget);
      const userData = Object.fromEntries(formData.entries()) as any;
      
      if (editingUser) {
        // Actualizar usuario existente
        updateStaffMember(editingUser.id, userData);
        toast({ title: "Usuario Actualizado", description: `Los datos de ${userData.name} han sido actualizados.` });
      } else {
        // Crear nuevo usuario con cuenta de Firebase Auth
        console.log('Creando nuevo usuario:', userData.email);
        
        // 1. Crear cuenta en Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          userData.email,
          userData.password
        );
        
        console.log('Usuario creado en Auth:', userCredential.user.uid);
        
        // 2. Mapear roles del formulario a roles del sistema
        const roleMapping: { [key: string]: string } = {
          'Admin': 'Administrativo',
          'Enfermera': 'Personal Asistencial',
          'Médico': 'Personal Asistencial',
          'Fisioterapeuta': 'Personal Asistencial',
          'Otro': 'Personal Asistencial'
        };
        
        const systemRole = roleMapping[userData.role] || 'Personal Asistencial';
        
        // 3. Determinar permisos según el rol
        const getPermissionsByRole = (role: string): string[] => {
          switch (role) {
            case 'Admin':
              return ['dashboard', 'residents', 'staff', 'visitors', 'reports', 'settings', 'admin'];
            case 'Enfermera':
            case 'Médico':
            case 'Fisioterapeuta':
              return ['dashboard', 'residents', 'visitors', 'daily_records'];
            default:
              return ['dashboard', 'residents'];
          }
        };
        
        // 4. Preparar datos para la base de datos
        const staffData = {
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          address: userData.address,
          role: systemRole,
          position: userData.role,
          idNumber: userData.idNumber,
          isActive: userData.status === 'Activo',
          hireDate: new Date().toISOString().split('T')[0],
          createdAt: new Date(),
          updatedAt: new Date(),
          permissions: getPermissionsByRole(userData.role),
          department: userData.role === 'Admin' ? 'Administración' : 'Cuidado',
          uid: userCredential.user.uid // Vincular con el UID de Auth
        };
        
        // 5. Decidir en qué colección guardar según el rol
        const collectionName = userData.role === 'Admin' ? 'users' : 'staff';
        
        console.log(`Guardando en colección: ${collectionName}`, staffData);
        
        // 6. Guardar en Firestore
        await addDoc(collection(db, collectionName), staffData);
        
        toast({ 
          title: "Usuario Creado", 
          description: `El usuario ${userData.name} ha sido creado con cuenta de acceso.` 
        });
        
        console.log('Usuario guardado exitosamente en la base de datos');
      }

      setIsUserDialogOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // Manejar errores específicos de Firebase Auth
      let errorMessage = 'Error al crear el usuario.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Ya existe una cuenta con este correo electrónico.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El correo electrónico no es válido.';
      }
      
      toast({ 
        variant: "destructive",
        title: "Error", 
        description: errorMessage 
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = (userId: string) => {
     // NOTE: Deleting users should be handled with care. 
     // For this app, we assume deletion is permanent and doesn't require extra confirmation.
     // In a real-world scenario, you might want to soft-delete or have a confirmation dialog.
     console.warn("Deleting user is not implemented to prevent accidental data loss.");
     toast({ variant: "destructive", title: "Acción no implementada", description: "La eliminación de usuarios está deshabilitada." });
  };
  
  const handleSyncCalendar = (user: Staff) => {
    setSyncingUser(user);
    setIsSyncDialogOpen(true);
  };
  
  const handleConfirmSync = () => {
    if (!syncingUser) return;
    
    // This is a mock action. In a real app, this would trigger an OAuth flow.
    toast({
      title: "¡Sincronización Exitosa!",
      description: `El calendario de ${syncingUser.name} ha sido vinculado.`,
    });

    setIsSyncDialogOpen(false);
    setSyncingUser(null);
  };

  if (settingsLoading || staffLoading) {
    return <div>Cargando configuración...</div>
  }

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-3xl font-bold font-headline">Configuración</h1>
      </div>
      <Tabs defaultValue="general" className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="users">Gestión de Usuarios</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <Card className="mt-4">
            <CardHeader>
                <CardTitle>Configuración General</CardTitle>
                <CardDescription>Ajuste los precios base y el IVA para los contratos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <div className="space-y-4">
                  <h3 className="text-lg font-medium">Precios por Tipo de Habitación</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                      <Label htmlFor="price-shared">Valor Habitación Compartida (COP)</Label>
                      <Input
                          id="price-shared"
                          type="number"
                          value={settings.prices['Habitación compartida']}
                          onChange={(e) => handlePriceChange('Habitación compartida', e.target.value)}
                          placeholder="2000000"
                      />
                      </div>
                      <div className="grid gap-2">
                      <Label htmlFor="price-individual">Valor Habitación Individual (COP)</Label>
                      <Input
                          id="price-individual"
                          type="number"
                          value={settings.prices['Habitación individual']}
                          onChange={(e) => handlePriceChange('Habitación individual', e.target.value)}
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
                              onCheckedChange={(checked) => handleVatChange('vatEnabled', checked)}
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
                              onChange={(e) => handleVatChange('vatRate', Number(e.target.value))}
                              placeholder="19"
                          />
                      </div>
                      )}
                  </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSaveChanges("Configuración General")}>Guardar Cambios</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="users">
          <Card>
              <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                  <CardTitle>Gestión de Usuarios</CardTitle>
                  <CardDescription>
                    Añada, edite o elimine usuarios del sistema.
                  </CardDescription>
                </div>
                  <Button size="sm" className="ml-auto gap-1" onClick={() => handleOpenUserDialog()}>
                    <PlusCircle className="h-4 w-4" />
                    Añadir Usuario
                  </Button>
              </CardHeader>
              <CardContent>
                {/* Mobile View: Card List */}
                <div className="md:hidden space-y-4">
                    {staff.length > 0 ? (
                    staff.map((user) => (
                        <div key={user.id} className="border rounded-lg p-4 flex justify-between items-start">
                            <div className="space-y-2 flex-1">
                                <p className="font-semibold">{user.name}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline">{user.role}</Badge>
                                    <Badge variant={user.isActive ? "default" : "secondary"} className={user.isActive ? "bg-green-500 text-white" : ""}>
                                        {user.isActive ? "Activo" : "Inactivo"}
                                    </Badge>
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost" className="h-8 w-8 -mt-2 -mr-2">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Menú de acciones</span>
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleOpenUserDialog(user)}>Editar</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(user.id)}>Eliminar</DropdownMenuItem>
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

                {/* Desktop View: Table */}
                <div className="hidden md:block">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Correo Electrónico</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead><span className="sr-only">Acciones</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {staff.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">
                            <div>{user.name}</div>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.role}</TableCell>
                            <TableCell>
                            <Badge variant={user.isActive ? "default" : "secondary"} className={user.isActive ? "bg-green-500 text-white" : ""}>
                                {user.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                            </TableCell>
                            <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleOpenUserDialog(user)}>Editar</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(user.id)}>Eliminar</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
              </CardContent>
            </Card>

        </TabsContent>
      </Tabs>

        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>{editingUser ? "Editar Usuario" : "Añadir Nuevo Usuario"}</DialogTitle>
                <DialogDescription>
                  {editingUser ? "Actualice los detalles del usuario." : "Complete la información para crear una nueva cuenta de acceso."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveUser}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="user-name">Nombre Completo</Label>
                      <Input id="user-name" name="name" defaultValue={editingUser?.name || ""} required />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="user-idNumber">Número de Identificación</Label>
                        <Input id="user-idNumber" name="idNumber" defaultValue={editingUser?.idNumber || ""} required />
                    </div>
                  </div>
                   <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="user-phone">Teléfono</Label>
                          <Input id="user-phone" name="phone" type="tel" defaultValue={editingUser?.phone || ""} required />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="user-email">Correo Electrónico</Label>
                          <Input id="user-email" name="email" type="email" defaultValue={editingUser?.email || ""} required />
                        </div>
                    </div>
                     
                    {/* Campo de contraseña - solo para usuarios nuevos */}
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
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    )}
                     
                     <div className="grid gap-2">
                      <Label htmlFor="user-address">Dirección</Label>
                      <Input id="user-address" name="address" defaultValue={editingUser?.address || ""} required />
                    </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="user-role">Rol</Label>
                      <Select name="role" defaultValue={editingUser?.role || "Enfermera"}>
                        <SelectTrigger id="user-role">
                          <SelectValue placeholder="Seleccione un rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Enfermera">Enfermera</SelectItem>
                          <SelectItem value="Médico">Médico</SelectItem>
                           <SelectItem value="Fisioterapeuta">Fisioterapeuta</SelectItem>
                           <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="user-status">Estado</Label>
                      <Select name="status" defaultValue={editingUser?.isActive ? "Activo" : "Inactivo"}>
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
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isCreatingUser}>
                    {isCreatingUser ? "Creando..." : (editingUser ? "Actualizar" : "Crear Usuario")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
        </Dialog>
        
        <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarSync />
                        Sincronizar con Google Calendar
                    </DialogTitle>
                    <DialogDescription>
                        Estás a punto de conectar el calendario para <strong>{syncingUser?.email}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 text-sm space-y-4">
                    <p>Para completar la sincronización, se seguirán los siguientes pasos:</p>
                    <ol className="list-decimal list-inside space-y-2 bg-muted p-4 rounded-md">
                        <li>Serás redirigido a la página de inicio de sesión de Google.</li>
                        <li>Inicia sesión con la cuenta <strong>{syncingUser?.email}</strong>.</li>
                        <li>Google te pedirá permiso para que "Ángel Guardián" pueda ver y gestionar los eventos de tu calendario.</li>
                        <li>Al aceptar, la conexión quedará establecida.</li>
                    </ol>
                    <p className="text-xs text-muted-foreground">
                        Esta aplicación podrá crear, modificar y eliminar eventos en tu Google Calendar para mantenerte informado sobre la agenda. Puedes revocar este permiso en cualquier momento desde la configuración de tu cuenta de Google.
                    </p>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                    <Button onClick={handleConfirmSync}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Autorizar en Google
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    </>
  );
}