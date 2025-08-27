
"use client"

import { useState }from "react"
import { useRouter } from "next/navigation"
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { app, db } from "@/lib/firebase"

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
    const auth = getAuth(app);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      toast({
        title: "Inicio de Sesión Exitoso",
        description: "Bienvenido de nuevo.",
      });
      
      router.push(`/dashboard`);

    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        // If user not found, try to create a new one. This is for demo purposes.
        try {
            await createUserWithEmailAndPassword(auth, email, password);

            // Add an admin user to the staff collection as well
            await addDoc(collection(db, "staff"), {
                name: "Administrador",
                email: email,
                role: 'Administrativo',
                status: 'Activo',
                hireDate: new Date().toISOString().split('T')[0],
                idNumber: '00000000',
                phone: '00000000',
                address: 'N/A'
            });

            toast({
                title: "Cuenta de Administrador Creada",
                description: "Se ha creado una nueva cuenta de administrador para ti. Serás redirigido.",
            });
            router.push('/dashboard');
        } catch (createErr: any) {
            let createErrorMessage = "No se pudo crear la cuenta. Intente con una contraseña más segura.";
            if (createErr.code === 'auth/email-already-in-use') {
                 createErrorMessage = "El correo o la contraseña son incorrectos.";
            }
             toast({
                variant: "destructive",
                title: "Error de Creación de Cuenta",
                description: createErrorMessage,
            });
        }
      } else {
         let errorMessage = "Ocurrió un error al intentar iniciar sesión.";
         if (err.code === 'auth/invalid-email') {
            errorMessage = "El formato del correo electrónico no es válido.";
         }
         if (err.code === 'auth/wrong-password') {
            errorMessage = "El correo o la contraseña son incorrectos.";
         }
          toast({
            variant: "destructive",
            title: "Error de Autenticación",
            description: errorMessage,
          });
      }
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
