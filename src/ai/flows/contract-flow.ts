
'use server';
/**
 * @fileOverview Un agente de IA para la generación de contratos de servicios.
 *
 * - generateContract - Una función que maneja la creación del texto del contrato.
 * - ContractInput - El tipo de entrada para la función generateContract.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

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
  // New field for the dynamic template
  promptTemplate: z.string().describe('La plantilla de prompt para generar el contrato.'),
});
export type ContractInput = z.infer<typeof ContractInputSchema>;

export async function generateContract(input: ContractInput): Promise<string> {
  const result = await generateContractFlow(input);
  return result;
}

const prompt = ai.definePrompt({
  name: 'contractPrompt',
  input: { schema: ContractInputSchema },
  output: { format: 'text' },
  // Use the template passed in the input
  prompt: `{{{promptTemplate}}}`,
});

const generateContractFlow = ai.defineFlow(
  {
    name: 'generateContractFlow',
    inputSchema: ContractInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
