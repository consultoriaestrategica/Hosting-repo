import { describe, it, expect } from "vitest"
import { hasPermission, type UserRole } from "./user"

// Cierre anticipado de turno (feat/cierre-turno-anticipado): los 4
// roles de personal deben poder cerrar un turno antes de que termine.
// "Acceso Familiar" no es personal y ya no puede cerrar turnos hoy
// (firestore.rules exige isStaff() para crear un shiftClosure), asi
// que es el unico rol sin el permiso.
describe("close_shift_early", () => {
  const staffRoles: UserRole[] = [
    "Administrador",
    "Supervisor",
    "Líder de Enfermería",
    "Personal de Cuidado",
  ]

  it.each(staffRoles)("%s puede cerrar un turno anticipadamente", (role) => {
    expect(hasPermission(role, "close_shift_early")).toBe(true)
  })

  it("Acceso Familiar no puede cerrar un turno anticipadamente", () => {
    expect(hasPermission("Acceso Familiar", "close_shift_early")).toBe(false)
  })

  it("close_shift_override sigue siendo exclusivo de Administrador y Supervisor (sin cambios)", () => {
    expect(hasPermission("Administrador", "close_shift_override")).toBe(true)
    expect(hasPermission("Supervisor", "close_shift_override")).toBe(true)
    expect(hasPermission("Líder de Enfermería", "close_shift_override")).toBe(false)
    expect(hasPermission("Personal de Cuidado", "close_shift_override")).toBe(false)
    expect(hasPermission("Acceso Familiar", "close_shift_override")).toBe(false)
  })
})
