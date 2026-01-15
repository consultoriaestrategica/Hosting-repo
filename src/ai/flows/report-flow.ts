'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import React from 'react';

/**
 * @fileOverview Un agente de IA para la generación de reportes en PDF.
 *
 * - generatePdfReport - Una función que maneja la creación de los reportes en PDF.
 * - ReportInput - El tipo de entrada para la función generatePdfReport.
 * - ReportOutput - El tipo de salida para la función generatePdfReport.
 */

const ReportInputSchema = z.object({
  // 🔹 Ahora incluimos también logsGeneral y residentLogs
  reportType: z.enum([
    'general',
    'individual',
    'dateRange',
    'logsGeneral',
    'residentLogs',
  ]),
  data: z.any(),
});

const ReportOutputSchema = z.object({
  pdfBase64: z.string().describe('El contenido del PDF codificado en base64.'),
  fileName: z.string().describe('El nombre de archivo sugerido para el PDF.'),
});

export type ReportInput = z.infer<typeof ReportInputSchema>;
export type ReportOutput = z.infer<typeof ReportOutputSchema>;

// ======================
// Tipos de datos
// ======================

interface Resident {
  // Datos básicos
  name: string;
  age: number;
  idNumber: string;
  birthDate?: string;
  admissionDate: string;
  status: string;

  // Información personal
  maritalStatus?: string;
  phone?: string;
  address?: string;

  // Alojamiento
  roomType: string;
  roomNumber?: string;

  // Información médica
  dependency: string;
  fallRisk: string;
  bloodType: string;
  allergies?: string[];
  medicalConditions?: string[];
  doctor?: string;

  // Contrato
  contractType?: string;
  contractDate?: string;
  monthlyCost?: string;
  paymentResponsible?: string;

  // Contactos
  emergencyContacts?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  }[];

  // Medicamentos
  medications?: {
    name: string;
    dose: string;
    frequency: string;
    schedule?: string;
    notes?: string;
  }[];

  // Observaciones
  specialDiet?: string;
  restrictions?: string;
  preferences?: string;
  notes?: string;
}

interface EvolutionEntry {
  id: string;
  createdAt: string;
  createdTimeLabel: string;
  professionalName?: string;
  visitType?: string;
  note: string;
  heartRate?: number;
  respiratoryRate?: number;
  spo2?: number;
  bloodPressureSys?: number;
  bloodPressureDia?: number;
  temperature?: number;
}

interface Log {
  reportType: 'medico' | 'suministro';
  endDate: string;
  heartRate?: number;
  respiratoryRate?: number;
  spo2?: number;
  evolutionNotes?: string | string[];
  evolutionEntries?: EvolutionEntry[]; // Nuevo sistema de evoluciones
  supplierName?: string;
  supplyDescription?: string;
}

// ======================
// Helpers HTML
// ======================

function getCssStyles() {
  return `
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; color: #333; }
    h1 { font-size: 20px; color: #1a2d4a; border-bottom: 2px solid #3B82F6; padding-bottom: 5px; margin-bottom: 20px; }
    h2 { font-size: 16px; color: #1a2d4a; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 3px;}
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
    th { background-color: #f2f2f2; font-weight: bold; }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { font-size: 24px; }
    .header p { font-size: 12px; color: #555; }
    .card { border: 1px solid #eee; border-radius: 8px; padding: 15px; margin-bottom: 15px; background-color: #fcfcfc; }
    .card-title { font-size: 14px; font-weight: bold; margin-bottom: 10px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .info-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f0f0f0; }
    .info-row strong { font-weight: bold; }
  `;
}

// ---------- Reporte general de residentes ----------

