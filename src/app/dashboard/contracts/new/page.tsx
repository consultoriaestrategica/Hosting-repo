"use client"

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useResidents } from "@/hooks/use-residents"
import { useContracts } from "@/hooks/use-contracts"
import { useSettings } from "@/hooks/use-settings"
import { useState } from "react"
import { generateContract } from "@/ai/flows/contract-flow"
import { Loader2 } from "lucide-react"

const contractFormSchema = z.object({
  residentId: z.string({ required_error: "Debe seleccionar un residente." }),
  contractType: z.enum(["Básica", "Premium"], { required_error: "Debe seleccionar un tipo de contrato." }),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha de inicio inválida." }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha de fin inválida." }),
}).refine(data => new Date(data.endDate) > new Date(data.startDate), {
    message: "La fecha de fin debe ser posterior a la fecha de inicio.",
    path: ["endDate"],
});


type ContractFormValues = z.infer<typeof contractFormSchema>

export default function NewContractPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { residents } = useResidents()
  const { addContract } = useContracts()
  const { settings } = useSettings()
  const [isGenerating, setIsGenerating] = useState(false)

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      residentId: "",
      contractType: undefined,
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
    },
  })

 async function onSubmit(data: ContractFormValues) {
    setIsGenerating(true)
    const resident = residents.find(r => r.id === data.residentId);

    if (!resident) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo encontrar al residente seleccionado." });
      setIsGenerating(false);
      return;
    }
    
    const responsibleParty = resident.familyContacts?.[0];
    if(!responsibleParty) {
        toast({ variant: "destructive", title: "Error", description: "El residente no tiene un contacto familiar principal asignado." });
        setIsGenerating(false);
        return;
    }

    try {
        const baseValue = settings.prices[data.contractType];
        const vatRate = settings.vatEnabled ? (settings.vatRate || 0) / 100 : 0;
        const totalValue = baseValue * (1 + vatRate);
        const formattedTotalValue = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(totalValue);

        const contractDetails = await generateContract({
            residentName: resident.name,
            residentIdNumber: resident.idNumber,
            responsiblePartyName: responsibleParty.name,
            responsiblePartyIdNumber: "N/A", // This should be added to the resident model
            responsiblePartyKinship: responsibleParty.kinship,
            responsiblePartyAddress: responsibleParty.address,
            startDate: data.startDate,
            endDate: data.endDate,
            contractType: data.contractType,
            roomType: resident.roomType,
            dependencyLevel: resident.dependency,
            contractValue: formattedTotalValue,
        });

        const newContract = {
            residentId: data.residentId,
            contractType: data.contractType,
            startDate: data.startDate,
            endDate: data.endDate,
            status: 'Activo',
            details: contractDetails,
            createdAt: new Date().toISOString()
        };

        const addedContract = addContract(newContract);

        toast({
            title: "Contrato Generado Exitosamente",
            description: `Se ha creado un nuevo contrato para ${resident.name}.`,
        });

        router.push(`/dashboard/contracts/${addedContract.id}`);

    } catch (error) {
        console.error("Error generating contract:", error);
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
    <>
      <h1 className="text-3xl font-bold font-headline mb-6">Generar Nuevo Contrato</h1>
      <Card>
        <CardHeader>
            <CardTitle>Datos del Contrato</CardTitle>
            <CardDescription>Seleccione el residente y especifique los términos del contrato. La IA generará el documento.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                     <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FormField
                            control={form.control}
                            name="residentId"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Residente</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Seleccione un residente" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {residents.filter(r => r.status === 'Activo' && r.familyContacts && r.familyContacts.length > 0).map(r => (<SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>))}
                                </SelectContent>
                                </Select>
                                 <FormDescription>Solo se muestran residentes con un contacto familiar.</FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="contractType"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Contrato</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Seleccione un tipo" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Básica">Servicios Básicos</SelectItem>
                                    <SelectItem value="Premium">Servicios Premium</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormDescription>El tipo de habitación se toma del perfil del residente.</FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField control={form.control} name="startDate" render={({ field }) => (<FormItem><FormLabel>Fecha de Inicio</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="endDate" render={({ field }) => (<FormItem><FormLabel>Fecha de Fin</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                     </div>
                     <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isGenerating}>
                        Cancelar
                        </Button>
                        <Button type="submit" disabled={isGenerating}>
                            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isGenerating ? "Generando..." : "Generar y Guardar Contrato"}
                        </Button>
                    </div>
                </form>
            </Form>
        </CardContent>
      </Card>
    </>
  )
}
