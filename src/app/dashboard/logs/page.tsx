
"use client"
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

export default function LogsPage() {

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-3xl font-bold font-headline">Historial de Registros</h1>
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
