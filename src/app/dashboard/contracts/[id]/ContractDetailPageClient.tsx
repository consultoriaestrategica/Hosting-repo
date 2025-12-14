"use client"

import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

type ContractDetailPageClientProps = {
  id: string
}

type ContractData = {
  name?: string
  client?: string
  date?: string
  status?: string
  amount?: number
  [key: string]: any
}

export default function ContractDetailPageClient({ id }: ContractDetailPageClientProps) {
  const [contract, setContract] = useState<ContractData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const docRef = doc(db, "contracts", id)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          setContract(docSnap.data() as ContractData)
        } else {
          // Si no está en "contracts", busca en "staffContracts"
          const staffDocRef = doc(db, "staffContracts", id)
          const staffDocSnap = await getDoc(staffDocRef)
          if (staffDocSnap.exists()) {
            setContract(staffDocSnap.data() as ContractData)
          } else {
            setContract(null)
          }
        }
      } catch (error) {
        console.error("❌ Error al obtener el contrato:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchContract()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Cargando contrato...</span>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No se encontró el contrato.
      </div>
    )
  }

  return (
    <div className="p-6">
      <Card className="shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle>Detalles del Contrato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p><strong>ID:</strong> {id}</p>
          <p><strong>Nombre:</strong> {contract.name ?? "No especificado"}</p>
          <p><strong>Cliente:</strong> {contract.client ?? "No especificado"}</p>
          <p><strong>Fecha:</strong> {contract.date ?? "No registrada"}</p>
          <p><strong>Estado:</strong> {contract.status ?? "Sin estado"}</p>
          <p><strong>Monto:</strong> {contract.amount ? `$${contract.amount}` : "No disponible"}</p>
        </CardContent>
      </Card>
    </div>
  )
}
