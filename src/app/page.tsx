
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Stethoscope, Users, HeartHandshake } from 'lucide-react';

export default function LoginPage() {
  return (
    <div
      className="relative flex flex-col items-center justify-center w-full h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('https://storage.googleapis.com/monjo-social/11142024-001000-q09v0n24g7.png')" }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md p-6 text-white">
        <div className="grid gap-2 text-center mb-8">
            <h1 className="text-5xl font-bold font-headline drop-shadow-md">
                HOGAR SAN JUAN
            </h1>
            <p className="mt-2 text-xl text-balance drop-shadow-md">
                Cuidado, calidez y comunidad para nuestros mayores.
            </p>
        </div>
        
        <Card className="w-full bg-white/10 border-white/20 text-white">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">Iniciar Sesión</CardTitle>
                <CardDescription className="text-center text-gray-200">
                    Bienvenido de nuevo. Acceda a su cuenta.
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
                      className="bg-white/20 placeholder:text-gray-300 border-white/30"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input id="password" type="password" required  className="bg-white/20 placeholder:text-gray-300 border-white/30" />
                </div>
                 <div className="grid gap-2 mt-4">
                    <Button asChild className="w-full bg-primary/80 hover:bg-primary">
                      <Link href="/dashboard?role=admin">
                        <Users className="mr-2 h-4 w-4" /> Acceso Administrador
                      </Link>
                    </Button>
                    <Button asChild variant="secondary" className="w-full bg-secondary/80 hover:bg-secondary/90 text-secondary-foreground">
                      <Link href="/dashboard?role=staff">
                        <Stethoscope className="mr-2 h-4 w-4" /> Acceso Personal
                      </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
        
        <div className="mt-6 text-center text-sm text-gray-200">
            ¿No tienes una cuenta?{' '}
            <Link href="#" className="underline hover:text-white">
            Regístrate
            </Link>
        </div>
      </div>
    </div>
  );
}
