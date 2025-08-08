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
  roomType: z.string().describe('El tipo de habitación asignada (Básica o Premium).'),
  dependencyLevel: z.string().describe('El nivel de dependencia del residente (Dependiente o Independiente).')
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
  Eres un asistente legal experto en la redacción de contratos de servicios para hogares geriátricos en Colombia.
  Tu tarea es generar el texto completo de un contrato de prestación de servicios en formato Markdown, siguiendo la estructura y el tono formal del modelo proporcionado.

  **Utiliza los siguientes datos para personalizar el contrato:**

  *   **Hogar Geriátrico:** "Hogar Geriátrico Ángel Guardián" con NIT "900.123.456-7", ubicado en "Calle de la Serenidad 123, Bogotá D.C.", representado por "Dr. Ana María Rojas".
  *   **Residente:** {{{residentName}}} (C.C. {{{residentIdNumber}}}).
  *   **Responsable Solidario:** {{{responsiblePartyName}}} (C.C. {{{responsiblePartyIdNumber}}}), con domicilio en {{{responsiblePartyAddress}}}, en calidad de {{{responsiblePartyKinship}}}.
  *   **Fecha de Inicio:** {{{startDate}}}
  *   **Fecha de Fin:** {{{endDate}}}
  *   **Plan Contratado:** Plan {{{contractType}}}
  *   **Habitación Asignada:** {{{roomType}}}
  *   **Nivel de Dependencia:** {{{dependencyLevel}}}

  **Estructura del Contrato:**

  **Título:** CONTRATO DE PRESTACIÓN DE SERVICIOS DE CUIDADO Y BIENESTAR PARA EL ADULTO MAYOR

  1.  **PARTES:** Identifica a "EL HOGAR" (Hogar Geriátrico Ángel Guardián), "EL RESPONSABLE" (con su nombre, cédula, parentesco y domicilio) y "EL RESIDENTE" (con su nombre y cédula).

  2.  **CLÁUSULA PRIMERA - OBJETO:** Describe la prestación de servicios integrales. Detalla los servicios incluidos según el plan contratado.
      *   **Alojamiento:** Especifica el tipo de habitación ({{{roomType}}}).
      *   **Alimentación:** Cinco comidas diarias.
      *   **Cuidado y Asistencia:** Supervisión 24/7 para actividades de la vida diaria, adaptado al nivel de dependencia ({{{dependencyLevel}}}).
      *   **Administración de Medicamentos.**
      *   **Actividades Terapéuticas y Recreativas.**
      *   **Servicios Adicionales (SOLO para Plan Premium):**
          *   Atención médica especializada mensual.
          *   Sesiones de fisioterapia personalizadas (2 por semana).
          *   Acceso a sala de entretenimiento premium.

  3.  **CLÁUSULA SEGUNDA - VALOR Y FORMA DE PAGO:**
      *   Establece el valor mensual. Para el **Plan Básico, usa $2,000,000 COP**. Para el **Plan Premium, usa $3,500,000 COP**.
      *   Indica que el pago es anticipado dentro de los primeros 5 días hábiles de cada mes.

  4.  **CLÁUSULA TERCERA - OBLIGACIONES DE EL HOGAR:** Lista las responsabilidades del hogar.

  5.  **CLÁUSULA CUARTA - OBLIGACIONES DE EL RESPONSABLE:** Lista las responsabilidades del acudiente, incluyendo el suministro de medicamentos y elementos de uso personal.

  6.  **CLÁUSULA QUINTA - DURACIÓN:** Especifica la duración del contrato usando la fecha de inicio y fin proporcionadas.

  7.  **CLÁUSULA SEXTA - FIRMAS:** Deja espacios para las firmas de "EL HOGAR" (Representante Legal), "EL RESPONSABLE" y "EL RESIDENTE".

  **Instrucciones Finales:**
  *   Formatea el resultado final en **Markdown**, utilizando encabezados (#, ##), negritas (**) y listas (*).
  *   NO incluyas ninguna explicación o texto introductorio antes del contrato.
  *   El resultado debe empezar directamente con el título "CONTRATO DE PRESTACIÓN DE SERVICIOS...".
  *   Mantén un lenguaje formal y legal apropiado para Colombia.
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
