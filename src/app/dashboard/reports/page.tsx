
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
import { useLogs } from "@/hooks/use-logs"
import { generatePdfReport, ReportInput } from "@/ai/flows/report-flow"
import { cn } from "@/lib/utils"
import { FileDown, Users, User, Calendar as CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { DateRange } from "react-day-picker"


export default function ReportsPage() {
  const { toast } = useToast()
  const { residents, isLoading: residentsLoading } = useResidents()
  const { logs, isLoading: logsLoading } = useLogs()

  const [selectedResidentId, setSelectedResidentId] = useState<string>("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [isGenerating, setIsGenerating] = useState(false);

  const downloadPdf = (base64: string, fileName: string) => {
    const linkSource = `data:application/pdf;base64,${base64}`;
    const downloadLink = document.createElement("a");
    downloadLink.href = linkSource;
    downloadLink.download = fileName;
    downloadLink.click();
  }


  const handleGenerateReport = async (reportType: 'general' | 'individual' | 'dateRange') => {
    setIsGenerating(true);
    let reportInput: ReportInput | null = null;
    let residentName: string | undefined;

    try {
        switch(reportType) {
            case 'general':
                reportInput = { reportType: 'general', data: { residents } };
                break;
            case 'individual':
                const resident = residents.find(r => r.id === selectedResidentId);
                if (!resident) {
                    toast({ variant: 'destructive', title: 'Error', description: 'Por favor seleccione un residente válido.' });
                    setIsGenerating(false);
                    return;
                }
                residentName = resident.name;
                reportInput = { reportType: 'individual', data: { resident } };
                break;
            case 'dateRange':
                if (!dateRange?.from || !dateRange?.to) {
                     toast({ variant: 'destructive', title: 'Error', description: 'Por favor seleccione un rango de fechas válido.' });
                     setIsGenerating(false);
                     return;
                }
                const filteredLogs = logs.filter(log => {
                    const logDate = new Date(log.endDate);
                    return logDate >= dateRange.from! && logDate <= dateRange.to!;
                });
                reportInput = { reportType: 'dateRange', data: { logs: filteredLogs, range: { from: dateRange.from.toISOString(), to: dateRange.to.toISOString() } } };
                break;
        }

        toast({
          title: "Generando Reporte...",
          description: "Esto puede tardar unos segundos. Por favor espere.",
        })
        
        const result = await generatePdfReport(reportInput);
        
        downloadPdf(result.pdfBase64, result.fileName);
        
        toast({
            title: "Reporte Generado",
            description: "El PDF se ha descargado exitosamente.",
        });

    } catch (error) {
        console.error("Failed to generate report:", error);
        toast({
            variant: "destructive",
            title: "Error al Generar Reporte",
            description: "No se pudo crear el PDF. Por favor, inténtelo de nuevo.",
        });
    } finally {
        setIsGenerating(false);
    }
  }

  const isLoading = residentsLoading || logsLoading;

  if (isLoading) {
    return <div>Cargando...</div>
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
            <p className="text-sm text-muted-foreground">Este reporte no requiere parámetros adicionales.</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => handleGenerateReport("general")} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
              {isGenerating ? 'Generando...' : 'Generar PDF'}
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
            <Select onValueChange={setSelectedResidentId} value={selectedResidentId}>
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
                disabled={!selectedResidentId || isGenerating}
                onClick={() => handleGenerateReport("individual")}
            >
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
              {isGenerating ? 'Generando...' : 'Generar PDF'}
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
                disabled={!dateRange?.from || !dateRange?.to || isGenerating}
                onClick={() => handleGenerateReport("dateRange")}
            >
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
              {isGenerating ? 'Generando...' : 'Generar PDF'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  )
}
