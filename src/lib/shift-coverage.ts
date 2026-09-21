import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Log, MedicalLogFields } from "@/hooks/use-logs"

// ============================================================
// TURNOS
// ============================================================

export type ShiftType = "dia" | "noche"

export interface Shift {
  type: ShiftType
  start: Date
  end: Date
  shiftDate: string // "YYYY-MM-DD", fecha calendario dueña del turno
}

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// Dado un shiftDate + shiftType ya conocidos, reconstruye su ventana
// horaria. Es la inversa de getShiftForDate: esta se usa cuando ya se
// sabe a que turno se refiere (ej. al calcular cobertura), esa otra
// cuando se tiene un instante cualquiera y hay que determinar el turno.
export function getShiftWindow(shiftDate: string, shiftType: ShiftType): { start: Date; end: Date } {
  const [y, m, d] = shiftDate.split("-").map(Number)
  if (shiftType === "dia") {
    return {
      start: new Date(y, m - 1, d, 7, 0, 0, 0),
      end: new Date(y, m - 1, d, 19, 0, 0, 0),
    }
  }
  return {
    start: new Date(y, m - 1, d, 19, 0, 0, 0),
    end: new Date(y, m - 1, d + 1, 7, 0, 0, 0),
  }
}

// Turno dia: 7:00am - 7:00pm del mismo dia calendario.
// Turno noche: 7:00pm - 7:00am del dia siguiente; pertenece, para
// efectos de reporte, a la fecha calendario de su inicio (7pm), no a
// la de medianoche.
export function getShiftForDate(date: Date): Shift {
  const hour = date.getHours()
  const isDayShift = hour >= 7 && hour < 19

  const ownerDate = new Date(date)
  if (!isDayShift && hour < 7) {
    // 12am-7am pertenece al turno noche que empezo la noche anterior.
    ownerDate.setDate(ownerDate.getDate() - 1)
  }

  const shiftType: ShiftType = isDayShift ? "dia" : "noche"
  const shiftDate = toDateKey(ownerDate)
  const { start, end } = getShiftWindow(shiftDate, shiftType)

  return { type: shiftType, start, end, shiftDate }
}

// ============================================================
// VENTANA PARA CERRAR UN TURNO (Fase 3)
// ============================================================

export type ClosingStatus = "too-early" | "normal" | "late"

// Confirmado con el cliente: 2 horas de gracia despues del fin del
// turno para cerrar sin necesitar el permiso close_shift_override.
const NORMAL_CLOSE_GRACE_HOURS = 2

// too-early: antes de que termine el turno -> bloqueo absoluto, nadie
//   puede cerrar, ni siquiera un supervisor (la spec no da excepcion
//   para esto, solo para el cierre tardio).
// normal: entre el fin del turno y el fin + 2h -> cualquier staff con
//   create_reports/edit_reports.
// late: despues de esas 2h -> requiere el permiso close_shift_override
//   (Administrador/Supervisor) y el cierre queda marcado isLate: true.
export function getShiftClosingStatus(shiftEnd: Date, now: Date): ClosingStatus {
  if (now < shiftEnd) return "too-early"
  const graceEnd = new Date(shiftEnd.getTime() + NORMAL_CLOSE_GRACE_HOURS * 60 * 60 * 1000)
  return now < graceEnd ? "normal" : "late"
}

// ============================================================
// COBERTURA DE CAMPOS OBLIGATORIOS
// ============================================================

export interface CoverageResult {
  covered: string[]
  missing: string[]
  isComplete: boolean
  // La lectura de signos vitales mas reciente del turno (para
  // confirmar en el cierre, no para re-ingresar). `null` si no hubo
  // ninguna lectura con al menos un valor.
  lastVitalsSnapshot: VitalReading | null
  // TODOS los logs del turno (medicos Y de suministro) — se usa para
  // marcar lockedInClosure en cada uno al cerrar (Fase 3). La
  // cobertura en si solo mira los medicos.
  logIds: string[]
}

export interface ShiftCoverageOptions {
  // Si el turno dia de este residente/fecha marco "requiere seguimiento
  // nocturno". Se pasa explicito en vez de consultarse aca porque
  // shiftClosures todavia no existe como coleccion (se conecta en Fase 3).
  requiresNightFollowUp?: boolean
  // Viene de Resident.requiresGlucoseMonitoring (Fase 1).
  requiresGlucoseMonitoring?: boolean
}

type MedicalLog = Log & MedicalLogFields

const VITAL_SCALAR_FIELDS = ["heartRate", "respiratoryRate", "spo2", "temperature"] as const
const GLUCOSE_FIELDS = [
  "glucoAyuno",
  "glucoAntesAlmuerzo",
  "glucoAntesCena",
  "gluco2hAlmuerzo",
  "gluco2hCena",
] as const

async function fetchLogsInWindow(residentId: string, start: Date, end: Date): Promise<Log[]> {
  const logsRef = collection(db, "logs")
  const q = query(
    logsRef,
    where("residentId", "==", residentId),
    where("endDate", ">=", start.toISOString()),
    where("endDate", "<", end.toISOString())
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Log)
}

// Una "lectura" de signos vitales: el Log inicial solo llega a tener
// heartRate/respiratoryRate/spo2 (ver new-log-form.tsx); temperatura y
// T/A solo existen dentro de evolutionEntries. Se modelan por separado
// para no depender de que MedicalLog declare campos que en la practica
// nunca tiene a nivel de Log.
export interface VitalReading {
  heartRate?: number
  respiratoryRate?: number
  spo2?: number
  temperature?: number
  bloodPressureSys?: number
  bloodPressureDia?: number
}

