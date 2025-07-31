
"use client"
import Link from "next/link"
import { PlusCircle, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useLogs } from "@/hooks/use-logs"
import { useResidents } from "@/hooks/use-residents"
import { useEffect, useState } from "react"

export default function LogsPage() {
  const { logs, isLoading: logsLoading } = useLogs()
  const { residents, isLoading: residentsLoading } = useResidents()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const isLoading = logsLoading || residentsLoading;

  if (!isClient || isLoading) {
    return <div>Cargando...</div>
  }

  const getResidentName = (residentId: string) => {
    return residents.find(r => r.id === residentId)?.name || "N/A"
  }
  
  const sortedLogs = logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-3xl font-bold font-headline">Registro Diario</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evoluciones Recientes</CardTitle>
          <CardDescription>
            Listado de los últimos registros de evolución de los residentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Residente</TableHead>
                <TableHead>Estado de Ánimo</TableHead>
                <TableHead>Apetito</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.date}</TableCell>
                  <TableCell>
                    <Link href={`/dashboard/residents/${log.residentId}`} className="hover:underline">
                        {getResidentName(log.residentId)}
                    </Link>
                  </TableCell>
                  <TableCell>{log.mood}</TableCell>
                  <TableCell>{log.appetite}</TableCell>
                  <TableCell className="max-w-xs truncate">{log.notes}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                           <Link href={`/dashboard/residents/${log.residentId}`}>Ver Perfil</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
