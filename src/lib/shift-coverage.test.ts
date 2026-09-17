import { describe, it, expect, vi, beforeEach } from "vitest"

const mockGetDocs = vi.fn()

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
}))

vi.mock("@/lib/firebase", () => ({ db: {} }))

import { getShiftForDate, getShiftWindow, getShiftClosingStatus, calculateShiftCoverage } from "./shift-coverage"

function fakeSnapshot(logs: Array<Record<string, unknown>>) {
  return {
    docs: logs.map((log, i) => ({
      id: (log.id as string) ?? `log-${i}`,
      data: () => log,
    })),
  }
}

// Log medico "base" con TODAS las categorias de dia cubiertas, para que
// cada test solo tenga que romper el campo que le interesa.
function fullDayCoverageLog(overrides: Record<string, unknown> = {}) {
  return {
    id: "log-1",
    reportType: "medico",
    residentId: "r1",
    endDate: "2026-09-15T10:00:00.000Z",
    heartRate: 78,
    respiratoryRate: 16,
    spo2: 97,
    skinStatus: ["Integra"],
    woundCare: true,
    medicationAdmin: true,
    diaperUse: false,
    diuresis: true,
    bowelMovement: true,
    sundowning: false,
    agitation: false,
    physicalTherapy: true,
    occupationalTherapy: false,
    fullMeals: true,
    evolutionEntries: [
      { id: "e1", note: "control", temperature: 36.5, bloodPressureSys: 120, bloodPressureDia: 80, visitType: "Rutina" },
    ],
    ...overrides,
  }
}

describe("getShiftForDate", () => {
  it("clasifica una hora dentro del turno dia", () => {
    const shift = getShiftForDate(new Date(2026, 8, 15, 10, 30))
    expect(shift.type).toBe("dia")
    expect(shift.shiftDate).toBe("2026-09-15")
    expect(shift.start.getHours()).toBe(7)
    expect(shift.end.getHours()).toBe(19)
  })

  it("clasifica una hora despues de las 7pm como turno noche del mismo dia calendario", () => {
    const shift = getShiftForDate(new Date(2026, 8, 15, 22, 0))
    expect(shift.type).toBe("noche")
    expect(shift.shiftDate).toBe("2026-09-15")
  })

  it("clasifica una hora antes de las 7am como turno noche de la fecha calendario anterior", () => {
    const shift = getShiftForDate(new Date(2026, 8, 16, 3, 0))
    expect(shift.type).toBe("noche")
    expect(shift.shiftDate).toBe("2026-09-15")
    expect(shift.end.getDate()).toBe(16)
    expect(shift.end.getHours()).toBe(7)
  })

  it("las 7:00am exactas son turno dia (limite inclusivo)", () => {
    const shift = getShiftForDate(new Date(2026, 8, 15, 7, 0))
    expect(shift.type).toBe("dia")
  })

  it("las 7:00pm exactas son turno noche (limite exclusivo para el dia)", () => {
    const shift = getShiftForDate(new Date(2026, 8, 15, 19, 0))
    expect(shift.type).toBe("noche")
    expect(shift.shiftDate).toBe("2026-09-15")
  })
})

describe("getShiftWindow", () => {
  it("reconstruye la ventana de un turno dia", () => {
    const { start, end } = getShiftWindow("2026-09-15", "dia")
    expect(start.toISOString()).toBe(new Date(2026, 8, 15, 7, 0, 0, 0).toISOString())
    expect(end.toISOString()).toBe(new Date(2026, 8, 15, 19, 0, 0, 0).toISOString())
  })

  it("reconstruye la ventana de un turno noche cruzando medianoche", () => {
    const { start, end } = getShiftWindow("2026-09-15", "noche")
    expect(start.getDate()).toBe(15)
    expect(start.getHours()).toBe(19)
    expect(end.getDate()).toBe(16)
    expect(end.getHours()).toBe(7)
  })
})

