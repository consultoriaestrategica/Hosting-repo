import * as z from "zod"
import type { UserRole } from "@/types/user"

export const staffFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  idNumber: z.string().min(5, { message: "La cédula debe tener al menos 5 caracteres." }),
  role: z.enum(['Enfermera', 'Médico', 'Fisioterapeuta', 'Administrativo', 'Líder de Enfermería', 'Otro']),
  phone: z.string().min(7, { message: "El teléfono debe ser válido." }),
  email: z.string().email({ message: "Correo electrónico inválido." }),
  address: z.string().min(5, { message: "La dirección debe ser válida." }),
  salary: z.coerce.number().min(0, { message: "El salario debe ser un número positivo." }),
  hireDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha de contratación inválida." }),
  contractType: z.enum(["Término fijo", "Término indefinido"]),
  // Solo obligatorio cuando contractType es "Término fijo" — ver el
  // superRefine de abajo, que es donde se aplica esa condición.
  endDate: z.string().optional(),
  // Requerido solo al crear (un contrato nuevo siempre necesita PDF); en
  // edición puede quedar vacío si no se sube un reemplazo — ese matiz se
  // aplica en el componente según el `mode`, no aquí.
  document: z.any().optional(),
}).superRefine((data, ctx) => {
  if (data.contractType !== "Término fijo") return

  if (!data.endDate || isNaN(Date.parse(data.endDate))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Fecha de fin inválida.", path: ["endDate"] })
    return
  }
  if (new Date(data.endDate) <= new Date(data.hireDate)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La fecha de fin debe ser posterior a la fecha de inicio.", path: ["endDate"] })
  }
})

export type StaffFormValues = z.infer<typeof staffFormSchema>

export const staffPositions = ['Enfermera', 'Médico', 'Fisioterapeuta', 'Administrativo', 'Líder de Enfermería', 'Otro'] as const

/**
 * Mismo criterio que mapRoleFromForm en dashboard/settings/page.tsx: solo
 * "Administrativo" y "Líder de Enfermería" tienen un UserRole propio; el
 * resto de cargos (incluye los que el Select de esta pantalla ofrece y
 * settings no: Enfermera/Médico/Fisioterapeuta/Otro) caen en el mismo
 * fallback "Personal de Cuidado" que ya usa settings.
 */
export function mapPositionToRole(position: string): UserRole {
  const roleMap: Record<string, UserRole> = {
    Administrativo: "Administrador",
    "Líder de Enfermería": "Líder de Enfermería",
  }
  return roleMap[position] ?? "Personal de Cuidado"
}
