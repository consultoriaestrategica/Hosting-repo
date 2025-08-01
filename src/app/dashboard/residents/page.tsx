
"use client"
import Link from "next/link"
import { PlusCircle, MoreHorizontal, FileText, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useResidents } from "@/hooks/use-residents"
import { useEffect, useState, Suspense } from "react"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import NewLogForm from "./[id]/new-log-form"

function ResidentsPageContent() {
  const { residents, isLoading } = useResidents()
  const [isClient, setIsClient] = useState(false)
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'admin';
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<any | null>(null);


  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleGenerateReport = (residentName: string) => {
    toast({
      title: "Generando Reporte...",
      description: `Se está creando un reporte en PDF para ${residentName}.`,
    })
  }
  
  const handleAddLogClick = (resident: any) => {
    setSelectedResident(resident);
    setIsLogDialogOpen(true);
  }

  if (!isClient || isLoading) {
    return <div>Cargando...</div>
  }

  const isFamilyRole = role === 'family';

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-3xl font-bold font-headline">Residentes</h1>
        <div className="ml-auto flex items-center gap-2">
          {!isFamilyRole && (
            <Button size="sm" className="h-8 gap-1" asChild>
              <Link href={`/dashboard/residents/new?role=${role}`}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Agregar Nuevo Residente
                </span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Residentes</CardTitle>
          <CardDescription>
            Administre y vea los detalles de todos los residentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Habitación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>F. de Ingreso</TableHead>
                <TableHead>Nivel de Dependencia</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {residents.map((resident) => (
                <TableRow key={resident.id}>
                  <TableCell className="font-medium">{resident.name}</TableCell>
                  <TableCell>
                     <Badge variant={resident.roomType === "Premium" ? "default" : "secondary"}>
                      {resident.roomType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                     <Badge variant={resident.status === "Activo" ? "default" : "secondary"} className={resident.status === "Activo" ? "bg-green-500 text-white" : ""}>
                      {resident.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{resident.admissionDate}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        resident.dependency === "Alta"
                          ? "destructive"
                          : resident.dependency === "Media"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {resident.dependency}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                           <Link href={`/dashboard/residents/${resident.id}?role=${role}`}>Ver Perfil</Link>
                        </DropdownMenuItem>
                        {!isFamilyRole && (
                          <>
                            <DropdownMenuItem onClick={() => handleAddLogClick(resident)}>
                              <ClipboardList className="mr-2 h-4 w-4" />
                              Agregar Evolución
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleGenerateReport(resident.name)}>
                              <FileText className="mr-2 h-4 w-4" />
                              Generar Reporte
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {selectedResident && (
        <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Agregar Registro de Evolución para {selectedResident.name}</DialogTitle>
                    <DialogDescription>Complete la información de la evolución diaria del residente.</DialogDescription>
                </DialogHeader>
                <NewLogForm residentId={selectedResident.id} onFormSubmit={() => setIsLogDialogOpen(false)} />
            </DialogContent>
        </Dialog>
      )}
    </>
  )
}


export default function ResidentsPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ResidentsPageContent />
    </Suspense>
  )
}
