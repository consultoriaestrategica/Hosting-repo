
"use client"
import { useState, useMemo, useEffect } from "react"
import { Users, Activity } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useResidents } from "@/hooks/use-residents"
import ActivityFeed from "./components/activity-feed"

export default function DashboardPage() {
  const { residents, isLoading: residentsLoading } = useResidents()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const totalActiveResidents = useMemo(() => {
    return residents.filter(r => r.status === 'Activo').length;
  }, [residents]);


  if (!isClient || residentsLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold font-headline">Bienvenido a Ángel Guardián</h1>
      </div>
       <div className="grid gap-6 md:grid-cols-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Residentes Activos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalActiveResidents}</div>
                <p className="text-xs text-muted-foreground">Residentes actualmente en el hogar.</p>
            </CardContent>
          </Card>
          <Card>
             <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity/>
                    Actividad Reciente
                </CardTitle>
                <CardDescription>
                    Últimas acciones realizadas en el sistema.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ActivityFeed />
            </CardContent>
          </Card>
        </div>
    </>
  )
}
