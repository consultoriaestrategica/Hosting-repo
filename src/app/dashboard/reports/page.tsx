
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { useResidents } from "@/hooks/use-residents"
import { cn } from "@/lib/utils"
import { FileDown, Users, User, Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { DateRange } from "react-day-picker"


export default function ReportsPage() {
  const { toast } = useToast()
  const { residents, isLoading: residentsLoading } = useResidents()

  const [selectedResident, setSelectedResident] = useState<string>("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const handleGenerateReport = (reportType: string, params?: any) => {
    let description = `Se está generando el ${reportType}.`;
    if (params?.residentName) {
        description = `Se está generando el ${reportType} para ${params.residentName}.`
    }
    if (params?.dateRange) {
        description = `Se está generando el ${reportType} para el período seleccionado.`
    }

    toast({
      title: "Solicitud de Reporte Recibida",
      description,
    })
  }

  if (residentsLoading) {
    return <div>Cargando residentes...</div>
  }

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-3xl font-bold font-headline">Generador de Reportes</h1>
      </div>

      <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Reporte General de Residentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              Reporte General de Residentes
            </CardTitle>
            <CardDescription>
              Genera un listado en PDF con todos los residentes activos, su habitación y nivel de dependencia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Opciones adicionales pueden ir aquí en el futuro */}
            <p className="text-sm text-muted-foreground">Este reporte no requiere parámetros adicionales.</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => handleGenerateReport("Reporte General de Residentes")}>
              <FileDown className="mr-2 h-4 w-4" />
              Generar PDF
            </Button>
          </CardFooter>
        </Card>

        {/* Reporte Individual de Residente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-6 w-6" />
              Reporte Individual Detallado
            </CardTitle>
            <CardDescription>
              Crea un informe completo en PDF con toda la información de un residente específico.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select onValueChange={setSelectedResident} value={selectedResident}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un residente..." />
              </SelectTrigger>
              <SelectContent>
                {residents.map((resident) => (
                  <SelectItem key={resident.id} value={resident.id}>
                    {resident.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
          <CardFooter>
            <Button 
                className="w-full" 
                disabled={!selectedResident}
                onClick={() => {
                    const residentName = residents.find(r => r.id === selectedResident)?.name;
                    handleGenerateReport("Reporte Individual", { residentName })
                }}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Generar PDF
            </Button>
          </CardFooter>
        </Card>
        
        {/* Reporte de Registros por Fecha */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-6 w-6" />
                Reporte de Registros por Fecha
            </CardTitle>
            <CardDescription>
              Genera un informe con todos los registros (médicos y de suministros) dentro de un rango de fechas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y", { locale: es })} -{" "}
                        {format(dateRange.to, "LLL dd, y", { locale: es })}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y", { locale: es })
                    )
                  ) : (
                    <span>Seleccione un rango de fechas</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </CardContent>
          <CardFooter>
             <Button 
                className="w-full" 
                disabled={!dateRange?.from || !dateRange?.to}
                onClick={() => handleGenerateReport("Reporte de Registros", { dateRange })}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Generar PDF
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  )
}
