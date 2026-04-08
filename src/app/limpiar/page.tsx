"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"

export default function LimpiarPage() {
  const [staffDocs, setStaffDocs] = useState<any[]>([])
  const [usersDocs, setUsersDocs] = useState<any[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [authUser, setAuthUser] = useState<string>("verificando...")

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])

  const loadData = async () => {
    setLoading(true)
    try {
      const staffSnap = await getDocs(collection(db, "staff"))
      const staff = staffSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      setStaffDocs(staff)

      const usersSnap = await getDocs(collection(db, "users"))
      const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      setUsersDocs(users)

      addLog(`Cargados: ${staff.length} docs en staff, ${users.length} docs en users`)
    } catch (error: unknown) {
      const e = error as any
      addLog(`ERROR cargando: ${e.code || e.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      setAuthUser(user ? `${user.email} (UID: ${user.uid})` : "NO AUTENTICADO")
    })
    loadData()
  }, [])

  const handleDelete = async (collectionName: string, docId: string, docName: string) => {
    addLog(`Intentando eliminar ${collectionName}/${docId} (${docName})...`)
    try {
      await deleteDoc(doc(db, collectionName, docId))
      addLog(`✅ deleteDoc completado para ${collectionName}/${docId}`)
      const check = await getDoc(doc(db, collectionName, docId))
      if (check.exists()) {
        addLog(`⚠️ DOCUMENTO AÚN EXISTE después de deleteDoc — REGLAS DE FIRESTORE BLOQUEANDO`)
      } else {
        addLog(`✅ CONFIRMADO: Documento eliminado exitosamente`)
      }
      await loadData()
    } catch (error: unknown) {
      const e = error as any
      addLog(`❌ ERROR: ${e.code || e.message}`)
    }
  }

  const handleEditEmail = async (collectionName: string, docId: string, currentName: string, currentEmail: string) => {
    const newEmail = prompt(`Cambiar email de ${currentName}\n\nEmail actual: ${currentEmail}\n\nIngrese el nuevo email:`, currentEmail)
    if (!newEmail || newEmail === currentEmail) {
      addLog("Operación cancelada")
      return
    }
    addLog(`Cambiando email de ${currentName}: ${currentEmail} → ${newEmail}`)
    try {
      const { updateDoc } = await import("firebase/firestore")
      await updateDoc(doc(db, collectionName, docId), { email: newEmail, updatedAt: new Date() })
      addLog(`✅ Email actualizado exitosamente`)
      await loadData()
    } catch (error: unknown) {
      const e = error as any
      addLog(`❌ ERROR: ${e.code || e.message}`)
    }
  }

  const handleDeleteAll = async (collectionName: string, docs: any[]) => {
    for (const d of docs) {
      await handleDelete(collectionName, d.id, d.name || "sin nombre")
    }
  }

  return (
    <div style={{padding: "30px", fontFamily: "monospace", maxWidth: "1000px", margin: "0 auto"}}>
      <h1 style={{fontSize: "20px", marginBottom: "10px"}}>Panel de Administración de Datos</h1>
      <p style={{fontSize: "12px", color: "#666", marginBottom: "20px"}}>
        Auth: <strong>{authUser}</strong>
      </p>

      <h2 style={{fontSize: "16px", margin: "15px 0 8px", color: "#5B8C6F"}}>
        Colección STAFF ({staffDocs.length} docs)
      </h2>
      <table style={{width: "100%", borderCollapse: "collapse", fontSize: "11px", marginBottom: "15px"}}>
        <thead>
          <tr style={{background: "#f0f0f0"}}>
            <th style={{border: "1px solid #ddd", padding: "4px"}}>ID</th>
            <th style={{border: "1px solid #ddd", padding: "4px"}}>Nombre</th>
            <th style={{border: "1px solid #ddd", padding: "4px"}}>Email</th>
            <th style={{border: "1px solid #ddd", padding: "4px"}}>Rol</th>
            <th style={{border: "1px solid #ddd", padding: "4px"}}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {staffDocs.map(d => (
            <tr key={d.id}>
              <td style={{border: "1px solid #ddd", padding: "4px", fontSize: "9px"}}>{d.id}</td>
              <td style={{border: "1px solid #ddd", padding: "4px"}}>{d.name}</td>
              <td style={{border: "1px solid #ddd", padding: "4px"}}>{d.email}</td>
              <td style={{border: "1px solid #ddd", padding: "4px"}}>{d.role}</td>
              <td style={{border: "1px solid #ddd", padding: "4px"}}>
                <button
                  onClick={() => handleEditEmail("staff", d.id, d.name, d.email)}
                  style={{background: "#2563eb", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "10px", marginRight: "4px"}}
                >
                  EDITAR EMAIL
                </button>
                <button
                  onClick={() => handleDelete("staff", d.id, d.name)}
                  style={{background: "#dc2626", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "10px"}}
                >
                  ELIMINAR
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{fontSize: "16px", margin: "15px 0 8px", color: "#C4835A"}}>
        Colección USERS ({usersDocs.length} docs)
      </h2>
      {usersDocs.length > 0 ? (
        <>
          <table style={{width: "100%", borderCollapse: "collapse", fontSize: "11px", marginBottom: "10px"}}>
            <thead>
              <tr style={{background: "#f0f0f0"}}>
                <th style={{border: "1px solid #ddd", padding: "4px"}}>ID</th>
                <th style={{border: "1px solid #ddd", padding: "4px"}}>Nombre</th>
                <th style={{border: "1px solid #ddd", padding: "4px"}}>Email</th>
                <th style={{border: "1px solid #ddd", padding: "4px"}}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {usersDocs.map(d => (
                <tr key={d.id}>
                  <td style={{border: "1px solid #ddd", padding: "4px", fontSize: "9px"}}>{d.id}</td>
                  <td style={{border: "1px solid #ddd", padding: "4px"}}>{d.name}</td>
                  <td style={{border: "1px solid #ddd", padding: "4px"}}>{d.email}</td>
                  <td style={{border: "1px solid #ddd", padding: "4px"}}>
                    <button
                      onClick={() => handleDelete("users", d.id, d.name)}
                      style={{background: "#dc2626", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "10px"}}
                    >
                      ELIMINAR
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={() => handleDeleteAll("users", usersDocs)}
            style={{background: "#991b1b", color: "white", border: "none", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", fontSize: "12px"}}
          >
            ELIMINAR TODOS los docs de &quot;users&quot;
          </button>
        </>
      ) : (
        <p style={{color: "#666", fontSize: "12px"}}>Vacía</p>
      )}

      <h2 style={{fontSize: "16px", margin: "20px 0 8px"}}>Log de operaciones</h2>
      <div style={{background: "#1a1a1a", color: "#0f0", padding: "15px", borderRadius: "8px", maxHeight: "300px", overflow: "auto", fontSize: "11px"}}>
        {logs.length === 0 ? (
          <p>Sin operaciones aún...</p>
        ) : (
          logs.map((log, i) => <p key={i} style={{margin: "2px 0"}}>{log}</p>)
        )}
      </div>

      <div style={{marginTop: "20px", display: "flex", gap: "10px"}}>
        <button
          onClick={loadData}
          disabled={loading}
          style={{background: "#5B8C6F", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer"}}
        >
          {loading ? "Cargando..." : "Recargar datos"}
        </button>
        <a href="/dashboard/settings/" style={{padding: "10px 20px", background: "#e2e8f0", color: "#333", borderRadius: "8px", textDecoration: "none"}}>
          Ir a Configuración
        </a>
      </div>
    </div>
  )
}
