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
  startDate: z.string().describe('La fecha de inicio del contrato (YYYY-MM-DD).'),
  endDate: z.string().describe('La fecha de fin del contrato (YYYY-MM-DD).'),
  contractType: z.string().describe('El tipo de contrato (Básica o Premium).'),
  roomType: z.string().describe('El tipo de habitación asignada (Básica o Premium).'),
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
  prompt: `
  Eres un asistente legal experto en la redacción de contratos de servicios para hogares geriátricos.
  Tu tarea es generar el texto completo de un contrato de prestación de servicios en formato Markdown.
  El tono debe ser formal, claro y profesional.
  
  Utiliza los siguientes datos para personalizar el contrato:
  - **Residente (El Contratante):** {{{residentName}}}
  - **Cédula del Residente:** {{{residentIdNumber}}}
  - **Fecha de Inicio:** {{{startDate}}}
  - **Fecha de Fin:** {{{endDate}}}
  - **Plan de Servicios Contratado:** Plan {{{contractType}}}
  - **Tipo de Habitación Asignada:** {{{roomType}}}

  El contrato debe incluir las siguientes cláusulas, adaptando el contenido según el plan contratado:

  1.  **PARTES:** Identifica al hogar geriátrico "Hogar Geriátrico Ángel Guardián" (El Contratista) y al residente (El Contratante) con su nombre y cédula.
  2.  **OBJETO:** Describe el objeto del contrato, que es la prestación de servicios de cuidado y asistencia al adulto mayor.
  3.  **SERVICIOS INCLUIDOS:** Detalla los servicios incluidos. Debe haber una lista base y servicios adicionales para el plan Premium.
      *   **Servicios Base (para ambos planes):**
          *   Alojamiento en habitación (especificar si es Básica o Premium).
          *   Alimentación completa (desayuno, almuerzo, cena y dos refrigerios).
          *   Cuidados de enfermería básicos 24/7.
          *   Actividades recreativas y terapéuticas grupales.
          *   Servicio de lavandería para ropa de cama y toallas.
      *   **Servicios Adicionales (SOLO para el Plan Premium):**
          *   Atención médica especializada mensual.
          *   Sesiones de fisioterapia personalizadas (2 por semana).
          *   Servicio de lavandería para ropa personal.
          *   Acceso a sala de entretenimiento premium.
  4.  **DURACIÓN:** Especifica la duración del contrato usando la fecha de inicio y fin.
  5.  **VALOR Y FORMA DE PAGO:** Establece un valor mensual ficticio. Para el plan Básico, usa $2,000,000 COP. Para el plan Premium, usa $3,500,000 COP. Menciona que el pago debe realizarse los primeros 5 días de cada mes.
  6.  **OBLIGACIONES DE LAS PARTES:** Detalla las obligaciones tanto del hogar geriátrico como del residente/familiares.
  7.  **FIRMAS:** Deja espacios para las firmas del representante legal del hogar y del contratante.

  Formatea el resultado final en **Markdown**, utilizando encabezados (#, ##), negritas (**) y listas (*).
  NO incluyas ninguna explicación o texto introductorio antes del contrato. El resultado debe empezar directamente con el título del contrato.
  `,
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
