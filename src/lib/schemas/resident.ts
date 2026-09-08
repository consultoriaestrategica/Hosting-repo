import * as z from "zod"

export const residentFormSchema = z.object({
  // Obligatorios: solo nombre e identificación
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  idNumber: z.string().min(1, { message: "La cédula es obligatoria." }),

  // Opcionales
  dob: z.string().optional().or(z.literal("")),
  gender: z.enum(["Femenino", "Masculino", "Otro"]).optional().or(z.literal("")),
  status: z.enum(["Activo", "Inactivo", "Borrador"]),

  // Medical Info — todos opcionales
  bloodType: z.string().optional().or(z.literal("")),
  fallRisk: z.enum(["Bajo", "Medio", "Alto"]).optional().or(z.literal("")),
  medicalHistory: z.string().optional(),
  surgicalHistory: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.array(z.object({
    name: z.string().min(1, "El nombre no puede estar vacío."),
    dose: z.string().min(1, "La dosis no puede estar vacía."),
    frequency: z.string().min(1, "La frecuencia no puede estar vacía."),
  })).optional(),
  diet: z.string().optional(),
  dependency: z.enum(["Dependiente", "Independiente"]).optional().or(z.literal("")),

  // Family Contacts — opcional (se valida si se agregan)
  familyContacts: z.array(z.object({
      name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
      kinship: z.string().min(2, { message: "El parentesco debe tener al menos 2 caracteres." }),
      address: z.string().min(5, { message: "La dirección debe ser válida." }),
      phones: z.array(z.object({
          number: z.string().min(7, { message: "El teléfono debe ser válido." }),
      })).min(1, "Debe haber al menos un teléfono."),
      email: z.string().email({ message: "Correo electrónico inválido." }),
  })).optional(),

  // Admin Info — todos opcionales
  admissionDate: z.string().optional().or(z.literal("")),
  roomType: z.enum(["Habitación compartida", "Habitación individual"]).optional().or(z.literal("")),
  roomNumber: z.string().optional(),
  documents: z.array(z.object({
    type: z.string(),
    name: z.string(),
    size: z.number(),
  })).optional(),
})

export type ResidentFormValues = z.infer<typeof residentFormSchema>

export const documentTypes = ["Contrato", "Consentimiento Informado", "Cédula de Paciente", "Historia Clínica"]
