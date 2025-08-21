
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Stethoscope, Users, HeartHandshake } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="w-full h-screen relative">
      <Image
        src="https://storage.googleapis.com/monjo-social/11142024-001000-q09v0n24g7.png"
        alt="Bienvenido a su Hogar"
        layout="fill"
        objectFit="cover"
        className="dark:brightness-[0.7]"
      />
      <div className="absolute inset-0 bg-black/40" />
      
      <div className="absolute top-0 right-0 h-full w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="mx-auto grid w-full max-w-md gap-6 rounded-xl bg-white/10 backdrop-blur-sm p-8 shadow-2xl">
          <div className="grid gap-2 text-center text-white">
            <h1 className="text-4xl font-bold font-headline">HOGAR SAN JUAN</h1>
            <p className="text-balance text-gray-200">
              Cuidado, calidez y comunidad para nuestros mayores.
            </p>
          </div>
          
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-white">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@ejemplo.com"
                  required
                  className="bg-white/80 text-black placeholder:text-gray-600"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password" className="text-white">Contraseña</Label>
                </div>
                <Input id="password" type="password" required  className="bg-white/80 text-black"/>
              </div>
              <div className="grid gap-2 mt-4">
                 <Button asChild className="w-full bg-primary/80 hover:bg-primary">
                  <Link href="/dashboard?role=admin">
                    <Users className="mr-2 h-4 w-4" /> Acceso Administrador
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="w-full bg-secondary/80 hover:bg-secondary">
                  <Link href="/dashboard?role=staff">
                    <Stethoscope className="mr-2 h-4 w-4" /> Acceso Personal
                  </Link>
                </Button>
              </div>
            </div>
          
           <div className="mt-4 text-center text-sm text-gray-200">
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
