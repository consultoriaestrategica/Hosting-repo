"use client"
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Listener en tiempo real del estado de autenticación
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("🔐 AuthGuard: Estado de autenticación cambió", {
        user: user?.email,
        pathname,
        isAuthenticated: !!user
      });

      setIsAuthenticated(!!user);
      
      if (!user && pathname !== "/") {
        // Usuario no autenticado intentando acceder a ruta protegida
        console.log("⚠️ AuthGuard: Redirigiendo a login - usuario no autenticado");
        router.push("/");
      } else if (user && pathname === "/") {
        // Usuario autenticado en página de login, redirigir a dashboard
        console.log("✅ AuthGuard: Redirigiendo a dashboard - usuario ya autenticado");
        router.push("/dashboard");
      }
      
      setIsLoading(false);
    }, (error) => {
      // Manejo de errores en la verificación de auth
      console.error("❌ AuthGuard: Error en verificación de auth:", error);
      setIsAuthenticated(false);
      setIsLoading(false);
      
      // Si hay error y no estamos en login, redirigir
      if (pathname !== "/") {
        router.push("/");
      }
    });

    // Cleanup del listener cuando el componente se desmonta
    return () => {
      console.log("🧹 AuthGuard: Limpiando listener de auth");
      unsubscribe();
    };
  }, [router, pathname]);

  // Pantalla de carga mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-background"></div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-foreground">Verificando sesión...</p>
            <p className="text-sm text-muted-foreground">Por favor espera un momento</p>
          </div>
        </div>
      </div>
    );
  }

  // Permitir acceso a la página de login sin autenticación
  if (!isAuthenticated && pathname === "/") {
    console.log("✅ AuthGuard: Mostrando página de login");
    return <>{children}</>;
  }

  // Requerir autenticación para rutas protegidas (dashboard)
  if (!isAuthenticated && pathname !== "/") {
    console.log("⚠️ AuthGuard: Bloqueando acceso - esperando redirección");
    // No mostrar nada mientras redirige para evitar flash de contenido
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p className="text-muted-foreground">Redirigiendo...</p>
      </div>
    );
  }

  // Usuario autenticado, mostrar contenido protegido
  console.log("✅ AuthGuard: Usuario autenticado, mostrando contenido");
  return <>{children}</>;
}