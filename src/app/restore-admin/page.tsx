"use client"

import { useEffect, useState } from "react"
import { collection, addDoc, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function RestoreAdminPage() {
  const [status, setStatus] = useState("Verificando...")
  const [done, setDone] = useState(false)

  useEffect(() => {
    const restore = async () => {
      try {
        // Verificar si ya existe en colección staff
        const staffRef = collection(db, "staff")
        const q = query(staffRef, where("email", "==", "prueba@hogarsanjuan.com"))
        const snapshot = await getDocs(q)

        if (!snapshot.empty) {
          setStatus("El usuario administrador ya existe en la colección staff. No se necesita restaurar.")
          setDone(true)
          return
        }

        // También verificar en colección users
        const usersRef = collection(db, "users")
        const q2 = query(usersRef, where("email", "==", "prueba@hogarsanjuan.com"))
        const snapshot2 = await getDocs(q2)

        if (!snapshot2.empty) {
          setStatus("El usuario administrador ya existe en la colección users. No se necesita restaurar.")
          setDone(true)
          return
        }

        // Crear el documento en la colección staff
        const adminData = {
          name: "Usuario Administrador",
          email: "prueba@hogarsanjuan.com",
          phone: "3001234567",
          role: "Administrador",
          position: "Administrativo",
          department: "Administración",
          isActive: true,
          hireDate: "2025-01-01",
          createdAt: new Date(),
          updatedAt: new Date(),
          permissions: [
            "manage_residents",
            "manage_staff",
            "manage_family",
            "view_reports",
            "create_reports",
            "edit_reports",
            "delete_reports",
            "manage_settings",
            "view_agenda",
            "manage_agenda",
            "access_all_modules",
          ],
        }

        await addDoc(staffRef, adminData)
        setStatus("✅ Usuario Administrador restaurado exitosamente. Ya puede iniciar sesión con prueba@hogarsanjuan.com")
        setDone(true)
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        setStatus(`❌ Error: ${msg}`)
        setDone(true)
      }
    }

    restore()
  }, [])

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>Restaurar Usuario Administrador</h1>
      <div style={{
        padding: "20px",
        borderRadius: "8px",
        background: done ? (status.includes("✅") ? "#ecfdf5" : "#fef2f2") : "#f0f9ff",
        border: `1px solid ${done ? (status.includes("✅") ? "#86efac" : "#fca5a5") : "#93c5fd"}`
      }}>
        <p style={{ fontSize: "16px" }}>{status}</p>
      </div>
      {done && status.includes("✅") && (
        <div style={{ marginTop: "20px" }}>
          <p>Ahora puede:</p>
          <ol style={{ marginTop: "10px", lineHeight: "2" }}>
            <li>Ir a <a href="/login" style={{ color: "#3b82f6", textDecoration: "underline" }}>/login</a></li>
            <li>Iniciar sesión con: <strong>prueba@hogarsanjuan.com</strong> y su contraseña</li>
            <li>Tendrá acceso completo como Administrador</li>
          </ol>
        </div>
      )}
    </div>
  )
}
