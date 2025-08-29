"use client"
import { useState, use, Suspense, useMemo } from "react";
import { useStaff } from "@/hooks/use-staff"; 
import { useStaffContracts } from "@/hooks/use-staff-contracts";
import NewStaffContractForm from "./new-staff-contract-form";

// Componentes de UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableRow, TableCell, TableHead, TableHeader } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Iconos
import { User, Mail, Phone, FileText, Home, Briefcase, DollarSign, Calendar } from "lucide-react";
import Link from "next/link";

function StaffProfilePageContent({ staffId }: { staffId: string }) {
  const { staff, isLoading: staffLoading } = useStaff();
  const { contracts: staffContracts, isLoading: contractsLoading } = useStaffContracts();
  
  const isLoading = staffLoading || contractsLoading;

  const staffMember = useMemo(() => staff.find(s => s.id === staffId), [staff, staffId]);
  
  const contracts = useMemo(() => {
    if (!staffMember) return [];
    return staffContracts
        .filter(c => c.staffId === staffMember.id)
        .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [staffContracts, staffMember]);

  if (isLoading) {
    return <div>Cargando perfil del personal...</div>;
  }

  if (!staffMember) {
    return <div>Personal no encontrado.</div>;
  }
  
  const getStatusVariant = (status: string) => {
    return status === "Activo" ? "default" : "secondary";
  };


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
                        <TableCell className="font-medium flex items-center gap-2"><Mail className="h-4 w-4"/> Cédula</TableCell>
                        <TableCell>{staffMember.idNumber}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium flex items-center gap-2"><Mail className="h-4 w-4"/> Correo</TableCell>
                        <TableCell>{staffMember.email}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium flex items-center gap-2"><Phone className="h-4 w-4"/> Teléfono</TableCell>
                        <TableCell>{staffMember.phone}</TableCell>
                    </TableRow>
                     <TableRow>
                        <TableCell className="font-medium flex items-center gap-2"><Home className="h-4 w-4"/> Dirección</TableCell>
                        <TableCell>{staffMember.address}</TableCell>
                    </TableRow>
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
                            <Badge variant={getStatusVariant(staffMember.status)} className={staffMember.status === 'Activo' ? 'bg-green-500' : ''}>
                                {staffMember.status}
                            </Badge>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium flex items-center gap-2"><Calendar className="h-4 w-4"/> Fecha Contratación</TableCell>
                        <TableCell>{new Date(staffMember.hireDate).toLocaleDateString('es-ES', { dateStyle: 'long' })}</TableCell>
                    </TableRow>
                    {contracts.length > 0 && (
                        <TableRow>
                             <TableCell className="font-medium flex items-center gap-2"><DollarSign className="h-4 w-4"/> Salario</TableCell>
                            <TableCell>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(contracts[0].salary)}</TableCell>
                        </TableRow>
                    )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
       </div>

      <Card>
        <CardHeader>
            <CardTitle>Historial de Contratos</CardTitle>
            <CardDescription>Contratos laborales asociados a {staffMember.name}</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fecha de Inicio</TableHead>
                        <TableHead>Fecha de Fin</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {contracts.length > 0 ? (
                        contracts.map(contract => (
                            <TableRow key={contract.id}>
                                <TableCell>{new Date(contract.startDate).toLocaleDateString()}</TableCell>
                                <TableCell>{new Date(contract.endDate).toLocaleDateString()}</TableCell>
                                <TableCell><Badge variant={getStatusVariant(contract.status)}>{contract.status}</Badge></TableCell>
                                <TableCell className="text-right">
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/dashboard/contracts/${contract.id}?type=staff`}>
                                            Ver Contrato
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center h-24">No hay contratos registrados.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}


export default function StaffProfilePage({ params }: { params: { id: string } }) {
  const staffId = use(params).id;
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <StaffProfilePageContent staffId={staffId} />
    </Suspense>
  )
}