function getGeneralReportHtml(residents: Resident[]): string {
  const activeResidents = residents.filter((r) => r.status === 'Activo');
  return `
    <html>
      <head><style>${getCssStyles()}</style></head>
      <body>
        <div class="header">
          <h1>REPORTE GENERAL DE RESIDENTES - HOGAR SAN JUAN</h1>
          <p>Generado el ${new Date().toLocaleDateString('es-ES', {
            dateStyle: 'long',
          })}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Cédula</th>
              <th>Tipo de Sangre</th>
              <th>Nivel de Dependencia</th>
              <th>Tipo de Contrato</th>
              <th>Fecha de Ingreso</th>
            </tr>
          </thead>
          <tbody>
            ${activeResidents
              .map(
                (r) => `
              <tr>
                <td>${r.name}</td>
                <td>${r.idNumber}</td>
                <td>${r.bloodType}</td>
                <td>${r.dependency}</td>
                <td>${r.contractType || 'No especificado'}</td>
                <td>${new Date(r.admissionDate).toLocaleDateString('es-ES')}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
        <div style="margin-top: 30px;">
          <p><strong>Total de residentes activos:</strong> ${activeResidents.length}</p>
        </div>
      </body>
    </html>
  `;
}

// ---------- Reporte individual de residente ----------

function getIndividualReportHtml(resident: Resident): string {
  return `
    <html>
      <head><style>${getCssStyles()}</style></head>
      <body>
        <div class="header">
          <h1>INFORME DETALLADO DEL RESIDENTE - HOGAR SAN JUAN</h1>
          <p>Generado para <strong>${resident.name}</strong> el ${new Date().toLocaleDateString(
            'es-ES',
            { dateStyle: 'long' },
          )}</p>
        </div>
        
        <h2>Información Personal</h2>
        <div class="card">
          <div class="info-row"><strong>Nombre Completo:</strong> <span>${resident.name}</span></div>
          <div class="info-row"><strong>Edad:</strong> <span>${resident.age} años</span></div>
          <div class="info-row"><strong>Número de Cédula:</strong> <span>${resident.idNumber}</span></div>
          <div class="info-row"><strong>Fecha de Nacimiento:</strong> <span>${resident.birthDate || 'No registrada'}</span></div>
          <div class="info-row"><strong>Fecha de Ingreso:</strong> <span>${new Date(
            resident.admissionDate,
          ).toLocaleDateString('es-ES', { dateStyle: 'long' })}</span></div>
          <div class="info-row"><strong>Estado Civil:</strong> <span>${resident.maritalStatus || 'No especificado'}</span></div>
          <div class="info-row"><strong>Teléfono:</strong> <span>${resident.phone || 'No registrado'}</span></div>
          <div class="info-row"><strong>Dirección:</strong> <span>${resident.address || 'No registrada'}</span></div>
        </div>

        <h2>Información de Alojamiento</h2>
        <div class="card">
          <div class="info-row"><strong>Tipo de Habitación:</strong> <span>${resident.roomType}</span></div>
          <div class="info-row"><strong>Número de Habitación:</strong> <span>${resident.roomNumber || 'No asignado'}</span></div>
          <div class="info-row"><strong>Estado:</strong> <span>${resident.status}</span></div>
        </div>
        
        <h2>Información Médica y de Cuidado</h2>
        <div class="card">
          <div class="info-row"><strong>Nivel de Dependencia:</strong> <span>${resident.dependency}</span></div>
          <div class="info-row"><strong>Riesgo de Caída:</strong> <span>${resident.fallRisk}</span></div>
          <div class="info-row"><strong>Tipo de Sangre:</strong> <span>${resident.bloodType}</span></div>
          <div class="info-row"><strong>Alergias:</strong> <span>${resident.allergies?.join(', ') || 'Ninguna registrada'}</span></div>
          <div class="info-row"><strong>Condiciones Médicas:</strong> <span>${resident.medicalConditions?.join(', ') || 'Ninguna registrada'}</span></div>
          <div class="info-row"><strong>Médico Tratante:</strong> <span>${resident.doctor || 'No asignado'}</span></div>
        </div>

        <h2>Información de Contrato</h2>
        <div class="card">
          <div class="info-row"><strong>Tipo de Contrato:</strong> <span>${resident.contractType || 'No especificado'}</span></div>
          <div class="info-row"><strong>Fecha de Contrato:</strong> <span>${
            resident.contractDate ? new Date(resident.contractDate).toLocaleDateString('es-ES') : 'No registrada'
          }</span></div>
          <div class="info-row"><strong>Costo Mensual:</strong> <span>${resident.monthlyCost || 'No especificado'}</span></div>
          <div class="info-row"><strong>Responsable de Pago:</strong> <span>${
            resident.paymentResponsible || 'No especificado'
          }</span></div>
        </div>
        
        <h2>Contactos de Emergencia</h2>
        <div class="card">
          ${
            resident.emergencyContacts && resident.emergencyContacts.length > 0
              ? `
            <table>
              <thead><tr><th>Nombre</th><th>Relación</th><th>Teléfono</th><th>Email</th></tr></thead>
              <tbody>
                ${resident.emergencyContacts
                  .map(
                    (contact) => `
                  <tr>
                    <td>${contact.name}</td>
                    <td>${contact.relationship}</td>
                    <td>${contact.phone}</td>
                    <td>${contact.email || 'No registrado'}</td>
                  </tr>
                `,
                  )
                  .join('')}
              </tbody>
            </table>
          `
              : '<p>No hay contactos de emergencia registrados.</p>'
          }
        </div>
        
        <h2>Medicamentos Actuales</h2>
        <div class="card">
          ${
            resident.medications && resident.medications.length > 0
              ? `
            <table>
              <thead><tr><th>Medicamento</th><th>Dosis</th><th>Frecuencia</th><th>Horario</th><th>Observaciones</th></tr></thead>
              <tbody>
                ${resident.medications
                  .map(
                    (med) => `
                  <tr>
                    <td>${med.name}</td>
                    <td>${med.dose}</td>
                    <td>${med.frequency}</td>
                    <td>${med.schedule || 'No especificado'}</td>
                    <td>${med.notes || 'Ninguna'}</td>
                  </tr>
                `,
                  )
                  .join('')}
              </tbody>
            </table>
          `
              : '<p>No hay medicamentos registrados.</p>'
          }
        </div>

        <h2>Observaciones Especiales</h2>
        <div class="card">
          <p><strong>Dieta Especial:</strong> ${resident.specialDiet || 'Dieta regular'}</p>
          <p><strong>Restricciones:</strong> ${resident.restrictions || 'Ninguna'}</p>
          <p><strong>Preferencias:</strong> ${resident.preferences || 'Ninguna especificada'}</p>
          <p><strong>Notas Adicionales:</strong> ${resident.notes || 'Sin observaciones adicionales'}</p>
        </div>
      </body>
    </html>
  `;
}

// ---------- Helper para extraer notas de evolución ----------

function extractEvolutionNotes(log: Log): string {
  // Priorizar evolutionEntries (sistema nuevo) sobre evolutionNotes (sistema antiguo)
  if (log.reportType === 'medico') {
    if (log.evolutionEntries && log.evolutionEntries.length > 0) {
      return log.evolutionEntries
        .map((entry) => `${entry.createdTimeLabel || ''}: ${entry.note}`)
        .join(' | ');
    }
    // Fallback al sistema antiguo
    if (Array.isArray(log.evolutionNotes)) {
      return log.evolutionNotes.join(' | ');
    }
    return log.evolutionNotes || '';
  }
  // Para registros de suministro
  return `${log.supplierName || ''} ${log.supplyDescription || ''}`.trim() || 'N/A';
}

// ---------- Reportes de registros diarios (logs) ----------

function getLogsReportHtml(
  logs: Log[],
  options?: { range?: { from: string; to: string }; mode?: 'all' | 'range' },
): string {
  const mode = options?.mode || (options?.range ? 'range' : 'all');
  const isRange = mode === 'range';

  const title = isRange
    ? 'REPORTE DE REGISTROS POR FECHA'
    : 'REPORTE GENERAL DE REGISTROS DIARIOS';

  const rangeText = isRange && options?.range
    ? `Período: ${new Date(options.range.from).toLocaleDateString(
        'es-ES',
      )} - ${new Date(options.range.to).toLocaleDateString('es-ES')}`
    : 'Incluye todos los registros médicos y de suministros registrados en el sistema.';

  const tableRows = logs
    .map((log) => {
      const dateLabel = new Date(log.endDate).toLocaleString('es-ES');
      const typeLabel = log.reportType === 'medico' ? 'Médico' : 'Suministro';
      const hr = log.reportType === 'medico' ? log.heartRate ?? 'N/A' : '-';
      const rr = log.reportType === 'medico' ? log.respiratoryRate ?? 'N/A' : '-';
      const spo2 = log.reportType === 'medico' ? log.spo2 ?? 'N/A' : '-';
      const notes = extractEvolutionNotes(log);

      return `
        <tr>
          <td>${dateLabel}</td>
          <td>${typeLabel}</td>
          <td>${hr}</td>
          <td>${rr}</td>
          <td>${spo2}</td>
          <td>${notes}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <html>
      <head><style>${getCssStyles()}</style></head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>${rangeText}</p>
        </div>

        ${
          logs.length === 0
            ? '<p>No se encontraron registros en este período.</p>'
            : `
          <table>
            <thead>
              <tr>
                <th>Fecha y hora</th>
                <th>Tipo</th>
                <th>FC</th>
                <th>FR</th>
                <th>SpO2</th>
                <th>Notas / Descripción</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        `
        }

        <div style="margin-top: 20px;">
          <p><strong>Total de registros:</strong> ${logs.length}</p>
        </div>
      </body>
    </html>
  `;
}

// Compatibilidad con la firma anterior
function getDateRangeReportHtml(logs: Log[], range: { from: string; to: string }): string {
  return getLogsReportHtml(logs, { range, mode: 'range' });
}

function getAllLogsReportHtml(logs: Log[]): string {
  return getLogsReportHtml(logs, { mode: 'all' });
}

// ---------- Reporte de registros diarios por residente ----------

function getResidentLogsReportHtml(
  resident: Resident,
  logs: Log[],
  range?: { from: string; to: string },
): string {
  const hasRange = !!range;

  const rangeText = hasRange
    ? `Período: ${new Date(range!.from).toLocaleDateString(
        'es-ES',
      )} - ${new Date(range!.to).toLocaleDateString('es-ES')}`
    : 'Incluye todos los registros médicos y de suministros del residente.';

  const tableRows = logs
    .map((log) => {
      const dateLabel = new Date(log.endDate).toLocaleString('es-ES');
      const typeLabel = log.reportType === 'medico' ? 'Médico' : 'Suministro';
      const hr = log.reportType === 'medico' ? log.heartRate ?? 'N/A' : '-';
      const rr = log.reportType === 'medico' ? log.respiratoryRate ?? 'N/A' : '-';
      const spo2 = log.reportType === 'medico' ? log.spo2 ?? 'N/A' : '-';
      const notes = extractEvolutionNotes(log);

      return `
        <tr>
          <td>${dateLabel}</td>
          <td>${typeLabel}</td>
          <td>${hr}</td>
          <td>${rr}</td>
          <td>${spo2}</td>
          <td>${notes}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <html>
      <head><style>${getCssStyles()}</style></head>
      <body>
        <div class="header">
          <h1>REPORTE DE REGISTROS DIARIOS DEL RESIDENTE</h1>
          <p>Residente: <strong>${resident.name}</strong> (Cédula: ${resident.idNumber})</p>
          <p>${rangeText}</p>
        </div>

        ${
          logs.length === 0
            ? '<p>No se encontraron registros para este residente en este período.</p>'
            : `
          <table>
            <thead>
              <tr>
                <th>Fecha y hora</th>
                <th>Tipo</th>
                <th>FC</th>
                <th>FR</th>
                <th>SpO2</th>
                <th>Notas / Descripción</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        `
        }

        <div style="margin-top: 20px;">
          <p><strong>Total de registros:</strong> ${logs.length}</p>
        </div>
      </body>
    </html>
  `;
}

// ======================
// HTML → PDF
// ======================

async function htmlToPdf(htmlContent: string): Promise<Buffer> {
  try {
    const { renderToBuffer } = await import('@react-pdf/renderer');
    const React = await import('react');
    const { Document, Page, Text, View, StyleSheet } = await import('@react-pdf/renderer');

    const titleMatch = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : 'Reporte';

    const isIndividualReport = title.includes('INFORME DETALLADO DEL RESIDENTE');

    if (isIndividualReport) {
      return createIndividualReportPdf(htmlContent);
    } else {
      const tableRows = extractTableRows(htmlContent);
      return createBasicPdf(htmlContent);
    }
  } catch (error) {
    console.error('Error with React-PDF:', error);

    const titleMatch = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : 'Reporte';
    const isIndividualReport = title.includes('INFORME DETALLADO DEL RESIDENTE');

    if (isIndividualReport) {
      return createIndividualReportPdf(htmlContent);
    }

    return createBasicPdf(htmlContent);
  }
}

// ---------- PDF individual (ya existía) ----------

function createIndividualReportPdf(htmlContent: string): Buffer {
  const titleMatch = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/);
  const title = titleMatch
    ? titleMatch[1].replace(/<[^>]*>/g, '')
    : 'INFORME DETALLADO DEL RESIDENTE - HOGAR SAN JUAN';

  const nameMatch = htmlContent.match(/Generado para <strong>(.*?)<\/strong>/);
  const residentName = nameMatch ? nameMatch[1] : 'Residente';

  const date = new Date().toLocaleDateString('es-ES');

  const extractInfo = (label: string) => {
    const regex = new RegExp(`<strong>${label}:</strong>\\s*<span>(.*?)</span>`, 'i');
    const match = htmlContent.match(regex);
    return match ? match[1].trim() : 'No especificado';
  };

  const nombre = extractInfo('Nombre Completo') || residentName;
  const edad = extractInfo('Edad');
  const cedula = extractInfo('Número de Cédula');
  const fechaIngreso = extractInfo('Fecha de Ingreso');
  const tipoHabitacion = extractInfo('Tipo de Habitación');
  const numeroHabitacion = extractInfo('Número de Habitación');
  const dependencia = extractInfo('Nivel de Dependencia');
  const riesgoCaida = extractInfo('Riesgo de Caída');
  const tipoSangre = extractInfo('Tipo de Sangre');
  const alergias = extractInfo('Alergias');
  const tipoContrato = extractInfo('Tipo de Contrato');
  const telefono = extractInfo('Teléfono');
  const direccion = extractInfo('Dirección');

  const pdfStream = `
BT
/F1 16 Tf
50 720 Td
(INFORME DETALLADO DEL RESIDENTE) Tj
0 -20 Td
(HOGAR SAN JUAN) Tj
0 -35 Td
/F1 10 Tf
(Fecha: ${date}) Tj
0 -25 Td
(Residente: ${nombre.substring(0, 50)}) Tj

0 -35 Td
/F1 12 Tf
(INFORMACION PERSONAL) Tj
0 -5 Td
(========================) Tj
0 -15 Td
/F1 9 Tf
(Nombre: ${nombre.substring(0, 40)}) Tj
0 -12 Td
(Edad: ${edad}) Tj
0 -12 Td
(Cedula: ${cedula}) Tj
0 -12 Td
(Telefono: ${telefono}) Tj
0 -12 Td
(Direccion: ${direccion.substring(0, 50)}) Tj

0 -20 Td
/F1 12 Tf
(INFORMACION DE ALOJAMIENTO) Tj
0 -5 Td
(===============================) Tj
0 -15 Td
/F1 9 Tf
(Fecha de Ingreso: ${fechaIngreso}) Tj
0 -12 Td
(Tipo de Habitacion: ${tipoHabitacion}) Tj
0 -12 Td
(Numero de Habitacion: ${numeroHabitacion}) Tj
0 -12 Td
(Tipo de Contrato: ${tipoContrato}) Tj

0 -20 Td
/F1 12 Tf
(INFORMACION MEDICA) Tj
0 -5 Td
(=====================) Tj
0 -15 Td
/F1 9 Tf
(Nivel de Dependencia: ${dependencia}) Tj
0 -12 Td
(Riesgo de Caida: ${riesgoCaida}) Tj
0 -12 Td
(Tipo de Sangre: ${tipoSangre}) Tj
0 -12 Td
(Alergias: ${alergias.substring(0, 60)}) Tj

0 -25 Td
/F1 10 Tf
(Reporte generado por: Sistema Hogar San Juan) Tj
ET
`;

  const fullPdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources << /Font << /F1 5 0 R >> >>
>>
endobj
4 0 obj
<< /Length ${pdfStream.length} >>
stream${pdfStream}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000229 00000 n 
0000000${300 + pdfStream.length} 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${350 + pdfStream.length}
%%EOF`;

  return Buffer.from(fullPdf);
}

