"use client"
import { useMemo } from "react";
import { useStaff } from "@/hooks/use-staff";
// import { useStaffContracts } from "@/hooks/use-staff-contracts"; // Deshabilitado temporalmente
// import NewStaffContractForm from "./new-staff-contract-form"; // Deshabilitado temporalmente

// Componentes de UI
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Iconos
import { User, Mail, Phone, Briefcase, Calendar, Building } from "lucide-react";

// ✅ Componente principal exportado
export default function StaffProfilePageContent({ staffId }: { staffId: string }) {
  const { staff, isLoading: staffLoading } = useStaff();
  // const { contracts: staffContracts, isLoading: contractsLoading } = useStaffContracts(); // Deshabilitado temporalmente
  // const [isContractFormOpen, setIsContractFormOpen] = useState(false); // Deshabilitado temporalmente

  const isLoading = staffLoading; // || contractsLoading;

  const staffMember = useMemo(() => staff.find(s => s.id === staffId), [staff, staffId]);

  // const contracts = useMemo(() => {
  //   if (!staffMember) return [];
  //   return staffContracts
  //       .filter(c => c.staffId === staffMember.id)
  //       .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  // }, [staffContracts, staffMember]);

  if (isLoading) {
    return <div className="p-8">Cargando perfil del personal...</div>;
  }

  if (!staffMember) {
    return <div className="p-8">Personal no encontrado.</div>;
  }

  // const getStatusVariant = (status: string) => {
  //   return status === "Activo" ? "default" : "secondary";
  // };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <User className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">
            Perfil de {staffMember.name}
          </h1>
          <Badge variant="secondary">{staffMember.role}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User />Información Personal</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium flex items-center gap-2"><Mail className="h-4 w-4"/> Correo</TableCell>
                  <TableCell>{staffMember.email}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium flex items-center gap-2"><Phone className="h-4 w-4"/> Teléfono</TableCell>
                  <TableCell>{staffMember.phone}</TableCell>
                </TableRow>
                {staffMember.position && (
                  <TableRow>
                    <TableCell className="font-medium flex items-center gap-2"><Briefcase className="h-4 w-4"/> Cargo</TableCell>
                    <TableCell>{staffMember.position}</TableCell>
                  </TableRow>
                )}
                {staffMember.department && (
                  <TableRow>
                    <TableCell className="font-medium flex items-center gap-2"><Building className="h-4 w-4"/> Departamento</TableCell>
                    <TableCell>{staffMember.department}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Briefcase />Información Laboral</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium flex items-center gap-2">Estado</TableCell>
                  <TableCell>
                    <Badge variant={staffMember.isActive ? "default" : "secondary"} className={staffMember.isActive ? 'bg-green-500 text-white' : ''}>
                      {staffMember.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                </TableRow>
                {staffMember.hireDate && (
                  <TableRow>
                    <TableCell className="font-medium flex items-center gap-2"><Calendar className="h-4 w-4"/> Fecha Contratación</TableCell>
                    <TableCell>{new Date(staffMember.hireDate).toLocaleDateString('es-ES', { dateStyle: 'long' })}</TableCell>
                  </TableRow>
                )}
                {/* TEMPORAL: Salario desde contratos deshabilitado */}
                {/* {contracts.length > 0 && (
                  <TableRow>
                    <TableCell className="font-medium flex items-center gap-2"><DollarSign className="h-4 w-4"/> Salario Actual</TableCell>
                    <TableCell>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(contracts[0].salary)}</TableCell>
                  </TableRow>
                )} */}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* MÓDULO TEMPORAL: Sección de contratos deshabilitada - descomentar cuando esté lista */}
      {/* <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="flex-1">
            <CardTitle>Historial de Contratos</CardTitle>
            <CardDescription>Contratos laborales asociados a {staffMember.name}</CardDescription>
          </div>
          <Dialog open={isContractFormOpen} onOpenChange={setIsContractFormOpen}>
            <DialogTrigger asChild>
              <Button><PlusCircle className="mr-2 h-4 w-4"/>Crear Contrato</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Contrato</DialogTitle>
                <DialogDescription>
                  Complete los detalles del nuevo contrato para {staffMember.name}.
                </DialogDescription>
              </DialogHeader>
              <NewStaffContractForm
                staffMember={staffMember}
                onFormSubmit={() => setIsContractFormOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha de Inicio</TableHead>
                <TableHead>Fecha de Fin</TableHead>
                <TableHead>Salario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.length > 0 ? (
                contracts.map(contract => (
                  <TableRow key={contract.id}>
                    <TableCell>{new Date(contract.startDate).toLocaleDateString('es-ES')}</TableCell>
                    <TableCell>{new Date(contract.endDate).toLocaleDateString('es-ES')}</TableCell>
                    <TableCell>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(contract.salary)}</TableCell>
                    <TableCell><Badge variant={getStatusVariant(contract.status)}>{contract.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/contracts/${contract.id}?type=staff`}>
                          <Eye className="mr-2 h-4 w-4" /> Ver Detalle
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No hay contratos registrados.
                    <Button variant="link" onClick={() => setIsContractFormOpen(true)}>Crear uno ahora.</Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card> */}
    </div>
  );
}