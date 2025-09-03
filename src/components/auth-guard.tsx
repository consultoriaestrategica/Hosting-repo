
"use client"
import { useAuth } from "@/hooks/use-auth"; // Asumo que tienes un hook de autenticación
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Este componente envuelve las páginas que quieres proteger
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si la carga ha terminado y no hay ningún usuario, redirige al login
    if (!isLoading && !user) {
      router.push("/"); 
    }
  }, [user, isLoading, router]);

  // Si está cargando, muestra un loader para evitar mostrar contenido protegido
  if (isLoading) {
    return <div>Cargando...</div>; 
  }
  
  // Si no está cargando y hay un usuario, muestra el contenido
  if (user) {
     return <>{children}</>;
  }

  // Si no está cargando y no hay usuario, se activará el useEffect y redirigirá.
  // Mientras tanto, no se muestra nada.
  return null; 
}
