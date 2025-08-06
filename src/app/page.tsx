
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Stethoscope, Users, HeartHandshake } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-[400px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold font-headline">Ángel Guardián</h1>
            <p className="text-balance text-muted-foreground">
              Ingrese sus credenciales para acceder al portal
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Iniciar Sesión</CardTitle>
              <CardDescription>
                Seleccione su rol para iniciar sesión.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@ejemplo.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Contraseña</Label>
                </div>
                <Input id="password" type="password" required />
              </div>
              <div className="grid gap-2 mt-4">
                 <Button asChild className="w-full">
                  <Link href="/dashboard?role=admin">
                    <Users className="mr-2 h-4 w-4" /> Acceso Administrador
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="w-full">
                  <Link href="/dashboard?role=staff">
                    <Stethoscope className="mr-2 h-4 w-4" /> Acceso Personal
                  </Link>
                </Button>
                 <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard?role=family">
                    <HeartHandshake className="mr-2 h-4 w-4" /> Acceso Familiares
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
           <div className="mt-4 text-center text-sm">
              ¿No tienes una cuenta?{' '}
              <Link href="#" className="underline">
                Regístrate
              </Link>
            </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <Image
          src="https://placehold.co/1200x900.png"
          alt="Cuidado de ancianos"
          data-ai-hint="caregiver elderly"
          width="1200"
          height="900"
          className="h-full w-full object-cover dark:brightness-[0.3]"
        />
      </div>
    </div>
  );
}
