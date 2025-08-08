
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Resident } from "@/hooks/use-residents"
import { User } from "lucide-react"

interface ResidentPreviewDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  resident: Resident | null
}

export default function ResidentPreviewDialog({ isOpen, onOpenChange, resident }: ResidentPreviewDialogProps) {
  if (!resident) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
             <User className="mr-2" />
             Ficha Rápida del Residente
          </DialogTitle>
          <DialogDescription>
            Información médica y de cuidado para {resident.name}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2 text-sm">
           <div className="grid grid-cols-2 gap-4">
              <div>
                  <h3 className="font-semibold">Nivel de Dependencia</h3>
                  <Badge variant={resident.dependency === "Dependiente" ? "destructive" : "secondary"}>{resident.dependency}</Badge>
              </div>
              <div>
                  <h3 className="font-semibold">Riesgo de Caída</h3>
                  <Badge variant={resident.fallRisk === "Alto" ? "destructive" : resident.fallRisk === "Medio" ? "secondary" : "default"}>{resident.fallRisk}</Badge>
              </div>
                <div>
                  <h3 className="font-semibold">Tipo de Sangre</h3>
                  <p className="text-muted-foreground">{resident.bloodType}</p>
              </div>
          </div>
        <Separator />
        <div>
          <h3 className="font-semibold">Patologías Principales</h3>
          <div className="flex flex-wrap gap-2 mt-1">{resident.pathologies?.map(p => <Badge key={p} variant="outline">{p}</Badge>)}</div>
        </div>
          <Separator />
          <div>
          <h3 className="font-semibold">Alergias</h3>
            <div className="flex flex-wrap gap-2 mt-1">{resident.allergies?.map(a => <Badge key={a} variant="destructive">{a}</Badge>)}</div>
        </div>
          <Separator />
          <div>
          <h3 className="font-semibold">Medicamentos Recetados</h3>
            <Table>
              <TableHeader>
                  <TableRow>
                      <TableHead>Medicamento</TableHead>
                      <TableHead>Dosis</TableHead>
                      <TableHead>Frecuencia</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {resident.medications?.map((med, index) => (
                      <TableRow key={index}>
                          <TableCell>{med.name}</TableCell>
                          <TableCell>{med.dose}</TableCell>
                          <TableCell>{med.frequency}</TableCell>
                      </TableRow>
                  ))}
              </TableBody>
            </Table>
        </div>
          <Separator />
          <div>
          <h3 className="font-semibold">Plan de Alimentación</h3>
          <p className="text-muted-foreground">{resident.diet}</p>
        </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button">Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

    