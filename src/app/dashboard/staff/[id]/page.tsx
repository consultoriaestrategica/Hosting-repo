"use client"
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// Hooks personalizados
import { useToast } from "@/hooks/use-toast";
import { useStaff } from "@/hooks/use-staff"; // <-- Se importa el hook real
import NewStaffContractForm from "./new-staff-contract-form";

// Componentes de UI (shadcn/ui)
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Iconos
import { User, Mail, Phone, FileText } from "lucide-react";

export default function StaffProfilePage({ params }: { params: { id: string } }) {
  const staffId = use(params).id;
  const { staff, isLoading } = useStaff(); // <-- Se usa el hook real
  const { toast } = useToast();
  
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);

  const staffMember = staff.find(s => s.id === staffId);

  if (isLoading) {
    return <div>Cargando perfil del personal...</div>;
  }

  if (!staffMember) {
    return <div>Personal no encontrado.</div>;
  }

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

      <Card>
        <CardHeader>
          <CardTitle>Información de Contacto</CardTitle>
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Acciones</CardTitle>
        </CardHeader>
        <CardContent>
            <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <FileText className="mr-2 h-4 w-4"/>
                        Generar Contrato Laboral
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Generar Nuevo Contrato Laboral</DialogTitle>
                        <DialogDescription>
                            Complete los detalles para generar un nuevo contrato de trabajo para {staffMember.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <NewStaffContractForm 
                        staffMember={staffMember} 
                        onFormSubmit={() => setIsContractDialogOpen(false)} 
                    />
                </DialogContent>
            </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}