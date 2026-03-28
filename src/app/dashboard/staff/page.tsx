"use client"
import Link from "next/link"
import {
  PlusCircle,
  MoreHorizontal,
  Search,
  Eye,
  Edit,
  Mail,
  Phone,
  Home,
  Briefcase,
  DollarSign,
  Calendar,
  FileText,
} from "lucide-react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Staff, useStaff } from "@/hooks/use-staff"
import { StaffContract, useStaffContracts } from "@/hooks/use-staff-contracts"
import { useEffect, useState, useMemo, Suspense } from "react"
import { useUser } from "@/hooks/use-user"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import NewStaffContractForm from "./[id]/new-staff-contract-form"

function formatName(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function StaffPageContent() {
  const { staff, isLoading } = useStaff()
  const { contracts, isLoading: contractsLoading } = useStaffContracts()
  const { role } = useUser()
  const [isClient, setIsClient] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isContractFormOpen, setIsContractFormOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isProfileOpen && !isContractFormOpen) {
      const cleanup = () => {
        if (!document.querySelector('[data-state="open"][role="dialog"]')) {
          document.body.style.pointerEvents = '';
          document.body.style.removeProperty('pointer-events');
          if (document.body.style.length === 0) document.body.removeAttribute('style');
        }
      };
      cleanup();
      const t1 = setTimeout(cleanup, 150);
      const t2 = setTimeout(cleanup, 500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [isProfileOpen, isContractFormOpen]);

  // ✅ 1) Deduplicar staff por id para evitar elementos repetidos
  const uniqueStaff = useMemo(() => {
    const map = new Map<string, Staff>()
    staff.forEach((member) => {
      if (member.id && !map.has(member.id)) {
        map.set(member.id, member)
      }
    })
    return Array.from(map.values())
  }, [staff])

  // ✅ 2) Filtro sobre la lista ya deduplicada
  const filteredStaff = useMemo(() => {
    return uniqueStaff.filter(
      (member) =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [uniqueStaff, searchTerm])

  // ✅ 3) Contrato activo del miembro seleccionado (memoizado)
  const selectedContract = useMemo(() => {
    if (!selectedStaff) return undefined;
    return contracts
      .filter((c) => c.staffId === selectedStaff.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }, [contracts, selectedStaff]);

  if (!isClient || isLoading || contractsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-9 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const getStatusVariant = (isActive: boolean) => {
    return isActive ? "default" : "secondary"
  }

  const isAdminRole = role === "Administrador"

  const handleActionClick = (staffMember: Staff, action: "profile" | "contract") => {
    setSelectedStaff(staffMember)
    if (action === "profile") setIsProfileOpen(true)
    if (action === "contract") setIsContractFormOpen(true)
  }

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-3xl font-bold font-headline">Gestión de Personal</h1>
        <div className="ml-auto flex items-center gap-2">
          {isAdminRole && (
            <Button size="sm" className="h-8 gap-1" asChild>
              <Link href="/dashboard/staff/new">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Agregar Personal
                </span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <CardTitle>Miembros del Personal</CardTitle>
              <CardDescription>
                Listado de todo el personal del hogar geriátrico.
              </CardDescription>
            </div>
            <div className="relative flex-1 md:flex-initial">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre o cargo..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile View: Card List */}
          <div className="md:hidden space-y-4">
            {filteredStaff.length > 0 ? (
              filteredStaff.map((member, index) => (
                <div
                  key={`${member.id}-${index}`} // ✅ key segura y única
                  className="border rounded-lg p-4 flex justify-between items-start"
                >
                  <div className="space-y-1 flex-1">
                    <p className="font-medium">{formatName(member.name)}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.role}
                    </p>
                    <Badge
                      variant={getStatusVariant(member.isActive)}
                      className={
                        member.isActive ? "bg-green-500 text-white" : ""
                      }
                    >
                      {member.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-haspopup="true"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menú</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => handleActionClick(member, "profile")}
                      >
                        <Eye className="mr-2 h-4 w-4" /> Ver Perfil
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleActionClick(member, "contract")}
                      >
                        <FileText className="mr-2 h-4 w-4" /> Crear Contrato
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/staff/edit/${member.id}`}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No se encontraron miembros del personal.
              </p>
            )}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block">
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
                {filteredStaff.map((member, index) => (
                  <TableRow key={`${member.id}-${index}`}>
                    <TableCell className="font-medium">
                      {formatName(member.name)}
                    </TableCell>
                    <TableCell>{member.role}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusVariant(member.isActive)}
                        className={member.isActive ? "bg-green-500" : ""}
                      >
                        {member.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>{member.phone}</TableCell>
                    <TableCell>
                      {member.hireDate
                        ? new Date(member.hireDate).toLocaleDateString()
                        : "N/A"}
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
                            <span className="sr-only">Abrir menú</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleActionClick(member, "profile")}
                          >
                            <Eye className="mr-2 h-4 w-4" /> Ver Perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleActionClick(member, "contract")
                            }
                          >
                            <FileText className="mr-2 h-4 w-4" /> Crear Contrato
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/staff/edit/${member.id}`}>
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
          </div>
        </CardContent>
      </Card>

      {/* Dialog Perfil */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-lg">
          {selectedStaff && (
            <>
              <DialogHeader>
                <DialogTitle>Perfil de {selectedStaff.name}</DialogTitle>
                <DialogDescription>{selectedStaff.role}</DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="personal">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="personal">
                    Información Personal
                  </TabsTrigger>
                  <TabsTrigger value="contract">
                    Información Contractual
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="personal">
                  <Table className="mt-4">
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />{" "}
                          Correo
                        </TableCell>
                        <TableCell>{selectedStaff.email}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />{" "}
                          Teléfono
                        </TableCell>
                        <TableCell>{selectedStaff.phone}</TableCell>
                      </TableRow>
                      {selectedStaff.position && (
                        <TableRow>
                          <TableCell className="font-medium flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />{" "}
                            Posición
                          </TableCell>
                          <TableCell>{selectedStaff.position}</TableCell>
                        </TableRow>
                      )}
                      {selectedStaff.department && (
                        <TableRow>
                          <TableCell className="font-medium flex items-center gap-2">
                            <Home className="h-4 w-4 text-muted-foreground" />{" "}
                            Departamento
                          </TableCell>
                          <TableCell>{selectedStaff.department}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent value="contract">
                  <Table className="mt-4">
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />{" "}
                          Salario
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("es-CO", {
                            style: "currency",
                            currency: "COP",
                            minimumFractionDigits: 0,
                          }).format(
                            selectedContract?.salary || 0
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />{" "}
                          Fecha de Inicio
                        </TableCell>
                        <TableCell>
                          {selectedContract?.startDate
                            ? new Date(
                                selectedContract.startDate
                              ).toLocaleDateString("es-ES", {
                                dateStyle: "long",
                              })
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />{" "}
                          Fecha de Fin
                        </TableCell>
                        <TableCell>
                          {selectedContract?.endDate
                            ? new Date(
                                selectedContract.endDate
                              ).toLocaleDateString("es-ES", {
                                dateStyle: "long",
                              })
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />{" "}
                          Estado Contrato
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusVariant(
                              selectedContract?.status === "Activo"
                            )}
                          >
                            {selectedContract?.status || "N/A"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />{" "}
                          Documento
                        </TableCell>
                        <TableCell>
                          {selectedContract?.documentName || "N/A"}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
              <DialogFooter className="sm:justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (selectedContract?.documentUrl) {
                      window.open(selectedContract.documentUrl, "_blank")
                    }
                  }}
                  disabled={!selectedContract?.documentUrl}
                >
                  Ver Contrato
                </Button>
                <DialogClose asChild>
                  <Button type="button">Cerrar</Button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog nuevo contrato */}
      <Dialog open={isContractFormOpen} onOpenChange={setIsContractFormOpen}>
        <DialogContent>
          {selectedStaff && (
            <>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Contrato</DialogTitle>
                <DialogDescription>
                  Adjunte el documento para el nuevo contrato de{" "}
                  {selectedStaff.name}.
                </DialogDescription>
              </DialogHeader>
              <NewStaffContractForm
                staffMember={selectedStaff}
                onFormSubmit={() => setIsContractFormOpen(false)}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
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
