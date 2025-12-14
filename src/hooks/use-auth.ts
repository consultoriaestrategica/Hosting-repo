"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import type { User } from "firebase/auth";

/**
 * Hook de autenticación centralizado
 * - Se suscribe una sola vez a onAuthStateChanged
 * - Usa auth.currentUser como estado inicial para evitar parpadeos
 */
export function useAuth() {
  // Usamos auth.currentUser como valor inicial si ya hay sesión activa
  const [user, setUser] = useState<User | null>(() => auth.currentUser);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Listener único de Firebase Auth
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
    });

    // Cleanup al desmontar
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    user,
    isLoading,
    email: user?.email ?? null,
  };
}
