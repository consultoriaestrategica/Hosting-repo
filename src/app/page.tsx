
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useResidents } from "@/hooks/use-residents"
import { Loader2 } from "lucide-react"


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { residents } = useResidents();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [residentId, setResidentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFamilyLoading, setIsFamilyLoading] = useState(false);

  const handleStaffLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    const auth = getAuth(app);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Inicio de Sesión Exitoso",
        description: "Bienvenido de nuevo.",
      });
      router.push(`/dashboard`);

    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            await addDoc(collection(db, "staff"), {
                name: "Administrador",
                email: email,
                role: 'Admin',
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
         if (err.code === 'wrong-password') {
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

  const handleFamilyLogin = (event: React.FormEvent) => {
    event.preventDefault();
    setIsFamilyLoading(true);
    
    // This is a mock login. In a real app, you'd want more secure auth.
    const foundResident = residents.find(r => r.idNumber === residentId);

    setTimeout(() => {
        if (foundResident) {
            toast({
                title: "Acceso Correcto",
                description: `Mostrando el perfil de ${foundResident.name}.`,
            });
            router.push(`/dashboard/residents/${foundResident.id}`);
        } else {
            toast({
                variant: "destructive",
                title: "Residente no Encontrado",
                description: "No se encontró ningún residente con esa cédula. Por favor, verifique el número.",
            });
        }
        setIsFamilyLoading(false);
    }, 1000); // Simulate network delay
  }


  return (
    <div
      className="relative flex flex-col items-center justify-center w-full h-screen bg-gray-500"
    >
      <div className="absolute inset-0 bg-gray-700/50 backdrop-blur-sm" />
      
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md p-6 text-white">
        <div className="grid gap-2 text-center mb-8">
            <h1 className="text-5xl font-bold font-headline drop-shadow-md">
                HOGAR SAN JUAN
            </h1>
            <p className="mt-2 text-xl text-balance drop-shadow-md">
                Cuidado, calidez y comunidad para nuestros mayores.
            </p>
        </div>
        
        <Card className="w-full bg-black/10 border-white/20 text-white backdrop-blur-lg">
            <Tabs defaultValue="admin">
                <TabsList className="grid w-full grid-cols-3 bg-transparent/20">
                    <TabsTrigger value="admin">Administrador</TabsTrigger>
                    <TabsTrigger value="staff">Personal Asistencial</TabsTrigger>
                    <TabsTrigger value="family">Acceso Familiar</TabsTrigger>
                </TabsList>
                <TabsContent value="admin">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-center">Acceso Administrador</CardTitle>
                        <CardDescription className="text-center text-gray-300">
                            Inicie sesión para gestionar el sistema.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <form onSubmit={handleStaffLogin} className="space-y-4">
                         <div className="grid gap-2">
                            <Label htmlFor="admin-email" className="text-white">Correo Electrónico</Label>
                            <Input
                              id="admin-email"
                              type="email"
                              placeholder="admin@ejemplo.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className="bg-white/20 placeholder:text-gray-300 border-white/30"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="admin-password" className="text-white">Contraseña</Label>
                            <Input 
                                id="admin-password" 
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
                               {isLoading ? "Ingresando..." : "Acceder como Admin"}
                            </Button>
                        </div>
                       </form>
                    </CardContent>
                </TabsContent>
                 <TabsContent value="staff">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-center">Acceso Personal Asistencial</CardTitle>
                        <CardDescription className="text-center text-gray-300">
                           Inicie sesión con sus credenciales.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <form onSubmit={handleStaffLogin} className="space-y-4">
                         <div className="grid gap-2">
                            <Label htmlFor="staff-email" className="text-white">Correo Electrónico</Label>
                            <Input
                              id="staff-email"
                              type="email"
                              placeholder="personal@ejemplo.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className="bg-white/20 placeholder:text-gray-300 border-white/30"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="staff-password" className="text-white">Contraseña</Label>
                            <Input 
                                id="staff-password" 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required  
                                className="bg-white/20 placeholder:text-gray-300 border-white/30" 
                            />
                        </div>
                         <div className="grid gap-2 mt-4">
                            <Button type="submit" className="w-full bg-secondary/80 hover:bg-secondary" disabled={isLoading}>
                               {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                               {isLoading ? "Ingresando..." : "Acceder como Personal"}
                            </Button>
                        </div>
                       </form>
                    </CardContent>
                </TabsContent>
                <TabsContent value="family">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-center">Familiares y Acudientes</CardTitle>
                        <CardDescription className="text-center text-gray-300">
                            Ingrese la cédula del residente para ver su perfil.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <form onSubmit={handleFamilyLogin} className="space-y-4">
                         <div className="grid gap-2">
                            <Label htmlFor="resident-id" className="text-white">Cédula del Residente</Label>
                            <Input
                              id="resident-id"
                              type="text"
                              placeholder="Número de identificación"
                              value={residentId}
                              onChange={(e) => setResidentId(e.target.value)}
                              required
                              className="bg-white/20 placeholder:text-gray-300 border-white/30"
                            />
                        </div>
                         <div className="grid gap-2 mt-4">
                            <Button type="submit" className="w-full bg-accent/80 hover:bg-accent" disabled={isFamilyLoading}>
                               {isFamilyLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                               {isFamilyLoading ? "Buscando..." : "Consultar"}
                            </Button>
                        </div>
                       </form>
                    </CardContent>
                </TabsContent>
            </Tabs>
        </Card>
      </div>
    </div>
  );
}
