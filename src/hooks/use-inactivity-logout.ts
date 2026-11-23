"use client"

import { useEffect, useCallback, useRef } from "react"
import { signOut } from "firebase/auth"
import { waitForPendingWrites } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

const INACTIVITY_TIMEOUT = 10 * 60 * 1000 // 10 minutos en milisegundos
const WARNING_BEFORE = 60 * 1000 // Mostrar advertencia 1 minuto antes

export function useInactivityLogout() {
  const router = useRouter()
  const { toast } = useToast()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningRef = useRef<NodeJS.Timeout | null>(null)
  const isWarningShown = useRef(false)

  const handleLogout = useCallback(async () => {
    try {
      // Si queda un borrador o un registro con la escritura todavia
      // en cola (ej. logDrafts guardandose por el autoguardado de
      // new-log-form.tsx), esperamos a que el servidor la confirme
      // antes de cerrar sesion — waitForPendingWrites() resuelve de
      // inmediato si no hay nada pendiente, y no resuelve en absoluto
      // mientras no haya conexion, lo que de hecho pospone el cierre
      // de sesion sin necesidad de un timeout explicito.
      toast({
        title: "Guardando cambios pendientes…",
        description: "La sesión se cerrará en cuanto se confirme el guardado.",
      })
      await waitForPendingWrites(db)
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Error al cerrar sesión por inactividad:", error)
      router.push("/login")
    }
  }, [router, toast])

  const showWarning = useCallback(() => {
    if (!isWarningShown.current) {
      isWarningShown.current = true
      toast({
        variant: "destructive",
        title: "Sesión por expirar",
        description: "Su sesión se cerrará en 1 minuto por inactividad. Realice cualquier acción para mantenerla activa.",
      })
    }
  }, [toast])

  const resetTimer = useCallback(() => {
    isWarningShown.current = false

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)

    warningRef.current = setTimeout(() => {
      showWarning()
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE)

    timeoutRef.current = setTimeout(() => {
      handleLogout()
    }, INACTIVITY_TIMEOUT)
  }, [handleLogout, showWarning])

  useEffect(() => {
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"]

    const handleActivity = () => {
      resetTimer()
    }

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    resetTimer()

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)
    }
  }, [resetTimer])
}
