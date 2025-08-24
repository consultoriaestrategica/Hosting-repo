
"use client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Phone,
  Mail,
  Home,
  Briefcase,
  Calendar,
  CircleDollarSign,
  FileText,
  Eye,
  BookUser,
} from "lucide-react"
import { useStaff } from "@/hooks/use-staff"
import { useStaffContracts, StaffContract } from "@/hooks/use-staff-contracts"
import { useEffect, useState, Suspense, use, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import NewStaffContractForm from "./new-staff-contract-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

function StaffProfilePageContent({ id }: { id: string }) {
  const { staff, isLoading: staffLoading } = useStaff()
  const { contracts, isLoading: contractsLoading } = useStaffContracts()
  const [isClient, setIsClient] = useState(false)
  const [isContractFormOpen, setIsContractFormOpen] = useState(false)

  const searchParams = useSearchParams()
  const role = searchParams.get("role") || "admin"

  useEffect(() => {
    setIsClient(true)
  }, [])

  const staffMember = staff.find((s) => s.id === id)

  const staffContracts = useMemo(
    () =>
      [...contracts]
        .filter((c) => c.staffId === id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [contracts, id]
  )

  if (!isClient || staffLoading || contractsLoading) {
    return <div>Cargando...</div>
  }

  if (!staffMember) {
    return <div>Miembro del personal no encontrado.</div>
  }
  
  const getStatusVariant = (status: string) => {
    return status === 'Activo' ? 'default' : 'secondary';
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold font-headline tracking-tight sm:grow-0">
          Perfil de {staffMember.name}
        </h1>
        <div className="hidden items-center gap-2 md:ml-auto md:flex">
          <Dialog open={isContractFormOpen} onOpenChange={setIsContractFormOpen}>
            <DialogTrigger asChild>
              <Button>
                <BookUser className="mr-2 h-4 w-4" />
                Generar Contrato
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generar Contrato para {staffMember.name}</DialogTitle>
                <DialogDescription>
                  Complete los detalles para generar un nuevo contrato de trabajo.
                </DialogDescription>
              </DialogHeader>
              <NewStaffContractForm 
                staffMember={staffMember} 
                onFormSubmit={() => setIsContractFormOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="profile" className="mt-4">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Información del Personal</CardTitle>
              <CardDescription>
                Detalles de contacto y laborales del miembro del personal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Nombre</p>
                    <p>{staffMember.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Cargo</p>
                    <p>{staffMember.role}</p>
                  </div>
                </div>
                 <div className="flex items-start gap-3">
                  <p className="font-semibold mt-1">Estado</p>
                  <div><Badge variant={getStatusVariant(staffMember.status)} className={staffMember.status === 'Activo' ? 'bg-green-500' : ''}>
                      {staffMember.status}
                    </Badge></div>
                </div>
                <div className="flex items-start gap-3">
                  <Home className="h-5 w-5 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Dirección</p>
                    <p>{staffMember.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Teléfono</p>
                    <p>{staffMember.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Correo Electrónico</p>
                    <p>{staffMember.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Fecha de Contratación</p>
                    <p>{new Date(staffMember.hireDate).toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CircleDollarSign className="h-5 w-5 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Salario</p>
                    <p>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(staffMember.salary || 0)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="contracts">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Contratos</CardTitle>
              <CardDescription>
                Listado de todos los contratos asociados a este miembro del personal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha de Creación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Inicio</TableHead>
                    <TableHead>Fin</TableHead>
                    <TableHead>
                      <span className="sr-only">Acciones</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffContracts.length > 0 ? (
                    staffContracts.map((contract) => (
                      <TableRow key={contract.id}>
                         <TableCell>{new Date(contract.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(contract.status)} className={contract.status === 'Activo' ? 'bg-green-500' : ''}>
                            {contract.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(contract.startDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(contract.endDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                           <Button asChild variant="outline" size="sm">
                             <Link href={`/dashboard/contracts/${contract.id}?role=${role}&type=staff`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalle
                             </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No se encontraron contratos para este miembro del personal.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}

export default function StaffProfilePage({ params }: { params: { id: string } }) {
  const { id } = use(params)
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <StaffProfilePageContent id={id} />
    </Suspense>
  )
}
