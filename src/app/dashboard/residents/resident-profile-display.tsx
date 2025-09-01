
"use client"

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Resident } from "@/hooks/use-residents";
import { Log, useLogs } from "@/hooks/use-logs";
import { Stethoscope, Truck } from "lucide-react";

interface ResidentProfileDisplayProps {
  resident: Resident;
}

const ITEMS_PER_PAGE = 7;

export default function ResidentProfileDisplay({ resident }: ResidentProfileDisplayProps) {
  const { logs } = useLogs();

  const residentLogs = useMemo(() => {
    return logs
      .filter(log => log.residentId === resident.id)
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
  }, [logs, resident]);

  // For this simplified display, we'll just show the latest few logs without pagination
  const recentLogs = residentLogs.slice(0, 5);

  return (
    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2 text-sm">
      <h3 className="font-semibold text-base mb-2">Información de Cuidado</h3>
      <div className="grid grid-cols-1 gap-4 p-4 border rounded-lg">
          <div className="col-span-full">
              <h4 className="font-semibold">Alergias</h4>
              <div className="flex flex-wrap gap-1 mt-1">{resident.allergies?.length ? resident.allergies.map(a => <Badge key={a} variant="destructive">{a}</Badge>) : <p className="text-muted-foreground">Ninguna</p>}</div>
          </div>
          <div className="col-span-full">
              <h4 className="font-semibold">Medicamentos Recetados</h4>
               {resident.medications?.length ? (
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Medicamento</TableHead>
                              <TableHead>Dosis</TableHead>
                              <TableHead>Frecuencia</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {resident.medications.map((med, index) => (
                             <TableRow key={index}>
                                 <TableCell>{med.name}</TableCell>
                                 <TableCell>{med.dose}</TableCell>
                                 <TableCell>{med.frequency}</TableCell>
                             </TableRow>
                          ))}
                      </TableBody>
                  </Table>
               ) : (
                  <p className="text-muted-foreground">No hay medicamentos recetados.</p>
               )}
          </div>
          <div className="col-span-full">
            <h4 className="font-semibold">Plan de Alimentación</h4>
            <p className="text-muted-foreground">{resident.diet || 'No especificado.'}</p>
          </div>
          <Separator/>
           <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                  <h4 className="font-semibold">Nivel de Dependencia</h4>
                  <Badge variant={resident.dependency === "Dependiente" ? "destructive" : "secondary"}>{resident.dependency}</Badge>
              </div>
              <div>
                  <h4 className="font-semibold">Riesgo de Caída</h4>
                  <Badge variant={resident.fallRisk === "Alto" ? "destructive" : resident.fallRisk === "Medio" ? "secondary" : "default"}>{resident.fallRisk}</Badge>
              </div>
                <div>
                  <h4 className="font-semibold">Tipo de Sangre</h4>
                  <p className="text-muted-foreground">{resident.bloodType}</p>
              </div>
          </div>
      </div>
      
      <Separator className="my-4" />

      <h3 className="font-semibold text-base mb-2">Registros Diarios Recientes</h3>
      <div className="border rounded-lg">
          <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Detalle</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {recentLogs.length > 0 ? recentLogs.map((log) => (
                    <TableRow key={log.id} className="cursor-pointer">
                        <TableCell>{new Date(log.endDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={log.reportType === 'medico' ? 'border-blue-500' : 'border-orange-500'}>
                              {log.reportType === 'medico' ? <Stethoscope className="h-3 w-3 mr-1" /> : <Truck className="h-3 w-3 mr-1" />}
                              {log.reportType === 'medico' ? 'Médico' : 'Suministro'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.reportType === 'medico' 
                              ? (Array.isArray(log.evolutionNotes) ? log.evolutionNotes[0] : log.evolutionNotes) 
                              : log.supplyDescription}
                        </TableCell>
                    </TableRow>
                )) : (
                  <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">No hay registros recientes.</TableCell>
                  </TableRow>
                )}
            </TableBody>
          </Table>
      </div>
    </div>
  );
}