describe("calculateShiftCoverage - turno dia", () => {
  beforeEach(() => {
    mockGetDocs.mockReset()
  })

  it("esta completo cuando las 7 categorias estan cubiertas", async () => {
    mockGetDocs.mockResolvedValue(fakeSnapshot([fullDayCoverageLog()]))
    const result = await calculateShiftCoverage("r1", "2026-09-15", "dia")
    expect(result.isComplete).toBe(true)
    expect(result.missing).toEqual([])
  })

  it("falta vitalSigns si falta un solo valor de los 5 (ej. temperatura)", async () => {
    mockGetDocs.mockResolvedValue(
      fakeSnapshot([
        fullDayCoverageLog({
          evolutionEntries: [{ id: "e1", note: "control", bloodPressureSys: 120, bloodPressureDia: 80, visitType: "Rutina" }],
        }),
      ])
    )
    const result = await calculateShiftCoverage("r1", "2026-09-15", "dia")
    expect(result.isComplete).toBe(false)
    expect(result.missing).toContain("vitalSigns")
  })

  it("no cuenta T/A si sys y dia vienen de lecturas distintas", async () => {
    mockGetDocs.mockResolvedValue(
      fakeSnapshot([
        fullDayCoverageLog({
          evolutionEntries: [
            { id: "e1", note: "a", temperature: 36.5, bloodPressureSys: 120, visitType: "Rutina" },
            { id: "e2", note: "b", bloodPressureDia: 80 },
          ],
        }),
      ])
    )
    const result = await calculateShiftCoverage("r1", "2026-09-15", "dia")
    expect(result.missing).toContain("vitalSigns")
  })

  it("junta los 5 signos vitales entre el log inicial y una evolucion parcial distinta", async () => {
    mockGetDocs.mockResolvedValue(
      fakeSnapshot([
        fullDayCoverageLog({
          heartRate: 78,
          respiratoryRate: 16,
          spo2: 97,
          evolutionEntries: [{ id: "e1", note: "control tarde", temperature: 36.5, bloodPressureSys: 120, bloodPressureDia: 80, visitType: "Rutina" }],
        }),
      ])
    )
    const result = await calculateShiftCoverage("r1", "2026-09-15", "dia")
    expect(result.covered).toContain("vitalSigns")
  })

  it("falta nursingCare si solo se contesto curacion pero no medicacion", async () => {
    mockGetDocs.mockResolvedValue(fakeSnapshot([fullDayCoverageLog({ medicationAdmin: undefined })]))
    const result = await calculateShiftCoverage("r1", "2026-09-15", "dia")
    expect(result.missing).toContain("nursingCare")
  })

  it("cuenta nursingCare aunque la respuesta haya sido 'No' (false, no ausente)", async () => {
    mockGetDocs.mockResolvedValue(fakeSnapshot([fullDayCoverageLog({ woundCare: false, medicationAdmin: false })]))
    const result = await calculateShiftCoverage("r1", "2026-09-15", "dia")
    expect(result.covered).toContain("nursingCare")
  })

  it("falta elimination si falta cualquiera de las tres (diuresis, deposicion, panal)", async () => {
    mockGetDocs.mockResolvedValue(fakeSnapshot([fullDayCoverageLog({ diuresis: undefined })]))
    const result = await calculateShiftCoverage("r1", "2026-09-15", "dia")
    expect(result.missing).toContain("elimination")
  })

  it("de dia exige tambien las terapias dentro de comportamientos", async () => {
    mockGetDocs.mockResolvedValue(fakeSnapshot([fullDayCoverageLog({ occupationalTherapy: undefined })]))
    const result = await calculateShiftCoverage("r1", "2026-09-15", "dia")
    expect(result.missing).toContain("behaviors")
  })

  it("feeding se cubre con alimentacion completa O parcial, no exige ambas", async () => {
    mockGetDocs.mockResolvedValue(fakeSnapshot([fullDayCoverageLog({ fullMeals: undefined, partialMeals: true })]))
    const result = await calculateShiftCoverage("r1", "2026-09-15", "dia")
    expect(result.covered).toContain("feeding")
  })

  it("falta evolutionVisitType si ninguna evolucion trae tipo de visita", async () => {
    mockGetDocs.mockResolvedValue(
      fakeSnapshot([fullDayCoverageLog({ evolutionEntries: [{ id: "e1", note: "control", temperature: 36.5, bloodPressureSys: 120, bloodPressureDia: 80 }] })])
    )
    const result = await calculateShiftCoverage("r1", "2026-09-15", "dia")
    expect(result.missing).toContain("evolutionVisitType")
  })

  it("ignora logs de suministro para el calculo de cobertura", async () => {
    mockGetDocs.mockResolvedValue(
      fakeSnapshot([{ id: "log-1", reportType: "suministro", residentId: "r1", endDate: "2026-09-15T10:00:00.000Z", supplyDescription: "panales" }])
    )
    const result = await calculateShiftCoverage("r1", "2026-09-15", "dia")
    expect(result.isComplete).toBe(false)
    expect(result.missing.length).toBeGreaterThan(0)
  })
})

