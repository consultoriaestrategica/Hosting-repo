"use client"

import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// ============================================
// TIPOS
// ============================================

interface Resident {
  id: string
  name: string
  dob?: string
  idNumber?: string
  gender?: string
  bloodType?: string
  status?: string
  admissionDate?: string
  roomType?: string
  roomNumber?: string
  dependency?: string
  fallRisk?: string
  allergies?: string[]
  medicalHistory?: string[]
  surgicalHistory?: string[]
  diet?: string
  medications?: { name: string; dose: string; frequency: string }[]
  familyContacts?: { name: string; relationship: string; phone: string; email?: string }[]
  agendaEvents?: { title: string; date: string; status: string; description?: string }[]
}

interface EvolutionEntry {
  id: string
  createdAt: string
  createdTimeLabel?: string
  professionalName?: string
  note: string
  heartRate?: number
  respiratoryRate?: number
  spo2?: number
  bloodPressureSys?: number
  bloodPressureDia?: number
  temperature?: number
  fastingGlucose?: number
  skinStatus?: string
}

interface Log {
  id: string
  residentId: string
  residentName?: string
  reportType: "medico" | "suministro"
  endDate: string
  heartRate?: number
  respiratoryRate?: number
  spo2?: number
  bloodPressureSys?: number
  bloodPressureDia?: number
  temperature?: number
  evolutionEntries?: EvolutionEntry[]
  evolutionNotes?: string | string[]
  supplierName?: string
  supplyDescription?: string
  supplyDate?: string
  supplyNotes?: string
  finalComment?: string
  pendingTasks?: string
  notes?: string
  // Cuidados
  woundCare?: boolean
  medicationAdmin?: boolean
  fullMeals?: boolean
  partialMeals?: boolean
  diaperUse?: boolean
  diuresis?: boolean
  diuresisColor?: string
  bowelMovement?: boolean
  bowelConsistency?: string
  sundowning?: boolean
  agitation?: boolean
  physicalTherapy?: boolean
  occupationalTherapy?: boolean
  spiritualCare?: boolean
}

// ============================================
// HELPERS
// ============================================

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("es-ES", { dateStyle: "long" })
  } catch {
    return dateStr || "No registrada"
  }
}

function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })
  } catch {
    return dateStr || "No registrada"
  }
}