// ---------- Helpers para tablas ----------

function extractTableRows(htmlContent: string): string[][] {
  const rows: string[][] = [];

  try {
    let tableMatch = htmlContent.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
    if (!tableMatch) {
      tableMatch = htmlContent.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
    }

    if (!tableMatch) {
      return rows;
    }

    const tableHtml = tableMatch[1];

    const rowMatches = tableHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);

    if (rowMatches) {
      rowMatches.forEach((rowHtml) => {
        if (rowHtml.includes('<th')) {
          return;
        }

        const cellMatches = rowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
        if (cellMatches) {
          const cells = cellMatches.map((cell) =>
            cell
              .replace(/<[^>]*>/g, '')
              .replace(/&nbsp;/g, ' ')
              .replace(/\s+/g, ' ')
              .trim(),
          );

          if (cells.some((cell) => cell && cell.length > 0)) {
            rows.push(cells);
          }
        }
      });
    }
  } catch (error) {
    console.error('Error extrayendo datos de tabla:', error);
  }

  return rows;
}

// ---------- PDF básico para tablas (general y logs) ----------

function createBasicPdf(htmlContent: string): Buffer {
  const titleMatch = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/);
  const title = titleMatch
    ? titleMatch[1].replace(/<[^>]*>/g, '')
    : 'REPORTE GENERAL DE RESIDENTES - HOGAR SAN JUAN';

  const date = new Date().toLocaleDateString('es-ES');

  const tableRows = extractTableRows(htmlContent);

  let dataRows = tableRows;
  if (tableRows.length === 0) {
    dataRows = [];
  }

  const isLogsReport =
    title.toLowerCase().includes('registro') ||
    title.toLowerCase().includes('registros');
  const isResidentsReport = title.toLowerCase().includes('residentes');

  const headerTopLine = isLogsReport
    ? '(+----------------------+----------+-----+-----+------+--------------------+) Tj'
    : '(+----------------------+------------+------+--------------+--------------+------------+) Tj';

  const headerRowText = isLogsReport
    ? '(| Fecha               | Tipo     | FC  | FR  | SpO2 | Nota/Desc          |) Tj'
    : '(| Nombre               | Cedula     | Sang | Dependencia  | Contrato     | F.Ingreso  |) Tj';

  const footerSummary = isLogsReport
    ? `(Total de registros: ${dataRows.length}) Tj`
    : `(Total de residentes activos: ${dataRows.length}) Tj`;

  let tableRowsText = '';
  dataRows.forEach((row) => {
    const c1 = (row[0] || '').substring(0, 20).padEnd(20);
    const c2 = (row[1] || '').substring(0, 12).padEnd(12);
    const c3 = (row[2] || '').substring(0, 4).padEnd(4);
    const c4 = (row[3] || '').substring(0, 12).padEnd(12);
    const c5 = (row[4] || '').substring(0, 12).padEnd(12);
    const c6 = (row[5] || '').substring(0, 12).padEnd(12);

    tableRowsText += `0 -18 Td (| ${c1} | ${c2} | ${c3} | ${c4} | ${c5} | ${c6} |) Tj `;
  });

  const pdfStream = `
BT
/F1 18 Tf
50 720 Td
(${title.substring(0, 60)}) Tj
0 -35 Td
/F1 10 Tf
(Fecha: ${date}) Tj
0 -40 Td
/F1 8 Tf
${headerTopLine}
0 -15 Td
(${headerRowText})
0 -15 Td
${headerTopLine}
${tableRowsText}
0 -15 Td
${headerTopLine}
0 -25 Td
/F1 10 Tf
(${footerSummary})
0 -20 Td
(Reporte generado por: Sistema Hogar San Juan) Tj
ET
`;

  const fullPdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources << /Font << /F1 5 0 R >> >>
