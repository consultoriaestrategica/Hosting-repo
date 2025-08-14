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

  const handleContractTemplateChange = (type: 'resident' | 'staff', value: string) => {
    setSettings(prev => ({ 
        ...prev, 
        contractTemplates: {
            ...prev.contractTemplates,
            [type]: value
        } 
    }));
  };

  const handleSaveChanges = (section: string) => {
    // The hook already saves on change, this is just for user feedback
    toast({
      title: "Configuración Guardada",
      description: `Los cambios en la sección de ${section} han sido guardados.`,
    })
  };

  const handleOpenUserDialog = (user: any | null = null) => {
    setEditingUser(user);
    setIsUserDialogOpen(true);
  };

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
  };
  
  if (isLoading) {
    return <div>Cargando configuración...</div>
  }

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-3xl font-bold font-headline">Configuración</h1>
      </div>
      <Tabs defaultValue="contracts" className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contracts">Contratos</TabsTrigger>
            <TabsTrigger value="users">Gestión de Usuarios</TabsTrigger>
        </TabsList>
        <TabsContent value="contracts">
          <Card>
            <CardHeader>
                <CardTitle>Configuración de Contratos de Residentes</CardTitle>
                <CardDescription>Ajuste los precios base, el IVA y la plantilla para la generación de contratos para residentes.</CardDescription>
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
              <div className="space-y-2">
                  <h3 className="text-lg font-medium">Plantilla de Contrato de Residente (Markdown)</h3>
                  <Textarea 
                      value={settings.contractTemplates.resident}
                      onChange={(e) => handleContractTemplateChange('resident', e.target.value)}
                      className="min-h-[400px] font-mono text-sm"
                  />
                  <p className="text-sm text-muted-foreground">
                      Use variables como <code className="text-xs bg-muted p-1 rounded-sm">{'{{{residentName}}}'}</code> para insertar datos dinámicos.
                  </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSaveChanges("Contratos de Residentes")}>Guardar Cambios</Button>
            </CardFooter>
          </Card>
          <Card className="mt-6">
            <CardHeader>
                <CardTitle>Configuración de Contratos de Personal</CardTitle>
                <CardDescription>Ajuste la plantilla para la generación de contratos para el personal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Plantilla de Contrato de Personal (Markdown)</h3>
                  <Textarea 
                      value={settings.contractTemplates.staff}
                      onChange={(e) => handleContractTemplateChange('staff', e.target.value)}
                      className="min-h-[400px] font-mono text-sm"
                  />
                  <p className="text-sm text-muted-foreground">
                      Use variables como <code className="text-xs bg-muted p-1 rounded-sm">{'{{{staffName}}}'}</code> para insertar datos dinámicos.
                  </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSaveChanges("Contratos de Personal")}>Guardar Cambios</Button>
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
  );
}
