
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
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"

// Mock data for users - replace with actual data fetching hook later
const initialUsers = [
  { id: "user-1", name: "Admin", username: "admin", email: "admin@guardianangel.com", role: "Admin", status: "Activo", idType: "C.C.", idNumber: "12345678", phone: "3001234567" },
  { id: "user-2", name: "Enfermera Ana", username: "anap", email: "ana.p@guardianangel.com", role: "Personal", status: "Activo", idType: "C.C.", idNumber: "87654321", phone: "3011234567" },
  { id: "user-3", name: "Juan Rodriguez", username: "juanr", email: "juan.r@example.com", role: "Familiar", status: "Activo", idType: "C.E.", idNumber: "11223344", phone: "3021234567" },
  { id: "user-4", name: "Carlos Parra", username: "carlosp", email: "carlos.p@guardianangel.com", role: "Personal", status: "Inactivo", idType: "C.C.", idNumber: "44332211", phone: "3031234567" },
];


export default function SettingsPage() {
  const { toast } = useToast()
  const { settings, setSettings, isLoading } = useSettings()
  const [users, setUsers] = useState(initialUsers);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  const handlePriceChange = (plan: 'Básica' | 'Premium', value: string) => {
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

  const handleContractTemplateChange = (value: string) => {
    setSettings(prev => ({ ...prev, contractTemplate: value }));
  }

  const handleSaveChanges = (section: string) => {
    // The hook already saves on change, this is just for user feedback
    toast({
      title: "Configuración Guardada",
      description: `Los cambios en la sección de ${section} han sido guardados.`,
    })
  }

  const handleOpenUserDialog = (user: any | null = null) => {
    setEditingUser(user);
    setIsUserDialogOpen(true);
  }

  const handleSaveUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const userData = Object.fromEntries(formData.entries());

    if (editingUser) {
      // Edit user logic
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...userData } : u));
      toast({ title: "Usuario Actualizado", description: `Los datos de ${userData.name} han sido actualizados.` });
    } else {
      // Add user logic
      const newUser = { id: `user-${Date.now()}`, ...userData };
      setUsers([...users, newUser as any]);
      toast({ title: "Usuario Creado", description: `El usuario ${userData.name} ha sido añadido.` });
    }

    setIsUserDialogOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string) => {
     setUsers(users.filter(u => u.id !== userId));
     toast({ variant: "destructive", title: "Usuario Eliminado", description: "El usuario ha sido eliminado del sistema." });
  }

  if (isLoading) {
    return <div>Cargando configuración...</div>
  }


  return (
    <>
      <div className="flex items-center">
        <h1 className="text-3xl font-bold font-headline">Configuración</h1>
      </div>

      <Tabs defaultValue="profile" className="mt-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile">Mi Perfil</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="pricing">Precios</TabsTrigger>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Mi Perfil</CardTitle>
              <CardDescription>
                Actualice su información personal y contraseña.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="profile-name">Nombre</Label>
                    <Input id="profile-name" defaultValue="Admin" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="profile-email">Correo Electrónico</Label>
                    <Input id="profile-email" type="email" defaultValue="admin@guardianangel.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="profile-password">Nueva Contraseña</Label>
                    <Input id="profile-password" type="password" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="profile-password-confirm">Confirmar Contraseña</Label>
                    <Input id="profile-password-confirm" type="password" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSaveChanges("Mi Perfil")}>Guardar Cambios</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>
                Personalice la apariencia y la información del centro.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="center-name">Nombre del Centro Geriátrico</Label>
                <Input id="center-name" defaultValue="Hogar Geriátrico Ángel Guardián" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="theme">Tema de la Aplicación</Label>
                <Select defaultValue="light">
                    <SelectTrigger id="theme">
                        <SelectValue placeholder="Seleccione un tema" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Oscuro</SelectItem>
                         <SelectItem value="system">Automático (del sistema)</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSaveChanges("Configuración General")}>Guardar Cambios</Button>
            </CardFooter>
          </Card>
        </TabsContent>

         <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>Precios y Facturación</CardTitle>
              <CardDescription>
                Defina los precios de los planes y la configuración de impuestos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium mb-4">Precios de Planes Mensuales</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price-basica">Plan Básico (COP)</Label>
                            <Input id="price-basica" type="number" value={settings.prices['Básica']} onChange={(e) => handlePriceChange('Básica', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price-premium">Plan Premium (COP)</Label>
                            <Input id="price-premium" type="number" value={settings.prices['Premium']} onChange={(e) => handlePriceChange('Premium', e.target.value)} />
                        </div>
                    </div>
                </div>
                 <div>
                    <h3 className="text-lg font-medium mb-4">Impuestos</h3>
                     <div className="flex items-start justify-between rounded-lg border p-4">
                        <div>
                            <Label htmlFor="vat-enabled">Habilitar IVA</Label>
                            <p className="text-sm text-muted-foreground">Aplicar IVA al valor total del contrato.</p>
                        </div>
                        <Switch id="vat-enabled" checked={settings.vatEnabled} onCheckedChange={(checked) => handleVatChange('vatEnabled', checked)} />
                    </div>
                     {settings.vatEnabled && (
                        <div className="space-y-2 mt-4">
                            <Label htmlFor="vat-rate">Porcentaje de IVA (%)</Label>
                            <Input id="vat-rate" type="number" value={settings.vatRate} onChange={(e) => handleVatChange('vatRate', Number(e.target.value))} />
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSaveChanges("Precios y Facturación")}>Guardar Cambios</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="contracts">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Contratos</CardTitle>
              <CardDescription>
                Edite la plantilla base que utiliza la IA para generar los contratos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-2">
                  <Label htmlFor="contract-template">Plantilla del Contrato</Label>
                  <p className="text-sm text-muted-foreground">
                    Modifique el texto usando Markdown. Las variables entre `{{{llaves}}}` serán reemplazadas por la IA.
                  </p>
                  <Textarea 
                    id="contract-template"
                    className="min-h-[50vh] font-mono text-xs"
                    value={settings.contractTemplate}
                    onChange={(e) => handleContractTemplateChange(e.target.value)}
                  />
               </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSaveChanges("Contratos")}>Guardar Plantilla</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
           <Card>
            <CardHeader>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>
                Gestione cómo y cuándo se envían las alertas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                        <Label htmlFor="emergency-email">Alertas de Emergencia por Correo</Label>
                        <p className="text-sm text-muted-foreground">Enviar un correo electrónico al contacto familiar principal.</p>
                    </div>
                    <Switch id="emergency-email" defaultChecked />
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                        <Label htmlFor="emergency-whatsapp">Alertas de Emergencia por WhatsApp</Label>
                        <p className="text-sm text-muted-foreground">Enviar un mensaje de WhatsApp al contacto familiar principal.</p>
                    </div>
                    <Switch id="emergency-whatsapp" defaultChecked />
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                        <Label htmlFor="report-summary">Resumen Diario de Reportes</Label>
                         <p className="text-sm text-muted-foreground">Enviar un resumen al final del día al correo del administrador.</p>
                    </div>
                    <Switch id="report-summary" />
                </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSaveChanges("Notificaciones")}>Guardar Cambios</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="users">
            <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                <Card>
                    <CardHeader className="flex flex-row items-center">
                        <div className="grid gap-2">
                            <CardTitle>Gestión de Usuarios</CardTitle>
                            <CardDescription>
                                Añada, edite o elimine usuarios del sistema.
                            </CardDescription>
                        </div>
                        <DialogTrigger asChild>
                             <Button size="sm" className="ml-auto gap-1" onClick={() => handleOpenUserDialog()}>
                                <PlusCircle className="h-4 w-4" />
                                Añadir Usuario
                             </Button>
                        </DialogTrigger>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Nombre de Usuario</TableHead>
                                    <TableHead>Identificación</TableHead>
                                    <TableHead>Correo Electrónico</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead><span className="sr-only">Acciones</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.username}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{`${user.idType} ${user.idNumber}`}</div>
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.role}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.status === "Activo" ? "default" : "secondary"} className={user.status === "Activo" ? "bg-green-500 text-white" : ""}>
                                                {user.status}
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
                    </CardContent>
                </Card>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editingUser ? "Editar Usuario" : "Añadir Nuevo Usuario"}</DialogTitle>
                        <DialogDescription>
                           {editingUser ? "Actualice los detalles del usuario." : "Complete la información para crear una nueva cuenta."}
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
                                    <Label htmlFor="user-username">Nombre de Usuario</Label>
                                    <Input id="user-username" name="username" defaultValue={editingUser?.username || ""} required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                     <Label htmlFor="user-idType">Tipo de Identificación</Label>
                                    <Select name="idType" defaultValue={editingUser?.idType || "C.C."}>
                                        <SelectTrigger id="user-idType">
                                            <SelectValue placeholder="Seleccione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="C.C.">Cédula de Ciudadanía</SelectItem>
                                            <SelectItem value="C.E.">Cédula de Extranjería</SelectItem>
                                            <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                                            <SelectItem value="Otro">Otro</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                             <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="user-role">Rol</Label>
                                    <Select name="role" defaultValue={editingUser?.role || "Personal"}>
                                        <SelectTrigger id="user-role">
                                            <SelectValue placeholder="Seleccione un rol" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Admin">Admin</SelectItem>
                                            <SelectItem value="Personal">Personal</SelectItem>
                                            <SelectItem value="Familiar">Familiar</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="user-status">Estado</Label>
                                    <Select name="status" defaultValue={editingUser?.status || "Activo"}>
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
                            <Button type="submit">Guardar Cambios</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </TabsContent>

      </Tabs>
    </>
  )
}
