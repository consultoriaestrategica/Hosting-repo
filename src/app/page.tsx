
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Stethoscope, Users, HeartHandshake } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="w-full h-screen grid lg:grid-cols-2">
       <div
        className="relative hidden lg:flex flex-col items-center justify-center bg-cover bg-center text-white p-12"
        style={{ backgroundImage: "url('https://storage.googleapis.com/monjo-social/11142024-001000-q09v0n24g7.png')" }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center">
          <h1 className="text-5xl font-bold font-headline drop-shadow-md">
            HOGAR SAN JUAN
          </h1>
          <p className="mt-4 text-xl text-balance drop-shadow-md">
            Cuidado, calidez y comunidad para nuestros mayores.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 bg-gray-100 dark:bg-gray-900">
        <div className="mx-auto grid w-full max-w-md gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold font-headline text-foreground">Iniciar Sesión</h1>
            <p className="text-balance text-muted-foreground">
              Bienvenido de nuevo. Acceda a su cuenta.
            </p>
          </div>
          
            <div className="grid gap-4">
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
              </div>
            </div>
          
           <div className="mt-4 text-center text-sm">
              ¿No tienes una cuenta?{' '}
              <Link href="#" className="underline">
                Regístrate
              </Link>
            </div>
        </div>
      </div>
    </div>
  );
}
