"use client"
import Link from "next/link"
import { PlusCircle, MoreHorizontal, Eye } from "lucide-react"
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
import { useContracts, Contract } from "@/hooks/use-contracts"
import { useResidents } from "@/hooks/use-residents"
import { useEffect, useState, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"

function ContractsPageContent() {
  const { contracts, isLoading: contractsLoading } = useContracts()
  const { residents, isLoading: residentsLoading } = useResidents()
  const [isClient, setIsClient] = useState(false)
  
  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'admin';

  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const isLoading = contractsLoading || residentsLoading;

  const sortedContracts = useMemo(() => {
     return [...contracts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [contracts]);

  if (!isClient || isLoading) {
    return <div>Cargando...</div>
  }

  const getResidentName = (residentId: string) => {
    return residents.find(r => r.id === residentId)?.name || "N/A"
  }
  
  const getStatusVariant = (status: string) => {
    switch(status) {
        case 'Activo': return 'default';
        case 'Finalizado': return 'secondary';
        case 'Cancelado': return 'destructive';
        default: return 'outline';
    }
  }


  return (
    <>
      <div className="flex items-center">
        <h1 className="text-3xl font-bold font-headline">Gestión de Contratos</h1>
        <div className="ml-auto flex items-center gap-2">
            <Button size="sm" className="h-8 gap-1" asChild>
                <Link href={`/dashboard/contracts/new?role=${role}`}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Generar Contrato
                    </span>
                </Link>
            </Button>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Contratos Recientes</CardTitle>
          <CardDescription>
            Listado de los últimos contratos generados para los residentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha de Creación</TableHead>
                <TableHead>Residente</TableHead>
                <TableHead>Tipo de Contrato</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedContracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{new Date(contract.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Link href={`/dashboard/residents/${contract.residentId}?role=${role}`} className="hover:underline">
                        {getResidentName(contract.residentId)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    Contrato de Servicios {contract.contractType}
                  </TableCell>
                  <TableCell>
                     <Badge variant={getStatusVariant(contract.status)}>
                        {contract.status}
                     </Badge>
                  </TableCell>
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
                           <Link href={`/dashboard/contracts/${contract.id}?role=${role}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalle
                           </Link>
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

export default function ContractsPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ContractsPageContent />
    </Suspense>
  )
}

