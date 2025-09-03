
"use client"
import { useAuth } from "@/hooks/use-auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Este componente envuelve las páginas que quieres proteger
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Añadimos un estado para saber si ya se ha realizado la verificación inicial
  const [isInitialCheckDone, setIsInitialCheckDone] = useState(false);

  useEffect(() => {
    // Si la carga ha terminado, marcamos que la verificación se ha hecho
    if (!isLoading) {
      setIsInitialCheckDone(true);
    }
  }, [isLoading]);

  useEffect(() => {
    // Solo actuamos después de la verificación inicial
    if (!isInitialCheckDone) return;

    // Si no hay usuario y no estamos en la página de login, redirigimos
    if (!user && pathname !== "/") {
      router.push("/"); 
    }
  }, [user, isInitialCheckDone, pathname, router]);

  // Mientras se hace la comprobación inicial, mostramos un loader
  // para evitar parpadeos o mostrar contenido protegido
  if (isLoading || !isInitialCheckDone) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            Cargando...
        </div>
    );
  }
  
  // Si hay un usuario O si estamos en la página de login, mostramos el contenido
  if (user || pathname === "/") {
     return <>{children}</>;
  }

  // En cualquier otro caso (como un usuario no logueado en una ruta protegida
  // mientras se redirige), no mostramos nada para evitar contenido incorrecto.
  return null; 
}
