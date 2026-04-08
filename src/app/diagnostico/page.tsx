"use client"

import { useEffect, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function DiagnosticoPage() {
  const [staffDocs, setStaffDocs] = useState<any[]>([])
  const [usersDocs, setUsersDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const staffSnap = await getDocs(collection(db, "staff"))
        const staff = staffSnap.docs.map(d => ({
          id: d.id,
          name: d.data().name,
          email: d.data().email,
          role: d.data().role,
          isActive: d.data().isActive,
          collection: "staff"
        }))

        const usersSnap = await getDocs(collection(db, "users"))
        const users = usersSnap.docs.map(d => ({
          id: d.id,
          name: d.data().name,
          email: d.data().email,
          role: d.data().role,
          isActive: d.data().isActive,
          collection: "users"
        }))

        setStaffDocs(staff)
        setUsersDocs(users)
      } catch (error: unknown) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div style={{padding: "40px", fontFamily: "monospace"}}>Cargando...</div>

  return (
    <div style={{padding: "40px", fontFamily: "monospace", maxWidth: "900px"}}>
      <h1 style={{fontSize: "20px", marginBottom: "20px"}}>Diagnóstico de Colecciones Firestore</h1>

      <h2 style={{fontSize: "16px", margin: "20px 0 10px", color: "#5B8C6F"}}>
        Colección STAFF ({staffDocs.length} documentos)
      </h2>
      <table style={{width: "100%", borderCollapse: "collapse", fontSize: "12px"}}>
        <thead>
          <tr style={{background: "#f0f0f0"}}>
            <th style={{border: "1px solid #ddd", padding: "6px", textAlign: "left"}}>ID (Firestore)</th>
            <th style={{border: "1px solid #ddd", padding: "6px", textAlign: "left"}}>Nombre</th>
            <th style={{border: "1px solid #ddd", padding: "6px", textAlign: "left"}}>Email</th>
            <th style={{border: "1px solid #ddd", padding: "6px", textAlign: "left"}}>Rol</th>
            <th style={{border: "1px solid #ddd", padding: "6px", textAlign: "left"}}>Activo</th>
          </tr>
        </thead>
        <tbody>
          {staffDocs.map(d => (
            <tr key={d.id}>
              <td style={{border: "1px solid #ddd", padding: "6px", fontSize: "10px"}}>{d.id}</td>
              <td style={{border: "1px solid #ddd", padding: "6px"}}>{d.name}</td>
              <td style={{border: "1px solid #ddd", padding: "6px"}}>{d.email}</td>
              <td style={{border: "1px solid #ddd", padding: "6px"}}>{d.role}</td>
              <td style={{border: "1px solid #ddd", padding: "6px"}}>{String(d.isActive)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{fontSize: "16px", margin: "20px 0 10px", color: "#C4835A"}}>
        Colección USERS ({usersDocs.length} documentos)
      </h2>
      <table style={{width: "100%", borderCollapse: "collapse", fontSize: "12px"}}>
        <thead>
          <tr style={{background: "#f0f0f0"}}>
            <th style={{border: "1px solid #ddd", padding: "6px", textAlign: "left"}}>ID (Firestore)</th>
            <th style={{border: "1px solid #ddd", padding: "6px", textAlign: "left"}}>Nombre</th>
            <th style={{border: "1px solid #ddd", padding: "6px", textAlign: "left"}}>Email</th>
            <th style={{border: "1px solid #ddd", padding: "6px", textAlign: "left"}}>Rol</th>
            <th style={{border: "1px solid #ddd", padding: "6px", textAlign: "left"}}>Activo</th>
          </tr>
        </thead>
        <tbody>
          {usersDocs.map(d => (
            <tr key={d.id}>
              <td style={{border: "1px solid #ddd", padding: "6px", fontSize: "10px"}}>{d.id}</td>
              <td style={{border: "1px solid #ddd", padding: "6px"}}>{d.name}</td>
              <td style={{border: "1px solid #ddd", padding: "6px"}}>{d.email}</td>
              <td style={{border: "1px solid #ddd", padding: "6px"}}>{d.role}</td>
              <td style={{border: "1px solid #ddd", padding: "6px"}}>{String(d.isActive)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
