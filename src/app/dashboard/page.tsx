"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, Cell } from "recharts"
import { Users, Accessibility, Stethoscope } from "lucide-react"

const ageDistributionData = [
  { range: '70-75', total: 5 },
  { range: '76-80', total: 8 },
  { range: '81-85', total: 12 },
  { range: '85+', total: 6 },
];

const pathologyData = [
  { name: 'Hipertensión', value: 15, fill: "hsl(var(--chart-1))" },
  { name: 'Diabetes', value: 10, fill: "hsl(var(--chart-2))" },
  { name: 'Alzheimer', value: 7, fill: "hsl(var(--chart-3))" },
  { name: 'Artritis', value: 9, fill: "hsl(var(--chart-4))" },
];

const dependencyData = [
  { name: 'Bajo', value: 10, fill: "hsl(var(--chart-1))" },
  { name: 'Medio', value: 15, fill: "hsl(var(--chart-2))" },
  { name: 'Alto', value: 6, fill: "hsl(var(--chart-3))" },
];

export default function DashboardPage() {
  return (
    <>
      <h1 className="text-3xl font-bold font-headline mb-6">Panel de Control</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Residentes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">31</div>
            <p className="text-xs text-muted-foreground">+2 desde el mes pasado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dependencia Promedio</CardTitle>
            <Accessibility className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Media</div>
            <p className="text-xs text-muted-foreground">Basado en evaluaciones actuales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patología Común</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Hipertensión</div>
            <p className="text-xs text-muted-foreground">Condición más prevalente</p>
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
              <BarChart data={ageDistributionData} accessibilityLayer>
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
                <Pie data={pathologyData} dataKey="value" nameKey="name" innerRadius={60}>
                    {pathologyData.map((entry, index) => (
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
                <Pie data={dependencyData} dataKey="value" nameKey="name" cy="50%">
                    {dependencyData.map((entry, index) => (
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
