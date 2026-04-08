"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function LimpiarPage() {
  const [status, setStatus] = useState<string[]>(["Iniciando limpieza..."])
  const [done, setDone] = useState(false)

  const addStatus = (msg: string) => setStatus(prev => [...prev, msg])

  useEffect(() => {
    const clean = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"))
        addStatus(`Encontrados ${usersSnap.size} documentos en colección "users"`)

        for (const docSnap of usersSnap.docs) {
          const data = docSnap.data()
          addStatus(`Eliminando: ${data.name} (${data.email}) - ID: ${docSnap.id}`)
          try {
            await deleteDoc(doc(db, "users", docSnap.id))
            addStatus(`✅ Eliminado: ${docSnap.id}`)
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error)
            addStatus(`❌ Error eliminando ${docSnap.id}: ${msg}`)
          }
        }

        addStatus("--- Limpieza completada ---")
        setDone(true)
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        addStatus(`❌ Error general: ${msg}`)
        setDone(true)
      }
    }
    clean()
  }, [])

  return (
    <div style={{padding: "40px", fontFamily: "monospace", maxWidth: "700px"}}>
      <h1 style={{fontSize: "20px", marginBottom: "20px"}}>Limpieza de Datos Duplicados</h1>
      {status.map((msg, i) => (
        <p key={i} style={{fontSize: "13px", padding: "4px 0", borderBottom: "1px solid #eee"}}>{msg}</p>
      ))}
      {done && (
        <a href="/dashboard/settings/" style={{display: "inline-block", marginTop: "20px", padding: "10px 24px", background: "#5B8C6F", color: "white", borderRadius: "8px", textDecoration: "none"}}>
          Ir a Configuración
        </a>
      )}
    </div>
  )
}
