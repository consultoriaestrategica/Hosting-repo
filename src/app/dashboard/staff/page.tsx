
"use client"
import Link from "next/link"
import { PlusCircle, MoreHorizontal, Search, Eye, Edit } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Staff, useStaff } from "@/hooks/use-staff"
import { useEffect, useState, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"

function StaffPageContent() {
  const { staff, isLoading } = useStaff()
  const [isClient, setIsClient] = useState(false)
  const [searchTerm, setSearchTerm] = useState("");
  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'admin';
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  const filteredStaff = useMemo(() => {
    return staff.filter(member => 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [staff, searchTerm]);


  if (!isClient || isLoading) {
    return <div>Cargando...</div>
  }
  
  const getStatusVariant = (status: string) => {
    return status === 'Activo' ? 'default' : 'secondary';
  }

  const isAdminRole = role === 'admin';

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-3xl font-bold font-headline">Gestión de Personal</h1>
        <div className="ml-auto flex items-center gap-2">
            <Button size="sm" className="h-8 gap-1" asChild>
                <Link href={`/dashboard/staff/new?role=${role}`}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Agregar Personal
                    </span>
                </Link>
            </Button>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Miembros del Personal</CardTitle>
          <CardDescription>
            Listado de todo el personal del hogar geriátrico.
          </CardDescription>
          <div className="relative flex-1 pt-4">
              <Search className="absolute left-2.5 top-6 h-4 w-4 text-muted-foreground" />
              <Input
                  type="search"
                  placeholder="Buscar por nombre o cargo..."
                  className="pl-8 w-full max-w-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Fecha de Contratación</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell>
                     <Badge variant={getStatusVariant(member.status)} className={member.status === 'Activo' ? 'bg-green-500' : ''}>
                        {member.status}
                     </Badge>
                  </TableCell>
                  <TableCell>{member.phone}</TableCell>
                  <TableCell>{new Date(member.hireDate).toLocaleDateString()}</TableCell>
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
                         {isAdminRole && (
                            <DropdownMenuItem asChild>
                                <Link href={`/dashboard/staff/${member.id}?role=${role}`}>
                                    <Eye className="mr-2 h-4 w-4" /> Ver Perfil
                                </Link>
                            </DropdownMenuItem>
                         )}
                         <DropdownMenuItem asChild>
                            <Link href={`/dashboard/staff/edit/${member.id}?role=${role}`}>
                                <Edit className="mr-2 h-4 w-4" /> Editar
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

export default function StaffPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <StaffPageContent />
    </Suspense>
  )
}