function calculateAge(dob: string): number {
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function sanitize(text: string | undefined | null): string {
  return text || "No registrado"
}

// ============================================
// ENCABEZADO Y PIE COMUNES
// ============================================

function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.getWidth()

  // Línea superior verde
  doc.setFillColor(91, 140, 111) // #5B8C6F
  doc.rect(0, 0, pageWidth, 4, "F")

  // Título del hogar
  doc.setFontSize(18)
  doc.setTextColor(44, 62, 53) // #2C3E35
  doc.setFont("helvetica", "bold")
  doc.text("HOGAR SAN JUAN", pageWidth / 2, 18, { align: "center" })

  // Subtítulo institucional
  doc.setFontSize(9)
  doc.setTextColor(107, 143, 123) // #6B8F7B
  doc.setFont("helvetica", "normal")
  doc.text("Centro de Atencion al Adulto Mayor - Restrepo, Valle del Cauca", pageWidth / 2, 24, { align: "center" })

  // Línea separadora
  doc.setDrawColor(208, 213, 200) // #D0D5C8
  doc.setLineWidth(0.5)
  doc.line(14, 28, pageWidth - 14, 28)

  // Título del reporte
  doc.setFontSize(13)
  doc.setTextColor(44, 62, 53)
  doc.setFont("helvetica", "bold")
  doc.text(title, pageWidth / 2, 36, { align: "center" })

  if (subtitle) {
    doc.setFontSize(9)
    doc.setTextColor(107, 143, 123)
    doc.setFont("helvetica", "normal")
    doc.text(subtitle, pageWidth / 2, 42, { align: "center" })
  }
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    doc.setDrawColor(208, 213, 200)
    doc.setLineWidth(0.3)
    doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14)

    doc.setFontSize(7)
    doc.setTextColor(154, 184, 166) // #9AB8A6
    doc.setFont("helvetica", "normal")
    doc.text(`Generado por Sistema Hogar San Juan - ${formatDate(new Date().toISOString())}`, 14, pageHeight - 8)
    doc.text(`Pagina ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: "right" })
  }
}

function addSectionTitle(doc: jsPDF, y: number, title: string): number {
  doc.setFontSize(11)
  doc.setTextColor(44, 62, 53)
  doc.setFont("helvetica", "bold")
  doc.text(title, 14, y)
  doc.setDrawColor(91, 140, 111)
  doc.setLineWidth(0.5)
  doc.line(14, y + 2, 80, y + 2)
  return y + 8
}

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  const pageHeight = doc.internal.pageSize.getHeight()
  if (y + needed > pageHeight - 20) {
    doc.addPage()
    return 20
  }
  return y
}

// ============================================
// 1. REPORTE GENERAL DE RESIDENTES
// ============================================

export function generateGeneralReport(residents: Resident[]): void {
  const doc = new jsPDF()
  const activeResidents = residents.filter((r) => r.status === "Activo")
  const inactiveResidents = residents.filter((r) => r.status !== "Activo")

  addHeader(doc, "REPORTE GENERAL DE RESIDENTES", `Generado el ${formatDate(new Date().toISOString())}`)

  // Resumen
  let y = 50
  doc.setFontSize(9)
  doc.setTextColor(44, 62, 53)
  doc.setFont("helvetica", "normal")
  doc.text(`Total activos: ${activeResidents.length} | Total inactivos: ${inactiveResidents.length} | Total general: ${residents.length}`, 14, y)
  y += 8

  // Tabla principal
  autoTable(doc, {
    startY: y,
    head: [["Nombre", "Cedula", "Edad", "Habitacion", "Sangre", "Dependencia", "Riesgo Caida", "Ingreso"]],
    body: activeResidents.map((r) => [
      r.name,
      r.idNumber || "N/A",
      r.dob ? `${calculateAge(r.dob)} anos` : "N/A",
      `${r.roomType || ""} ${r.roomNumber ? "#" + r.roomNumber : ""}`.trim(),
      r.bloodType || "N/A",
      r.dependency || "N/A",
      r.fallRisk || "N/A",
      r.admissionDate ? formatDate(r.admissionDate) : "N/A",
    ]),
    styles: { fontSize: 7, cellPadding: 2, textColor: [44, 62, 53] },
    headStyles: { fillColor: [91, 140, 111], textColor: [255, 255, 255], fontSize: 7, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 240, 232] },
    margin: { left: 14, right: 14 },
  })

  addFooter(doc)
  doc.save("Reporte_General_Residentes.pdf")
}

// ============================================
// 2. REPORTE INDIVIDUAL DEL RESIDENTE
// ============================================

export function generateIndividualReport(resident: Resident, logs: Log[]): void {
  const doc = new jsPDF()

  addHeader(doc, "INFORME DETALLADO DEL RESIDENTE", `${resident.name} - ${formatDate(new Date().toISOString())}`)

  let y = 48

  // Datos personales
  y = addSectionTitle(doc, y, "Datos Personales")
  autoTable(doc, {
    startY: y,
    body: [
      ["Nombre Completo", resident.name],
      ["No. Cedula", sanitize(resident.idNumber)],
      ["Fecha de Nacimiento", resident.dob ? `${formatDate(resident.dob)} (${calculateAge(resident.dob)} anos)` : "No registrada"],
      ["Genero", sanitize(resident.gender)],
      ["Tipo de Sangre", sanitize(resident.bloodType)],
      ["Estado", sanitize(resident.status)],
      ["Fecha de Ingreso", resident.admissionDate ? formatDate(resident.admissionDate) : "No registrada"],
    ],
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
    styles: { fontSize: 8, cellPadding: 3, textColor: [44, 62, 53] },
    alternateRowStyles: { fillColor: [250, 252, 251] },
    margin: { left: 14, right: 14 },
    theme: "plain",
  })

  y = (doc as any).lastAutoTable.finalY + 6

  // Alojamiento
  y = checkPageBreak(doc, y, 30)
  y = addSectionTitle(doc, y, "Alojamiento")
  autoTable(doc, {
    startY: y,
    body: [
      ["Tipo de Habitacion", sanitize(resident.roomType)],
      ["No. Habitacion", sanitize(resident.roomNumber)],
    ],
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
    styles: { fontSize: 8, cellPadding: 3, textColor: [44, 62, 53] },
    theme: "plain",
    margin: { left: 14, right: 14 },
  })

  y = (doc as any).lastAutoTable.finalY + 6

  // Información médica
  y = checkPageBreak(doc, y, 50)
  y = addSectionTitle(doc, y, "Informacion Medica")
  autoTable(doc, {
    startY: y,
    body: [
      ["Nivel de Dependencia", sanitize(resident.dependency)],
      ["Riesgo de Caida", sanitize(resident.fallRisk)],
      ["Alergias", resident.allergies?.join(", ") || "Ninguna registrada"],
      ["Antecedentes Medicos", resident.medicalHistory?.join(", ") || "Ninguno"],
      ["Antecedentes Quirurgicos", resident.surgicalHistory?.join(", ") || "Ninguno"],
      ["Plan de Alimentacion", sanitize(resident.diet)],
    ],
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
    styles: { fontSize: 8, cellPadding: 3, textColor: [44, 62, 53] },
    theme: "plain",
    margin: { left: 14, right: 14 },
  })

  y = (doc as any).lastAutoTable.finalY + 6

  // Medicamentos
  if (resident.medications && resident.medications.length > 0) {
    y = checkPageBreak(doc, y, 40)
    y = addSectionTitle(doc, y, "Medicamentos Actuales")
    autoTable(doc, {
      startY: y,
      head: [["Medicamento", "Dosis", "Frecuencia"]],
      body: resident.medications.map((m) => [m.name, m.dose, m.frequency]),
      styles: { fontSize: 8, cellPadding: 3, textColor: [44, 62, 53] },
      headStyles: { fillColor: [91, 140, 111], textColor: [255, 255, 255], fontSize: 8 },
      margin: { left: 14, right: 14 },
    })
    y = (doc as any).lastAutoTable.finalY + 6
  }

  // Contactos familiares
  if (resident.familyContacts && resident.familyContacts.length > 0) {
    y = checkPageBreak(doc, y, 40)
    y = addSectionTitle(doc, y, "Contactos Familiares")
    autoTable(doc, {
      startY: y,
      head: [["Nombre", "Parentesco", "Telefono", "Email"]],
      body: resident.familyContacts.map((c) => [c.name, c.relationship, c.phone, c.email || "N/A"]),
      styles: { fontSize: 8, cellPadding: 3, textColor: [44, 62, 53] },
      headStyles: { fillColor: [91, 140, 111], textColor: [255, 255, 255], fontSize: 8 },
      margin: { left: 14, right: 14 },
    })
    y = (doc as any).lastAutoTable.finalY + 6
  }

  // Últimos 5 registros
  const residentLogs = logs
    .filter((l) => l.residentId === resident.id)
    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
    .slice(0, 5)

  if (residentLogs.length > 0) {
    y = checkPageBreak(doc, y, 40)
    y = addSectionTitle(doc, y, "Ultimos Registros")
    autoTable(doc, {
      startY: y,
      head: [["Fecha", "Tipo", "Detalle"]],
      body: residentLogs.map((l) => [
        formatDateTime(l.endDate),
        l.reportType === "medico" ? "Medico" : "Suministro",
        getLogPreview(l),
      ]),
      styles: { fontSize: 7, cellPadding: 2, textColor: [44, 62, 53] },
      headStyles: { fillColor: [91, 140, 111], textColor: [255, 255, 255], fontSize: 7 },
      columnStyles: { 2: { cellWidth: 80 } },
      margin: { left: 14, right: 14 },
    })
    y = (doc as any).lastAutoTable.finalY + 6
  }

  // Agenda
  const pendingEvents = (resident.agendaEvents || []).filter((e) => e.status === "Pendiente")
  if (pendingEvents.length > 0) {
    y = checkPageBreak(doc, y, 30)
    y = addSectionTitle(doc, y, "Eventos Programados")
    autoTable(doc, {
      startY: y,
      head: [["Fecha", "Evento", "Descripcion"]],
      body: pendingEvents.map((e) => [formatDateTime(e.date), e.title, e.description || ""]),
      styles: { fontSize: 8, cellPadding: 2, textColor: [44, 62, 53] },
      headStyles: { fillColor: [196, 131, 90], textColor: [255, 255, 255], fontSize: 8 },
      margin: { left: 14, right: 14 },
    })
  }

  addFooter(doc)
  doc.save(`Reporte_Individual_${resident.name.replace(/\s/g, "_")}.pdf`)
}

// ============================================
// 3. REGISTROS POR RANGO DE FECHA
// ============================================

export function generateDateRangeReport(logs: Log[], residents: Resident[], from: Date, to: Date): void {
  const doc = new jsPDF("landscape")

  const filtered = logs.filter((l) => {
    const d = new Date(l.endDate)
    return d >= from && d <= to
  })

  const medicos = filtered.filter((l) => l.reportType === "medico")
  const suministros = filtered.filter((l) => l.reportType === "suministro")

  addHeader(doc, "REGISTROS POR RANGO DE FECHA", `${formatDate(from.toISOString())} - ${formatDate(to.toISOString())}`)

  let y = 48
  doc.setFontSize(9)
  doc.setTextColor(44, 62, 53)
  doc.text(`Total: ${filtered.length} registros | Medicos: ${medicos.length} | Suministros: ${suministros.length}`, 14, y)
  y += 8

  autoTable(doc, {
    startY: y,
    head: [["Fecha", "Residente", "Tipo", "FC", "FR", "SpO2", "T/A", "Temp", "Detalle"]],
    body: filtered.map((l) => {
      const resName = residents.find((r) => r.id === l.residentId)?.name || "N/A"
      const isMed = l.reportType === "medico"
      return [
        formatDateTime(l.endDate),
        resName,
        isMed ? "Medico" : "Suministro",
        isMed ? (l.heartRate?.toString() || "-") : "-",
        isMed ? (l.respiratoryRate?.toString() || "-") : "-",
        isMed ? (l.spo2?.toString() || "-") : "-",
        isMed && l.bloodPressureSys ? `${l.bloodPressureSys}/${l.bloodPressureDia}` : "-",
        isMed ? (l.temperature?.toString() || "-") : "-",
        getLogPreview(l),
      ]
    }),
    styles: { fontSize: 6, cellPadding: 2, textColor: [44, 62, 53] },
    headStyles: { fillColor: [91, 140, 111], textColor: [255, 255, 255], fontSize: 6 },
    columnStyles: { 8: { cellWidth: 60 } },
    margin: { left: 14, right: 14 },
  })

  addFooter(doc)
  doc.save("Reporte_Registros_por_Fecha.pdf")
}

// ============================================
// 4. REGISTROS DEL RESIDENTE
// ============================================

export function generateResidentLogsReport(resident: Resident, logs: Log[], from?: Date, to?: Date): void {
  const doc = new jsPDF()

  let filtered = logs.filter((l) => l.residentId === resident.id)
  if (from && to) {
    filtered = filtered.filter((l) => {
      const d = new Date(l.endDate)
      return d >= from && d <= to
    })
  }
  filtered.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())

  const rangeText = from && to
    ? `${formatDate(from.toISOString())} - ${formatDate(to.toISOString())}`
    : "Todos los registros"

  addHeader(doc, "REGISTROS DIARIOS DEL RESIDENTE", `${resident.name} (CC: ${resident.idNumber || "N/A"}) | ${rangeText}`)

  let y = 50
  doc.setFontSize(9)
  doc.setTextColor(44, 62, 53)
  doc.text(`Total: ${filtered.length} registros`, 14, y)
  y += 8

  // Detalle registro por registro
  filtered.forEach((log, idx) => {
    y = checkPageBreak(doc, y, 60)

    // Cabecera del registro
    doc.setFillColor(245, 240, 232) // #F5F0E8
    doc.rect(14, y - 4, doc.internal.pageSize.getWidth() - 28, 14, "F")
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(44, 62, 53)
    doc.text(`Registro #${idx + 1} - ${log.reportType === "medico" ? "Evolucion Medica" : "Suministro"} - ${formatDateTime(log.endDate)}`, 16, y + 4)
    y += 16

    if (log.reportType === "medico") {
      // Signos vitales en tabla compacta
      const vitals: string[][] = []
      if (log.heartRate) vitals.push(["F.C", `${log.heartRate} lpm`])
      if (log.respiratoryRate) vitals.push(["F.R", `${log.respiratoryRate} rpm`])
      if (log.spo2) vitals.push(["SpO2", `${log.spo2}%`])
      if (log.bloodPressureSys) vitals.push(["T/A", `${log.bloodPressureSys}/${log.bloodPressureDia} mmHg`])
      if (log.temperature) vitals.push(["Temp", `${log.temperature} C`])

      if (vitals.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [["Signo Vital", "Valor"]],
          body: vitals,
          styles: { fontSize: 7, cellPadding: 2, textColor: [44, 62, 53] },
          headStyles: { fillColor: [138, 173, 203], textColor: [255, 255, 255], fontSize: 7 },
          tableWidth: 90,
          margin: { left: 16 },
        })
        y = (doc as any).lastAutoTable.finalY + 4
      }

      // Notas de evolución
      const evoText = getFullEvolution(log)
      if (evoText) {
        y = checkPageBreak(doc, y, 20)
        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        doc.text("Notas de Evolucion:", 16, y)
        y += 4
        doc.setFont("helvetica", "normal")
        doc.setFontSize(7)
        const lines = doc.splitTextToSize(evoText, doc.internal.pageSize.getWidth() - 34)
        lines.forEach((line: string) => {
          y = checkPageBreak(doc, y, 6)
          doc.text(line, 18, y)
          y += 4
        })
        y += 2
      }

      // Comentario final
      if (log.finalComment) {
        y = checkPageBreak(doc, y, 15)
        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        doc.text("Comentario final del turno:", 16, y)
        y += 4
        doc.setFont("helvetica", "normal")
        doc.setFontSize(7)
        const lines = doc.splitTextToSize(log.finalComment, doc.internal.pageSize.getWidth() - 34)
        lines.forEach((line: string) => {
          y = checkPageBreak(doc, y, 6)
          doc.text(line, 18, y)
          y += 4
        })
        y += 2
      }

      // Tareas pendientes
      if (log.pendingTasks) {
        y = checkPageBreak(doc, y, 15)
        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(196, 131, 90)
        doc.text("Tareas pendientes:", 16, y)
        doc.setTextColor(44, 62, 53)
        y += 4
        doc.setFont("helvetica", "normal")
        doc.setFontSize(7)
        const lines = doc.splitTextToSize(log.pendingTasks, doc.internal.pageSize.getWidth() - 34)
        lines.forEach((line: string) => {
          y = checkPageBreak(doc, y, 6)
          doc.text(line, 18, y)
          y += 4
        })
        y += 2
      }
    } else {
      // Suministro
      if (log.supplyDescription) {
        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        doc.text("Descripcion:", 16, y)
        y += 4
        doc.setFont("helvetica", "normal")
        doc.setFontSize(7)
        const lines = doc.splitTextToSize(log.supplyDescription, doc.internal.pageSize.getWidth() - 34)
        lines.forEach((line: string) => {
          y = checkPageBreak(doc, y, 6)
          doc.text(line, 18, y)
          y += 4
        })
        y += 2
      }
      if (log.supplyNotes) {
        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        doc.text("Observaciones:", 16, y)
        y += 4
        doc.setFont("helvetica", "normal")
        doc.setFontSize(7)
        const lines = doc.splitTextToSize(log.supplyNotes, doc.internal.pageSize.getWidth() - 34)
        lines.forEach((line: string) => {
          y = checkPageBreak(doc, y, 6)
          doc.text(line, 18, y)
          y += 4
        })
        y += 2
      }
    }

    // Separador
    doc.setDrawColor(208, 213, 200)
    doc.setLineWidth(0.3)
    doc.line(14, y, doc.internal.pageSize.getWidth() - 14, y)
    y += 6
  })

  addFooter(doc)
  doc.save(`Registros_${resident.name.replace(/\s/g, "_")}.pdf`)
}

