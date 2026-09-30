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
  // Cobertura de TODAS las categorias, incluidas las que ya no
  // bloquean el cierre — se sigue calculando completo para que el
  // checklist informativo pueda mostrarlo.
  covered: string[]
  missing: string[]
  // Depende UNICAMENTE de las categorias en BLOCKING_CATEGORIES (hoy:
  // vitalSigns y evolutionVisitType). Decision del cliente: las demas
  // categorias (skinStatus, nursingCare, elimination, behaviors,
  // feeding, glucose) ya no pueden impedir el cierre del turno, solo
  // se muestran de forma informativa.
  isComplete: boolean
  // La lectura de signos vitales mas reciente del turno (para
  // confirmar en el cierre, no para re-ingresar). `null` si no hubo
  // ninguna lectura con al menos un valor.
  lastVitalsSnapshot: VitalReading | null
  // TODOS los logs del turno (medicos Y de suministro) — se usa para
  // marcar lockedInClosure en cada uno al cerrar (Fase 3). La
  // cobertura en si solo mira los medicos.
  logIds: string[]
  // Desglose de que campo especifico falta dentro de una categoria
  // bloqueante, para que la UI pueda decir "falta T/A" en vez de solo
  // "Signos vitales incompleto". Vacio si la categoria esta cubierta o
  // no aplica a este turno.
  vitalSignsMissingFields: string[]
  evolutionMissingParts: string[]
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
const VITAL_SCALAR_LABELS: Record<(typeof VITAL_SCALAR_FIELDS)[number], string> = {
  heartRate: "FC",
  respiratoryRate: "FR",
  spo2: "SpO₂",
  temperature: "Temperatura",
}

// Unicas 2 categorias que pueden bloquear el cierre de un turno
// (decision del cliente, ver CoverageResult.isComplete). Las demas
// categorias se siguen calculando y mostrando, solo que de forma
// informativa.
const BLOCKING_CATEGORIES = ["vitalSigns", "evolutionVisitType"] as const
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
  return vitalSignsMissingFields(logs).length === 0
}

// Cuales de los 5 valores (FC, FR, SpO2, Temperatura, T/A) todavia no
// tienen ninguna lectura en el turno. T/A cuenta como un solo valor
// faltante (no "sistolica" y "diastolica" por separado) porque se
// reporta y se corrige como un par.
function vitalSignsMissingFields(logs: MedicalLog[]): string[] {
  const readings = collectVitalReadings(logs)
  const missing: string[] = []
  for (const field of VITAL_SCALAR_FIELDS) {
    if (!readings.some((r) => r[field] !== undefined)) {
      missing.push(VITAL_SCALAR_LABELS[field])
    }
  }
  const bloodPressureCovered = readings.some((r) => r.bloodPressureSys !== undefined && r.bloodPressureDia !== undefined)
  if (!bloodPressureCovered) missing.push("T/A")
  return missing
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

// "Evolucion" ahora exige, de forma independiente, que exista alguna
// nota de evolucion con contenido Y que exista algun tipo de visita
// seleccionado — no necesariamente en la misma entrada, igual que los
// valores escalares de signos vitales. visitType es opcional en el
// formulario de registro (new-log-form.tsx) y las evoluciones
// parciales (partial-evolution-form.tsx) nunca lo piden, por lo que en
// la practica solo la entrada inicial del registro puede cubrirlo.
function evolutionNoteCovered(logs: MedicalLog[]): boolean {
  return logs.some((log) => log.evolutionEntries?.some((entry) => (entry.note ?? "").trim().length > 0))
}

function evolutionVisitTypeCovered(logs: MedicalLog[]): boolean {
  return logs.some((log) => log.evolutionEntries?.some((entry) => !!entry.visitType))
}

function evolutionMissingParts(logs: MedicalLog[]): string[] {
  const missing: string[] = []
  if (!evolutionNoteCovered(logs)) missing.push("nota de evolución")
  if (!evolutionVisitTypeCovered(logs)) missing.push("tipo de visita")
  return missing
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
    ["evolutionVisitType", evolutionNoteCovered(logs) && evolutionVisitTypeCovered(logs)],
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

  // isComplete solo mira las categorias bloqueantes QUE APLICAN a este
  // turno (ej. "vitalSigns" de noche solo aparece en `checks` si
  // requiresNightFollowUp es true — si no aparece, no puede bloquear).
  const applicableBlocking = checks.filter(([name]) => (BLOCKING_CATEGORIES as readonly string[]).includes(name))
  const isComplete = applicableBlocking.every(([, ok]) => ok)

  return {
    covered,
    missing,
    isComplete,
    lastVitalsSnapshot: getLastVitalsReading(logs),
    logIds: allLogs.map((log) => log.id),
    vitalSignsMissingFields: vitalSignsMissingFields(logs),
    evolutionMissingParts: evolutionMissingParts(logs),
  }
}
