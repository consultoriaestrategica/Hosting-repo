"use client"
import { useState } from "react";
import type { Staff } from "@/hooks/use-staff"; 

// Hooks
import { useToast } from "@/hooks/use-toast";
import { useStaffContracts } from "@/hooks/use-staff-contracts";

// Componentes de UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

// Define las propiedades que el componente recibirá de la página padre
interface NewStaffContractFormProps {
  staffMember: Staff;
  onFormSubmit: () => void; // Función para cerrar el modal
}

export default function NewStaffContractForm({ staffMember, onFormSubmit }: NewStaffContractFormProps) {
  const { toast } = useToast();
  const { addStaffContract, isLoading } = useStaffContracts();
  
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [salary, setSalary] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveContract = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!contractFile || !startDate || !endDate || !salary) {
      toast({ variant: "destructive", title: "Campos Incompletos", description: "Por favor, complete todos los campos del contrato." });
      return;
    }
    
    if (new Date(endDate) <= new Date(startDate)) {
        toast({ variant: "destructive", title: "Error de Fechas", description: "La fecha de fin debe ser posterior a la fecha de inicio." });
        return;
    }

    setIsSaving(true);
    
    try {
        // En un escenario real, aquí se haría la subida del archivo a Firebase Storage
        // Para este ejemplo, simularemos la creación del contrato
        
        const newContractData = {
            staffId: staffMember.id,
            startDate: startDate,
            endDate: endDate,
            salary: Number(salary),
            status: 'Activo' as const,
            documentName: contractFile.name,
            documentUrl: "url/simulada/al/documento.pdf", // URL de marcador de posición
            createdAt: new Date().toISOString()
        };

        await addStaffContract(newContractData);

        toast({ title: "¡Contrato Guardado!", description: `El nuevo contrato para ${staffMember.name} ha sido creado.` });
        onFormSubmit(); // Llama a la función del padre para cerrar el modal

    } catch (error) {
      console.error("Error al guardar el contrato:", error);
      toast({ variant: "destructive", title: "Error de guardado", description: "No se pudo guardar el contrato." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveContract} className="space-y-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="start-date">Fecha de Inicio</Label>
                <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="end-date">Fecha de Fin</Label>
                <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                />
            </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="salary">Salario Mensual (COP)</Label>
            <Input
                id="salary"
                type="number"
                placeholder="2500000"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                required
            />
        </div>
      <div className="space-y-2">
        <Label htmlFor="contract-file">Documento del Contrato (PDF)</Label>
        <Input
          id="contract-file"
          type="file"
          accept=".pdf"
          onChange={(e) => setContractFile(e.target.files ? e.target.files[0] : null)}
          required
        />
      </div>

      <DialogFooter>
        <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onFormSubmit}>Cancelar</Button>
        </DialogClose>
        <Button type="submit" disabled={isSaving || isLoading}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
          {isSaving ? "Guardando..." : "Guardar Contrato"}
        </Button>
      </DialogFooter>
    </form>
  );
}