describe("calculateShiftCoverage - turno noche", () => {
  beforeEach(() => {
    mockGetDocs.mockReset()
  })

  function nightLog(overrides: Record<string, unknown> = {}) {
    return {
      id: "log-1",
      reportType: "medico",
      residentId: "r1",
      endDate: "2026-09-15T22:00:00.000Z",
      skinStatus: ["Integra"],
      woundCare: true,
      medicationAdmin: true,
      diaperUse: true,
      diuresis: true,
      bowelMovement: true,
      sundowning: true,
      agitation: true,
      evolutionEntries: [{ id: "e1", note: "ok", visitType: "Seguimiento" }],
      ...overrides,
    }
  }

  it("no exige alimentacion ni terapias de noche", async () => {
    mockGetDocs.mockResolvedValue(fakeSnapshot([nightLog()]))
    const result = await calculateShiftCoverage("r1", "2026-09-15", "noche")
    expect(result.isComplete).toBe(true)
    expect(result.covered).not.toContain("feeding")
  })

  it("no exige signos vitales de noche por defecto", async () => {
    mockGetDocs.mockResolvedValue(fakeSnapshot([nightLog()]))
    const result = await calculateShiftCoverage("r1", "2026-09-15", "noche")
    expect(result.missing).not.toContain("vitalSigns")
    expect(result.covered).not.toContain("vitalSigns")
  })

  it("exige signos vitales de noche solo si requiresNightFollowUp es true", async () => {
    mockGetDocs.mockResolvedValue(fakeSnapshot([nightLog()]))
    const result = await calculateShiftCoverage("r1", "2026-09-15", "noche", { requiresNightFollowUp: true })
    expect(result.missing).toContain("vitalSigns")
  })

  it("no exige glucometria de noche por defecto", async () => {
    mockGetDocs.mockResolvedValue(fakeSnapshot([nightLog()]))
    const result = await calculateShiftCoverage("r1", "2026-09-15", "noche")
    expect(result.missing).not.toContain("glucose")
    expect(result.covered).not.toContain("glucose")
  })

  it("exige glucometria de noche solo si requiresGlucoseMonitoring es true, y basta con una medicion", async () => {
    mockGetDocs.mockResolvedValue(fakeSnapshot([nightLog()]))
    const incomplete = await calculateShiftCoverage("r1", "2026-09-15", "noche", { requiresGlucoseMonitoring: true })
    expect(incomplete.missing).toContain("glucose")

    mockGetDocs.mockResolvedValue(fakeSnapshot([nightLog({ glucoAyuno: 95 })]))
    const complete = await calculateShiftCoverage("r1", "2026-09-15", "noche", { requiresGlucoseMonitoring: true })
    expect(complete.covered).toContain("glucose")
  })

  it("de noche comportamientos solo exige sindrome vespertino y agitacion, no terapias", async () => {
    mockGetDocs.mockResolvedValue(fakeSnapshot([nightLog()]))
    const result = await calculateShiftCoverage("r1", "2026-09-15", "noche")
    expect(result.covered).toContain("behaviors")
  })
})

