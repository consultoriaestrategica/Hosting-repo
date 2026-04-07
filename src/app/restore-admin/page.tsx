"use client"

import { useEffect, useState } from "react"
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"

export default function RestoreAdminPage() {
  const [status, setStatus] = useState<string[]>(["Verificando estado de autenticación..."])
  const [done, setDone] = useState(false)

  const addStatus = (msg: string) => {
    setStatus(prev => [...prev, msg])
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        addStatus("❌ No hay usuario autenticado. Inicie sesión primero en /login y luego vuelva a esta página.")
        setDone(true)
        return
      }

      addStatus(`✅ Usuario autenticado: ${user.email} (UID: ${user.uid})`)

      try {
        // Verificar en colección staff
        const staffRef = collection(db, "staff")
        const q1 = query(staffRef, where("email", "==", user.email))
        const snapshot1 = await getDocs(q1)

        if (!snapshot1.empty) {
          const existingDoc = snapshot1.docs[0]
          const data = existingDoc.data()
          addStatus(`📄 Documento encontrado en staff: ID=${existingDoc.id}, role=${data.role}, isActive=${data.isActive}`)

          // Verificar si tiene rol de Administrador
          if (data.role !== "Administrador") {
            addStatus(`⚠️ El rol actual es "${data.role}". Actualizando a Administrador...`)
            await updateDoc(doc(db, "staff", existingDoc.id), {
              role: "Administrador",
              position: "Administrativo",
              department: "Administración",
              isActive: true,
              uid: user.uid,
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
              updatedAt: new Date(),
            })
            addStatus("✅ Rol actualizado a Administrador exitosamente.")
          } else if (!data.uid) {
            addStatus("⚠️ El documento no tiene UID vinculado. Actualizando...")
            await updateDoc(doc(db, "staff", existingDoc.id), {
              uid: user.uid,
              isActive: true,
              updatedAt: new Date(),
            })
            addStatus("✅ UID vinculado correctamente.")
          } else if (!data.isActive) {
            addStatus("⚠️ El usuario está desactivado. Reactivando...")
            await updateDoc(doc(db, "staff", existingDoc.id), {
              isActive: true,
              updatedAt: new Date(),
            })
            addStatus("✅ Usuario reactivado.")
          } else {
            addStatus("✅ El documento ya existe y está correctamente configurado como Administrador.")
          }

          addStatus("🔄 Recargue la página principal para ver los cambios: /dashboard")
          setDone(true)
          return
        }

        addStatus("📭 No se encontró documento en staff. Creando nuevo...")

        // Crear nuevo documento
        const adminData = {
          name: "Usuario Administrador",
          email: user.email,
          phone: "3001234567",
          role: "Administrador",
          position: "Administrativo",
          department: "Administración",
          isActive: true,
          hireDate: "2025-01-01",
          createdAt: new Date(),
          updatedAt: new Date(),
          uid: user.uid,
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

        const docRef = await addDoc(staffRef, adminData)
        addStatus(`✅ Documento creado exitosamente. ID: ${docRef.id}`)
        addStatus("🔄 Recargue la página principal para ver los cambios: /dashboard")
        setDone(true)
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        addStatus(`❌ Error: ${msg}`)
        setDone(true)
      }
    })

    return () => unsubscribe()
  }, [])

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "700px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>Restaurar Usuario Administrador</h1>
      <div style={{
        padding: "20px",
        borderRadius: "8px",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
      }}>
        {status.map((msg, i) => (
          <p key={i} style={{
            fontSize: "14px",
            padding: "6px 0",
            borderBottom: i < status.length - 1 ? "1px solid #f0f0f0" : "none",
            fontFamily: "monospace",
          }}>
            {msg}
          </p>
        ))}
      </div>
      {done && (
        <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
          <a
            href="/dashboard"
            style={{
              padding: "10px 24px",
              background: "#5B8C6F",
              color: "white",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Ir al Dashboard
          </a>
          <a
            href="/login"
            style={{
              padding: "10px 24px",
              background: "#e2e8f0",
              color: "#333",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            Ir al Login
          </a>
        </div>
      )}
    </div>
  )
}
