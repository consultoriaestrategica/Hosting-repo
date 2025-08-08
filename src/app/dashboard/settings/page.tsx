
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

export default function SettingsPage() {
  const { toast } = useToast()

  const handleSaveChanges = (section: string) => {
    toast({
      title: "Configuración Guardada",
      description: `Los cambios en la sección de ${section} han sido guardados.`,
    })
  }

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-3xl font-bold font-headline">Configuración</h1>
      </div>

      <Tabs defaultValue="profile" className="mt-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Mi Perfil</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
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
            <Card>
                <CardHeader>
                    <CardTitle>Gestión de Usuarios</CardTitle>
                    <CardDescription>
                        Añada, edite o elimine usuarios del sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">La gestión detallada de usuarios estará disponible en una futura actualización.</p>
                    {/* Aquí se podría agregar una tabla de usuarios en el futuro */}
                </CardContent>
                 <CardFooter>
                    <Button disabled>Añadir Usuario (Próximamente)</Button>
                </CardFooter>
            </Card>
        </TabsContent>

      </Tabs>
    </>
  )
}
