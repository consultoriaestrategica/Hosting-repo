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
      setIsAuthenticated(!!user);

      if (!user && pathname !== "/") {
        router.push("/");
      } else if (user && pathname === "/") {
        router.push("/dashboard");
      }

      setIsLoading(false);
    }, (error) => {
      setIsAuthenticated(false);
      setIsLoading(false);

      if (pathname !== "/") {
        router.push("/");
      }
    });

    return () => {
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
    return <>{children}</>;
  }

  if (!isAuthenticated && pathname !== "/") {
    // No mostrar nada mientras redirige para evitar flash de contenido
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p className="text-muted-foreground">Redirigiendo...</p>
      </div>
    );
  }

  return <>{children}</>;
}