>>
endobj
4 0 obj
<< /Length ${pdfStream.length} >>
stream${pdfStream}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000229 00000 n 
0000000${300 + pdfStream.length} 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${350 + pdfStream.length}
%%EOF`;

  return Buffer.from(fullPdf);
}

// ======================
// FLOW principal
// ======================

const generatePdfReportFlow = ai.defineFlow(
  {
    name: 'generatePdfReportFlow',
    inputSchema: ReportInputSchema,
    outputSchema: ReportOutputSchema,
  },
  async (input) => {
    console.log('🏁 REPORT-FLOW EJECUTÁNDOSE');
    try {
      let htmlContent = '';
      let fileName = `reporte-${Date.now()}.pdf`;

      switch (input.reportType) {
        case 'general':
          htmlContent = getGeneralReportHtml(input.data.residents as Resident[]);
          fileName = 'Reporte_General_Residentes.pdf';
          break;

        case 'individual':
          htmlContent = getIndividualReportHtml(input.data.resident as Resident);
          fileName = `Reporte_Individual_${input.data.resident.name.replace(/\s/g, '_')}.pdf`;
          break;

        case 'dateRange':
          htmlContent = getDateRangeReportHtml(
            input.data.logs as Log[],
            input.data.range as { from: string; to: string },
          );
          fileName = 'Reporte_Registros_por_Fecha.pdf';
          break;

        case 'logsGeneral':
          htmlContent = getAllLogsReportHtml(input.data.logs as Log[]);
          fileName = 'Reporte_General_Registros_Diarios.pdf';
          break;

        case 'residentLogs':
          htmlContent = getResidentLogsReportHtml(
            input.data.resident as Resident,
            input.data.logs as Log[],
            input.data.range as { from: string; to: string } | undefined,
          );
          fileName = `Reporte_Registros_${(input.data.resident.name || 'Residente').replace(
            /\s/g,
            '_',
          )}.pdf`;
          break;
      }

      const pdfBuffer = await htmlToPdf(htmlContent);

      return {
        pdfBase64: pdfBuffer.toString('base64'),
        fileName,
      };
    } catch (error: unknown) {
      console.error('Error generating PDF report:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to generate report: ${errorMessage}`);
    }
  },
);

export async function generatePdfReport(input: ReportInput): Promise<ReportOutput> {
  return generatePdfReportFlow(input);
}
