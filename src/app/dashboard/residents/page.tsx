
"use client"
import Link from "next/link"
import { PlusCircle, MoreHorizontal, FileText, ClipboardList, Search, Eye } from "lucide-react"
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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useResidents, Resident } from "@/hooks/use-residents"
import { useEffect, useState, useMemo, Suspense } from "react"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import NewLogForm from "./[id]/new-log-form"
import ResidentPreviewDialog from "./resident-preview-dialog"

const ITEMS_PER_PAGE = 8;

function ResidentsPageContent() {
  const { residents, isLoading } = useResidents()
  const [isClient, setIsClient] = useState(false)
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'admin';
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);

  // State for filtering and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setIsClient(true)
  }, [])

  const filteredResidents = useMemo(() => {
    return residents.filter(resident => {
      const nameMatch = resident.name.toLowerCase().includes(searchTerm.toLowerCase());
      const dateMatch = dateFilter ? resident.admissionDate.includes(dateFilter) : true;
      return nameMatch && dateMatch;
    });
  }, [residents, searchTerm, dateFilter]);

  const totalPages = Math.ceil(filteredResidents.length / ITEMS_PER_PAGE);

  const paginatedResidents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredResidents.slice(startIndex, endIndex);
  }, [filteredResidents, currentPage]);


  const handleGenerateReport = (residentName: string) => {
    toast({
      title: "Generando Reporte...",
      description: `Se está creando un reporte en PDF para ${residentName}.`,
    })
  }
  
  const handleAddLogClick = (resident: Resident) => {
    setSelectedResident(resident);
    setIsLogDialogOpen(true);
  }

  const handlePreviewClick = (resident: Resident) => {
    setSelectedResident(resident);
    setIsPreviewDialogOpen(true);
  }

  if (!isClient || isLoading) {
    return <div>Cargando...</div>
  }

  const isFamilyRole = role === 'family';
  const isStaffRole = role === 'staff';

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-3xl font-bold font-headline">Residentes</h1>
        <div className="ml-auto flex items-center gap-2">
          {!isFamilyRole && !isStaffRole && (
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
          <div className="flex items-center gap-4 pt-4">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Buscar por nombre..."
                    className="pl-8 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Input
                type="date"
                placeholder="Filtrar por fecha de ingreso"
                className="w-auto"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
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
              {paginatedResidents.map((resident) => (
                <TableRow key={resident.id}>
                  <TableCell className="font-medium">
                     <Link href={`/dashboard/residents/${resident.id}?role=${role}`} className="hover:underline">
                        {resident.name}
                     </Link>
                  </TableCell>
                  <TableCell>
                     <Badge variant={resident.roomType === "Habitación individual" ? "default" : "secondary"}>
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
                        resident.dependency === "Dependiente"
                          ? "destructive"
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
                        <DropdownMenuItem onClick={() => handlePreviewClick(resident)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Ficha Rápida
                        </DropdownMenuItem>
                        {!isFamilyRole && (
                          <DropdownMenuItem onClick={() => handleAddLogClick(resident)}>
                            <ClipboardList className="mr-2 h-4 w-4" />
                            Agregar Reporte
                          </DropdownMenuItem>
                        )}
                         {role === 'admin' && (
                             <DropdownMenuItem onClick={() => handleGenerateReport(resident.name)}>
                              <FileText className="mr-2 h-4 w-4" />
                              Generar Reporte
                            </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
            <div className="flex justify-between items-center w-full">
                <div className="text-xs text-muted-foreground">
                    Página {currentPage} de {totalPages}
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        Anterior
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        Siguiente
                    </Button>
                </div>
            </div>
        </CardFooter>
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

      {selectedResident && (
        <ResidentPreviewDialog 
            isOpen={isPreviewDialogOpen} 
            onOpenChange={setIsPreviewDialogOpen} 
            resident={selectedResident}
        />
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
