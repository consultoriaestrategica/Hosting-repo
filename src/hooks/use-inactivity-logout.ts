"use client"

import { useEffect, useCallback, useRef } from "react"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
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
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Error al cerrar sesión por inactividad:", error)
      router.push("/login")
    }
  }, [router])

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
