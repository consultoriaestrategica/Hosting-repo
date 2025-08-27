"use client"
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Asegúrate de que la ruta a tu config de Firebase sea correcta

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged es el escuchador de Firebase que nos dice
    // si el estado de autenticación ha cambiado (login o logout).
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });

    // Limpiamos el escuchador cuando el componente se desmonta
    // para evitar problemas de memoria.
    return () => unsubscribe();
  }, []);

  return { user, isLoading };
}