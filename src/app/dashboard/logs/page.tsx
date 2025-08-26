
"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileWarning } from "lucide-react";

export default function LogsPage() {

  return (
    <div className="w-full h-full flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <FileWarning />
            Página de Registros en Construcción
            </CardTitle>
          <CardDescription>
            Esta sección mostrará un historial global de todos los registros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Actualmente, puedes agregar y ver los registros de cada residente desde su perfil individual en la pestaña "Registros".
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
