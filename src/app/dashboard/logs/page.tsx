
"use client"
import { useState } from "react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import NewLogForm from "../residents/[id]/new-log-form"

export default function LogsPage() {
  const [isNewLogDialogOpen, setIsNewLogDialogOpen] = useState(false);

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-3xl font-bold font-headline">Historial de Registros</h1>
        <div className="ml-auto flex items-center gap-2">
            <Dialog open={isNewLogDialogOpen} onOpenChange={setIsNewLogDialogOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" className="h-8 gap-1">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Añadir Nuevo Registro
                        </span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Agregar Registro de Evolución</DialogTitle>
                        <DialogDescription>Seleccione el tipo de reporte y complete la información.</DialogDescription>
                    </DialogHeader>
                    <NewLogForm onFormSubmit={() => setIsNewLogDialogOpen(false)} />
                </DialogContent>
            </Dialog>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Todos los Registros</CardTitle>
          <CardDescription>
            Un listado completo de todos los registros médicos y de suministros del sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Residente</TableHead>
                <TableHead>Tipo de Reporte</TableHead>
                <TableHead>Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Aún no hay registros globales para mostrar.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
