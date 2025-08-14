
"use client"
import Link from "next/link"
import { PlusCircle, MoreHorizontal, Eye, FilterX, User, Briefcase } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useContracts as useResidentContracts } from "@/hooks/use-contracts"
import { useStaffContracts } from "@/hooks/use-staff-contracts"
import { useResidents } from "@/hooks/use-residents"
import { useStaff } from "@/hooks/use-staff"
import { useEffect, useState, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"

function ContractsPageContent() {
  const { contracts: residentContracts, isLoading: residentContractsLoading } = useResidentContracts()
  const { contracts: staffContracts, isLoading: staffContractsLoading } = useStaffContracts()
  const { residents, isLoading: residentsLoading } = useResidents()
  const { staff, isLoading: staffLoading } = useStaff()
  
  const [isClient, setIsClient] = useState(false)
  const [personFilter, setPersonFilter] = useState<string>("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  
  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'admin';

  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const isLoading = residentContractsLoading || staffContractsLoading || residentsLoading || staffLoading;

  const combinedContracts = useMemo(() => {
    const residentsWithContracts = residentContracts.map(c => ({...c, contractPartyType: 'resident'}));
    const staffWithContracts = staffContracts.map(c => ({...c, contractPartyType: 'staff'}));
    return [...residentsWithContracts, ...staffWithContracts];
  }, [residentContracts, staffContracts]);

  const filteredAndSortedContracts = useMemo(() => {
     let filtered = combinedContracts;

     if (typeFilter !== 'all') {
        filtered = filtered.filter(c => c.contractPartyType === typeFilter);
     }

     if (personFilter) {
       const [type, id] = personFilter.split('-');
       if(type === 'resident') {
          filtered = filtered.filter(c => c.contractPartyType === 'resident' && (c as any).residentId === id);
       } else if (type === 'staff') {
            filtered = filtered.filter(c => c.contractPartyType === 'staff' && (c as any).staffId === id);
       }
     }
     return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [combinedContracts, personFilter, typeFilter]);

  if (!isClient || isLoading) {
    return <div>Cargando...</div>
  }

  const getPersonName = (contract: any) => {
    if (contract.contractPartyType === 'resident') {
        return residents.find(r => r.id === contract.residentId)?.name || "N/A"
    }
    return staff.find(s => s.id === contract.staffId)?.name || "N/A"
  }

  const getPersonLink = (contract: any) => {
    if (contract.contractPartyType === 'resident') {
        return `/dashboard/residents/${contract.residentId}?role=${role}`
    }
    return `/dashboard/staff/${contract.staffId}?role=${role}`
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
                        Generar Contrato Residente
                    </span>
                </Link>
            </Button>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Contratos Recientes</CardTitle>
          <CardDescription>
            Listado de todos los contratos generados. Use los filtros para buscar.
          </CardDescription>
           <div className="flex flex-wrap items-center gap-2 pt-4">
              <Select onValueChange={setTypeFilter} value={typeFilter}>
                <SelectTrigger className="w-full sm:w-auto">
                    <SelectValue placeholder="Filtrar por tipo..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos los Tipos</SelectItem>
                    <SelectItem value="resident">Residente</SelectItem>
                    <SelectItem value="staff">Personal</SelectItem>
                </SelectContent>
             </Select>
              <Select onValueChange={setPersonFilter} value={personFilter}>
                <SelectTrigger className="w-full sm:w-auto flex-1 max-w-xs">
                    <SelectValue placeholder="Filtrar por persona..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="">Todas las Personas</SelectItem>
                    <optgroup label="Residentes">
                        {residents.map((resident) => (
                        <SelectItem key={`resident-${resident.id}`} value={`resident-${resident.id}`}>
                            {resident.name}
                        </SelectItem>
                        ))}
                    </optgroup>
                    <optgroup label="Personal">
                         {staff.map((member) => (
                        <SelectItem key={`staff-${member.id}`} value={`staff-${member.id}`}>
                            {member.name}
                        </SelectItem>
                        ))}
                    </optgroup>
                </SelectContent>
             </Select>
             <Button variant="outline" onClick={() => { setPersonFilter(""); setTypeFilter("all");}} disabled={!personFilter && typeFilter === 'all'}>
                <FilterX className="h-4 w-4 mr-2" />
                Limpiar
            </Button>
           </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo de Contrato</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedContracts.length > 0 ? (
                filteredAndSortedContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">{new Date(contract.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Link href={getPersonLink(contract)} className="hover:underline">
                          {getPersonName(contract)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-2">
                        {contract.contractPartyType === 'resident' ? <User className="h-3 w-3"/> : <Briefcase className="h-3 w-3"/>}
                        {contract.contractPartyType === 'resident' ? `Servicios (${(contract as any).contractType})` : 'Laboral'}
                      </Badge>
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
                             <Link href={`/dashboard/contracts/${contract.id}?role=${role}&type=${contract.contractPartyType}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver Detalle
                             </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No se encontraron contratos con los filtros actuales.
                    </TableCell>
                </TableRow>
              )}
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
