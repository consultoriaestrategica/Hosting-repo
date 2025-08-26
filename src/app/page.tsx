
"use client"

import { useState }from "react"
import { useRouter } from "next/navigation"
import { getAuth, signInWithEmailAndPassword } from "firebase/auth"
import { app } from "@/lib/firebase"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const auth = getAuth(app);
      await signInWithEmailAndPassword(auth, email, password);
      
      toast({
        title: "Inicio de Sesión Exitoso",
        description: "Bienvenido de nuevo.",
      });

      // Redirect based on a predefined role or fetch it after login
      // For now, defaulting to admin role on successful login
      router.push("/dashboard?role=admin");

    } catch (err: any) {
      console.error("Error de autenticación:", err);
      let errorMessage = "Ocurrió un error al intentar iniciar sesión.";
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = "El correo o la contraseña son incorrectos.";
      }
       if (err.code === 'auth/invalid-email') {
        errorMessage = "El formato del correo electrónico no es válido.";
      }
      toast({
        variant: "destructive",
        title: "Error de Autenticación",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };


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
            <CardContent>
               <form onSubmit={handleLogin} className="space-y-4">
                 <div className="grid gap-2">
                    <Label htmlFor="email" className="text-white">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/20 placeholder:text-gray-300 border-white/30"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password" className="text-white">Contraseña</Label>
                    <Input 
                        id="password" 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required  
                        className="bg-white/20 placeholder:text-gray-300 border-white/30" 
                    />
                </div>
                 <div className="grid gap-2 mt-4">
                    <Button type="submit" className="w-full bg-primary/80 hover:bg-primary" disabled={isLoading}>
                       {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                       {isLoading ? "Ingresando..." : "Acceder"}
                    </Button>
                </div>
               </form>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
