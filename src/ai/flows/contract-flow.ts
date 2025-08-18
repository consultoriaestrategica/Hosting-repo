
'use server';
/**
 * @fileOverview Un agente de IA para la generación de contratos de servicios.
 *
 * - generateContract - Una función que maneja la creación del texto del contrato.
 * - ContractInput - El tipo de entrada para la función generateContract.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// This flow is no longer used for AI generation, but the schema can be kept for validation if needed elsewhere.
const ContractInputSchema = z.object({
  residentName: z.string().describe('El nombre completo del residente.'),
  residentIdNumber: z.string().describe('El número de cédula del residente.'),
  responsiblePartyName: z.string().describe('El nombre completo del familiar o acudiente responsable.'),
  responsiblePartyIdNumber: z.string().describe('El número de cédula del familiar o acudiente responsable.'),
  responsiblePartyKinship: z.string().describe('El parentesco del responsable con el residente (ej. Hijo, Sobrina).'),
  responsiblePartyAddress: z.string().describe('La dirección de residencia del responsable.'),
  startDate: z.string().describe('La fecha de inicio del contrato (YYYY-MM-DD).'),
  endDate: z.string().describe('La fecha de fin del contrato (YYYY-MM-DD).'),
  contractType: z.string().describe('El tipo de contrato (Básica o Premium).'),
  roomType: z.string().describe('El tipo de habitación asignada (Habitación compartida o Habitación individual).'),
  dependencyLevel: z.string().describe('El nivel de dependencia del residente (Dependiente o Independiente).'),
  contractValue: z.string().describe('El valor total mensual del contrato, formateado como moneda (ej. $2,500,000 COP).'),
});
export type ContractInput = z.infer<typeof ContractInputSchema>;

// The AI generation is removed. This function now serves no purpose but is kept to avoid breaking imports.
export async function generateContract(input: ContractInput): Promise<string> {
  console.log("generateContract is deprecated and should not be used for AI generation.");
  return "Contrato no generado por IA.";
}