// ============================================
// 5. REPORTE GENERAL DE REGISTROS
// ============================================

export function generateAllLogsReport(logs: Log[], residents: Resident[]): void {
  const doc = new jsPDF("landscape")

  const medicos = logs.filter((l) => l.reportType === "medico")
  const suministros = logs.filter((l) => l.reportType === "suministro")

  addHeader(doc, "REPORTE GENERAL DE REGISTROS DIARIOS", `Total: ${logs.length} registros | Medicos: ${medicos.length} | Suministros: ${suministros.length}`)

  const y = 50

  autoTable(doc, {
    startY: y,
    head: [["Fecha", "Residente", "Tipo", "FC", "FR", "SpO2", "T/A", "Temp", "Detalle"]],
    body: logs
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
      .map((l) => {
        const resName = residents.find((r) => r.id === l.residentId)?.name || "N/A"
        const isMed = l.reportType === "medico"
        return [
          formatDateTime(l.endDate),
          resName,
          isMed ? "Medico" : "Suministro",
          isMed ? (l.heartRate?.toString() || "-") : "-",
          isMed ? (l.respiratoryRate?.toString() || "-") : "-",
          isMed ? (l.spo2?.toString() || "-") : "-",
          isMed && l.bloodPressureSys ? `${l.bloodPressureSys}/${l.bloodPressureDia}` : "-",
          isMed ? (l.temperature?.toString() || "-") : "-",
          getLogPreview(l),
        ]
      }),
    styles: { fontSize: 6, cellPadding: 2, textColor: [44, 62, 53] },
    headStyles: { fillColor: [91, 140, 111], textColor: [255, 255, 255], fontSize: 6 },
    columnStyles: { 8: { cellWidth: 60 } },
    margin: { left: 14, right: 14 },
  })

  addFooter(doc)
  doc.save("Reporte_General_Registros.pdf")
}