interface TimestampedVitalReading extends VitalReading {
  at: string // ISO; usado solo para elegir la lectura mas reciente
}

function collectVitalReadings(logs: MedicalLog[]): TimestampedVitalReading[] {
  const readings: TimestampedVitalReading[] = []
  for (const log of logs) {
    readings.push({ at: log.endDate, heartRate: log.heartRate, respiratoryRate: log.respiratoryRate, spo2: log.spo2 })
    for (const entry of log.evolutionEntries ?? []) {
      readings.push({
        at: entry.createdAt ?? log.endDate,
        heartRate: entry.heartRate,
        respiratoryRate: entry.respiratoryRate,
        spo2: entry.spo2,
        temperature: entry.temperature,
        bloodPressureSys: entry.bloodPressureSys,
        bloodPressureDia: entry.bloodPressureDia,
      })
    }
  }
  return readings
}

// Cada valor escalar cuenta con que aparezca en CUALQUIER lectura del
// turno (no necesariamente la misma). T/A es la excepcion: sys y dia
// deben venir juntos de una misma lectura, porque una presion arterial
// siempre se toma como par.
function vitalSignsComplete(logs: MedicalLog[]): boolean {
  const readings = collectVitalReadings(logs)
  const scalarsCovered = VITAL_SCALAR_FIELDS.every((field) => readings.some((r) => r[field] !== undefined))
  const bloodPressureCovered = readings.some((r) => r.bloodPressureSys !== undefined && r.bloodPressureDia !== undefined)
  return scalarsCovered && bloodPressureCovered
}

// La lectura completa (no ensamblada campo por campo) mas reciente por
// timestamp, para mostrarla "tal cual quedo" en el cierre. Distinto de
// vitalSignsComplete(), que si ensambla los 5 valores desde fuentes
// distintas para validar cobertura.
function getLastVitalsReading(logs: MedicalLog[]): VitalReading | null {
  const readings = collectVitalReadings(logs).filter(
    (r) =>
      r.heartRate !== undefined ||
      r.respiratoryRate !== undefined ||
      r.spo2 !== undefined ||
      r.temperature !== undefined ||
      r.bloodPressureSys !== undefined ||
      r.bloodPressureDia !== undefined
  )
  if (readings.length === 0) return null

  readings.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  const { at, ...vitals } = readings[0]
  return vitals
}

function anyLogFieldPresent(logs: MedicalLog[], field: keyof MedicalLogFields): boolean {
  return logs.some((log) => log[field] !== undefined)
}

function skinStatusCovered(logs: MedicalLog[]): boolean {
  return logs.some((log) => (log.skinStatus?.length ?? 0) > 0)
}

function feedingCovered(logs: MedicalLog[]): boolean {
  return anyLogFieldPresent(logs, "fullMeals") || anyLogFieldPresent(logs, "partialMeals")
}

function nursingCareCovered(logs: MedicalLog[]): boolean {
  return anyLogFieldPresent(logs, "woundCare") && anyLogFieldPresent(logs, "medicationAdmin")
}

function eliminationCovered(logs: MedicalLog[]): boolean {
  return (
    anyLogFieldPresent(logs, "diaperUse") &&
    anyLogFieldPresent(logs, "diuresis") &&
    anyLogFieldPresent(logs, "bowelMovement")
  )
}

function behaviorsCovered(logs: MedicalLog[], shiftType: ShiftType): boolean {
  const base = anyLogFieldPresent(logs, "sundowning") && anyLogFieldPresent(logs, "agitation")
  if (shiftType === "noche") return base
  return base && anyLogFieldPresent(logs, "physicalTherapy") && anyLogFieldPresent(logs, "occupationalTherapy")
}

function evolutionWithVisitTypeCovered(logs: MedicalLog[]): boolean {
  return logs.some((log) => log.evolutionEntries?.some((entry) => !!entry.visitType))
}

function glucoseCovered(logs: MedicalLog[]): boolean {
  return logs.some((log) => GLUCOSE_FIELDS.some((field) => log[field] !== undefined))
}

export async function calculateShiftCoverage(
  residentId: string,
  shiftDate: string,
  shiftType: ShiftType,
  options: ShiftCoverageOptions = {}
): Promise<CoverageResult> {
  const { start, end } = getShiftWindow(shiftDate, shiftType)
  const allLogs = await fetchLogsInWindow(residentId, start, end)
  const logs = allLogs.filter((log): log is MedicalLog => log.reportType === "medico")

  const checks: Array<[string, boolean]> = [
    ["skinStatus", skinStatusCovered(logs)],
    ["nursingCare", nursingCareCovered(logs)],
    ["elimination", eliminationCovered(logs)],
    ["behaviors", behaviorsCovered(logs, shiftType)],
    ["evolutionVisitType", evolutionWithVisitTypeCovered(logs)],
  ]

  if (shiftType === "dia") {
    checks.unshift(["vitalSigns", vitalSignsComplete(logs)])
    checks.push(["feeding", feedingCovered(logs)])
  } else {
    if (options.requiresNightFollowUp) {
      checks.unshift(["vitalSigns", vitalSignsComplete(logs)])
    }
    if (options.requiresGlucoseMonitoring) {
      checks.push(["glucose", glucoseCovered(logs)])
    }
  }

  const covered = checks.filter(([, ok]) => ok).map(([name]) => name)
  const missing = checks.filter(([, ok]) => !ok).map(([name]) => name)

  return {
    covered,
    missing,
    isComplete: missing.length === 0,
    lastVitalsSnapshot: getLastVitalsReading(logs),
    logIds: allLogs.map((log) => log.id),
  }
}
