
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { generateStaffContract } from "@/ai/flows/staff-contract-flow"
import { Loader2 } from "lucide-react"
import { useSettings } from "@/hooks/use-settings"
import { Staff } from "@/hooks/use-staff"
import { useStaffContracts } from "@/hooks/use-staff-contracts"
import { DialogFooter, DialogClose } from "@/components/ui/dialog"

const contractFormSchema = z.object({
  salary: z.coerce.number().min(0, "El salario debe ser un número positivo."),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha de inicio inválida." }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha de fin inválida." }),
}).refine(data => new Date(data.endDate) > new Date(data.startDate), {
    message: "La fecha de fin debe ser posterior a la fecha de inicio.",
    path: ["endDate"],
});


type ContractFormValues = z.infer<typeof contractFormSchema>

interface NewStaffContractFormProps {
    staffMember: Staff;
    onFormSubmit: () => void;
}

export default function NewStaffContractForm({ staffMember, onFormSubmit }: NewStaffContractFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const { settings } = useSettings()
  const { addContract } = useStaffContracts()
  const [isGenerating, setIsGenerating] = useState(false)

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      salary: staffMember.salary || 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
    },
  })

 async function onSubmit(data: ContractFormValues) {
    setIsGenerating(true)
   
    try {
        const formattedSalary = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(data.salary);

        const contractDetails = await generateStaffContract({
            staffName: staffMember.name,
            staffIdNumber: staffMember.idNumber,
            staffAddress: staffMember.address,
            staffRole: staffMember.role,
            staffSalary: formattedSalary,
            startDate: data.startDate,
            endDate: data.endDate,
            promptTemplate: settings.contractTemplates.staff,
        });

        const newContract = {
            staffId: staffMember.id,
            startDate: data.startDate,
            endDate: data.endDate,
            status: 'Activo',
            salary: data.salary,
            details: contractDetails,
            createdAt: new Date().toISOString()
        };

        const addedContract = addContract(newContract);

        toast({
            title: "Contrato Generado Exitosamente",
            description: `Se ha creado un nuevo contrato para ${staffMember.name}.`,
        });
        
        onFormSubmit();
        router.push(`/dashboard/contracts/${addedContract.id}?type=staff`);

    } catch (error) {
        console.error("Error generating staff contract:", error);
        toast({
            variant: "destructive",
            title: "Error al Generar Contrato",
            description: "No se pudo generar el contrato. Por favor, inténtelo de nuevo.",
        });
    } finally {
        setIsGenerating(false);
    }
  }


  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                    <FormField control={form.control} name="salary" render={({ field }) => (<FormItem><FormLabel>Salario Mensual (COP)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="startDate" render={({ field }) => (<FormItem><FormLabel>Fecha de Inicio</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="endDate" render={({ field }) => (<FormItem><FormLabel>Fecha de Fin</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={isGenerating}>
                        Cancelar
                    </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isGenerating}>
                        {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isGenerating ? "Generando..." : "Generar y Guardar Contrato"}
                    </Button>
                </DialogFooter>
        </form>
    </Form>
  )
}