// ============================================
// UTILIDADES DE EXTRACCION
// ============================================

function getLogPreview(log: Log): string {
  if (log.reportType !== "medico") {
    return log.supplyDescription || "Sin descripcion"
  }
  if (log.evolutionEntries && log.evolutionEntries.length > 0) {
    const text = log.evolutionEntries[0].note || ""
    return text.length > 120 ? text.substring(0, 120) + "..." : text
  }
  if (Array.isArray(log.evolutionNotes) && log.evolutionNotes.length > 0) {
    const text = typeof log.evolutionNotes[0] === "string" ? log.evolutionNotes[0] : ""
    return text.length > 120 ? text.substring(0, 120) + "..." : text
  }
  return log.notes || "Sin notas"
}

function getFullEvolution(log: Log): string {
  if (log.evolutionEntries && log.evolutionEntries.length > 0) {
    return log.evolutionEntries.map((e) => {
      let text = ""
      if (e.createdTimeLabel) text += `[${e.createdTimeLabel}] `
      if (e.professionalName) text += `(${e.professionalName}) `
      text += e.note
      return text
    }).join("\n\n")
  }
  if (Array.isArray(log.evolutionNotes)) {
    return log.evolutionNotes.join("\n\n")
  }
  if (typeof log.evolutionNotes === "string") {
    return log.evolutionNotes
  }
  return log.notes || ""
}