describe("getShiftClosingStatus", () => {
  const shiftEnd = new Date(2026, 8, 15, 19, 0, 0, 0) // turno dia termina 7:00pm

  it("too-early antes de que termine el turno", () => {
    const now = new Date(2026, 8, 15, 18, 59, 59)
    expect(getShiftClosingStatus(shiftEnd, now)).toBe("too-early")
  })

  it("normal justo al terminar el turno", () => {
    expect(getShiftClosingStatus(shiftEnd, shiftEnd)).toBe("normal")
  })

  it("normal dentro de las 2 horas de gracia", () => {
    const now = new Date(2026, 8, 15, 20, 59, 59)
    expect(getShiftClosingStatus(shiftEnd, now)).toBe("normal")
  })

  it("late justo al cumplirse las 2 horas de gracia", () => {
    const now = new Date(2026, 8, 15, 21, 0, 0)
    expect(getShiftClosingStatus(shiftEnd, now)).toBe("late")
  })

  it("late mucho despues de la ventana normal", () => {
    const now = new Date(2026, 8, 16, 10, 0, 0)
    expect(getShiftClosingStatus(shiftEnd, now)).toBe("late")
  })
})

describe("calculateShiftCoverage - lastVitalsSnapshot y logIds", () => {
  beforeEach(() => {
    mockGetDocs.mockReset()
  })

  it("lastVitalsSnapshot es null si no hay ninguna lectura con valores", async () => {
    mockGetDocs.mockResolvedValue(
      fakeSnapshot([
        fullDayCoverageLog({
          heartRate: undefined,
          respiratoryRate: undefined,
          spo2: undefined,
          evolutionEntries: [{ id: "e1", note: "control", visitType: "Rutina" }],
        }),
      ])
    )
    const result = await calculateShiftCoverage("r1", "2026-09-15", "dia")
    expect(result.lastVitalsSnapshot).toBeNull()
  })

  it("lastVitalsSnapshot toma la lectura mas reciente por timestamp, no la del log inicial", async () => {
    mockGetDocs.mockResolvedValue(
      fakeSnapshot([
        fullDayCoverageLog({
          endDate: "2026-09-15T10:00:00.000Z",
          heartRate: 70,
          respiratoryRate: 14,
          spo2: 95,
          evolutionEntries: [
            { id: "e1", note: "temprano", createdAt: "2026-09-15T09:00:00.000Z", temperature: 36.2, bloodPressureSys: 118, bloodPressureDia: 76, visitType: "Rutina" },
            { id: "e2", note: "tarde", createdAt: "2026-09-15T16:00:00.000Z", temperature: 37.1, bloodPressureSys: 130, bloodPressureDia: 85 },
          ],
        }),
      ])
    )
    const result = await calculateShiftCoverage("r1", "2026-09-15", "dia")
    expect(result.lastVitalsSnapshot).toEqual({ temperature: 37.1, bloodPressureSys: 130, bloodPressureDia: 85 })
  })

  it("logIds incluye logs de suministro aunque no cuenten para la cobertura", async () => {
    mockGetDocs.mockResolvedValue(
      fakeSnapshot([
        fullDayCoverageLog({ id: "log-medico" }),
        { id: "log-suministro", reportType: "suministro", residentId: "r1", endDate: "2026-09-15T12:00:00.000Z", supplyDescription: "panales" },
      ])
    )
    const result = await calculateShiftCoverage("r1", "2026-09-15", "dia")
    expect(result.logIds.sort()).toEqual(["log-medico", "log-suministro"])
  })
})
