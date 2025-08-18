
'use server';
/**
 * @fileOverview Un agente de IA para la generación de contratos de trabajo.
 *
 * - generateStaffContract - Una función que maneja la creación del texto del contrato para el personal.
 * - StaffContractInput - El tipo de entrada para la función generateStaffContract.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const StaffContractInputSchema = z.object({
  staffName: z.string().describe('El nombre completo del empleado.'),
  staffIdNumber: z.string().describe('El número de cédula del empleado.'),
  staffAddress: z.string().describe('La dirección de residencia del empleado.'),
  staffRole: z.string().describe('El cargo que desempeñará el empleado.'),
  staffSalary: z.string().describe('El salario mensual del empleado, formateado como moneda (ej. $2,500,000 COP).'),
  startDate: z.string().describe('La fecha de inicio del contrato (YYYY-MM-DD).'),
  endDate: z.string().describe('La fecha de fin del contrato (YYYY-MM-DD).'),
});

export type StaffContractInput = z.infer<typeof StaffContractInputSchema>;

// The AI generation is removed. This function now serves no purpose but is kept to avoid breaking imports.
export async function generateStaffContract(input: StaffContractInput): Promise<string> {
  console.log("generateStaffContract is deprecated and should not be used for AI generation.");
  return "Contrato no generado por IA.";
}
