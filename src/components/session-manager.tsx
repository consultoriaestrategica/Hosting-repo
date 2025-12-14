"use client"

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos
const WARNING_TIME = 5 * 60 * 1000; // Advertencia 5 minutos antes

export default function SessionManager() {
  const router = useRouter();
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = () => {
    lastActivityRef.current = Date.now();

    // Limpiar timers existentes
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    // Timer de advertencia (5 minutos antes del cierre)
    warningRef.current = setTimeout(() => {
      toast({
        title: "Sesión por expirar",
        description: "Tu sesión se cerrará en 5 minutos por inactividad. Realiza cualquier acción para mantenerla activa.",
        variant: "destructive",
      });
    }, INACTIVITY_TIMEOUT - WARNING_TIME);

    // Timer de cierre de sesión
    timeoutRef.current = setTimeout(async () => {
      try {
        await signOut(auth);
        toast({
          title: "Sesión cerrada",
          description: "Tu sesión se cerró automáticamente por inactividad.",
        });
        router.push('/');
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
      }
    }, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    // Verificar estado de autenticación en tiempo real
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Usuario deslogueado (por ejemplo, desde otra pestaña o caché limpiado)
        router.push('/');
      } else {
        // Usuario autenticado, iniciar timer
        resetTimer();
      }
    });

    // Eventos que resetean el timer de inactividad
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    const handleActivity = () => {
      const now = Date.now();
      // Solo resetear si han pasado al menos 1 segundo (evitar múltiples resets)
      if (now - lastActivityRef.current > 1000) {
        resetTimer();
      }
    };

    // Agregar listeners de actividad
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Detectar cambios de visibilidad (cambio de pestaña)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Verificar si la sesión sigue válida al volver a la pestaña
        const user = auth.currentUser;
        if (user) {
          resetTimer();
        } else {
          router.push('/');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      unsubscribeAuth();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router, toast]);

  return null; // Componente invisible
}