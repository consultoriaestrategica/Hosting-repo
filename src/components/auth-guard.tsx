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

  // Si está cargando o el usuario existe, muestra el contenido de la página
  if (isLoading || user) {
    return <>{children}</>;
  }

  // Mientras redirige, no muestra nada o un spinner de carga
  return <div>Cargando...</div>; 
}
