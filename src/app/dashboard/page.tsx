
"use client"
import { useState, useMemo, useEffect } from "react"
import type { DateRange } from "react-day-picker"
import { format, subDays } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, Users, Accessibility, Stethoscope, FilterX, Activity, Truck } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, Cell } from "recharts"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useResidents } from "@/hooks/use-residents"
import { useLogs } from "@/hooks/use-logs"

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function DashboardPage() {
  const { residents, isLoading: residentsLoading } = useResidents()
  const { logs, isLoading: logsLoading } = useLogs()
  const [isClient, setIsClient] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange | undefined>()

  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const isLoading = residentsLoading || logsLoading;

  // --- Data Processing Memos ---

  const filteredResidents = useMemo(() => {
    if (!appliedDateRange?.from) return residents;
    return residents.filter(resident => {
        const admissionDate = new Date(resident.admissionDate);
        const fromDate = appliedDateRange.from;
        const toDate = appliedDateRange.to ? new Date(appliedDateRange.to) : new Date(fromDate);
        if (appliedDateRange.to) toDate.setHours(23, 59, 59, 999);
        return admissionDate >= fromDate && admissionDate <= toDate;
    });
  }, [residents, appliedDateRange]);

  const filteredLogs = useMemo(() => {
    if (!appliedDateRange?.from) return logs;
    return logs.filter(log => {
        if (!log.endDate || isNaN(new Date(log.endDate).getTime())) return false;
        const logDate = new Date(log.endDate);
        const fromDate = appliedDateRange.from;
        const toDate = appliedDateRange.to ? new Date(appliedDateRange.to) : new Date(fromDate);
        if (appliedDateRange.to) toDate.setHours(23, 59, 59, 999);
        return logDate >= fromDate && logDate <= toDate;
    });
  }, [logs, appliedDateRange]);

  const dashboardStats = useMemo(() => {
    const activeResidents = filteredResidents.filter(r => r.status === 'Activo');
    
    const pathologyCounts = activeResidents.flatMap(r => r.pathologies || []).reduce((acc, path) => {
        acc[path] = (acc[path] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const mostCommonPathology = Object.entries(pathologyCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || "N/A";

    const dependencyCounts = activeResidents.reduce((acc, res) => {
        acc[res.dependency] = (acc[res.dependency] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const mostCommonDependency = Object.entries(dependencyCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || "N/A";

    return {
        totalActive: activeResidents.length,
        mostCommonPathology,
        mostCommonDependency
    };
  }, [filteredResidents]);

  const chartData = useMemo(() => {
    const activeResidents = filteredResidents.filter(r => r.status === 'Activo');

    const ageDistribution = activeResidents.reduce((acc, res) => {
        if (res.age >= 70 && res.age <= 75) acc['70-75']++;
        else if (res.age >= 76 && res.age <= 80) acc['76-80']++;
        else if (res.age >= 81 && res.age <= 85) acc['81-85']++;
        else if (res.age > 85) acc['85+']++;
        return acc;
    }, { '70-75': 0, '76-80': 0, '81-85': 0, '85+': 0 });

    const ageDistributionData = Object.entries(ageDistribution).map(([range, total]) => ({ range, total }));

    const pathologyCounts = activeResidents.flatMap(r => r.pathologies || []).reduce((acc, path) => {
        acc[path] = (acc[path] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const pathologyData = Object.entries(pathologyCounts).map(([name, value], i) => ({ name, value, fill: chartColors[i % chartColors.length] }));

    const dependencyCounts = activeResidents.reduce((acc, res) => {
        acc[res.dependency] = (acc[res.dependency] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    const dependencyData = Object.entries(dependencyCounts).map(([name, value], i) => ({ name, value, fill: chartColors[i % chartColors.length] }));
    
    // Last 7 days log activity
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, i)).reverse();
    
    const dailyLogActivity = last7Days.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const logsForDay = logs.filter(log => {
          if (!log.endDate || isNaN(new Date(log.endDate).getTime())) {
            return false;
          }
          return format(new Date(log.endDate), 'yyyy-MM-dd') === dateStr
        });
        return {
            date: format(date, 'MMM d', { locale: es }),
            medico: logsForDay.filter(l => l.reportType === 'medico').length,
            suministro: logsForDay.filter(l => l.reportType === 'suministro').length,
        }
    });

    return { ageDistributionData, pathologyData, dependencyData, dailyLogActivity };

  }, [filteredResidents, logs]);
  
  // --- Event Handlers ---

  const handleApplyFilter = () => {
    setAppliedDateRange(dateRange);
  };

  const handleClearFilter = () => {
    setDateRange(undefined);
    setAppliedDateRange(undefined);
  };

  if (!isClient || isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold font-headline">Panel de Control</h1>
        <div className="flex items-center gap-2">
            <Popover>
                <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                    "w-[260px] justify-start text-left font-normal",
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
                    <span>Seleccione un rango</span>
                    )}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
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
            <Button onClick={handleApplyFilter} disabled={!dateRange}>Aplicar Filtro</Button>
            <Button variant="outline" onClick={handleClearFilter} disabled={!appliedDateRange}>
                <FilterX className="h-4 w-4 mr-2" />
                Limpiar
            </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Residentes Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalActive}</div>
            <p className="text-xs text-muted-foreground">{appliedDateRange ? "En el período seleccionado" : "En total"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dependencia Promedio</CardTitle>
            <Accessibility className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.mostCommonDependency}</div>
            <p className="text-xs text-muted-foreground">Nivel más común entre residentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patología Común</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.mostCommonPathology}</div>
            <p className="text-xs text-muted-foreground">Condición más prevalente</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 mt-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Actividad de Registros Diarios (Últimos 7 Días)</CardTitle>
            <CardDescription>Número de registros médicos y de suministros por día.</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={{}} className="h-[300px] w-full">
              <BarChart data={chartData.dailyLogActivity} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="medico" name="Médico" fill="hsl(var(--chart-1))" radius={8} stackId="a" />
                <Bar dataKey="suministro" name="Suministro" fill="hsl(var(--chart-2))" radius={8} stackId="a" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 mt-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Distribución por Edad</CardTitle>
            <CardDescription>Número de residentes por grupo de edad.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px] w-full">
              <BarChart data={chartData.ageDistributionData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="range" tickLine={false} tickMargin={10} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={8} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Distribución por Patología</CardTitle>
            <CardDescription>Condiciones de salud más comunes.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ChartContainer config={{}} className="h-[300px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie data={chartData.pathologyData} dataKey="value" nameKey="name" innerRadius={60}>
                    {chartData.pathologyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
         <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Distribución del Nivel de Dependencia</CardTitle>
            <CardDescription>Porcentaje de residentes por nivel de dependencia.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
             <ChartContainer config={{}} className="h-[300px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie data={chartData.dependencyData} dataKey="value" nameKey="name" cy="50%">
                    {chartData.dependencyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
