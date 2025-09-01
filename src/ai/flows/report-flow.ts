'use server';
/**
 * @fileOverview Un agente de IA para la generación de reportes en PDF.
 *
 * - generatePdfReport - Una función que maneja la creación de los reportes en PDF.
 * - ReportInput - El tipo de entrada para la función generatePdfReport.
 * - ReportOutput - El tipo de salida para la función generatePdfReport.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import puppeteer from 'puppeteer';
import { Resident, Log } from '@/hooks/use-residents'; // Asumiendo que Log también se exporta desde aquí

const ReportInputSchema = z.object({
    reportType: z.enum(['general', 'individual', 'dateRange']),
    data: z.any(),
});

const ReportOutputSchema = z.object({
    pdfBase64: z.string().describe('El contenido del PDF codificado en base64.'),
    fileName: z.string().describe('El nombre de archivo sugerido para el PDF.'),
});

export type ReportInput = z.infer<typeof ReportInputSchema>;
export type ReportOutput = z.infer<typeof ReportOutputSchema>;

// HTML Generation Helpers
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

function getGeneralReportHtml(residents: Resident[]): string {
    const activeResidents = residents.filter(r => r.status === 'Activo');
    return `
        <html>
            <head><style>${getCssStyles()}</style></head>
            <body>
                <div class="header">
                    <h1>Reporte General de Residentes</h1>
                    <p>Generado el ${new Date().toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Nombre Completo</th>
                            <th>Habitación</th>
                            <th>Nivel de Dependencia</th>
                            <th>Edad</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${activeResidents.map(r => `
                            <tr>
                                <td>${r.name}</td>
                                <td>${r.roomType} ${r.roomNumber || ''}</td>
                                <td>${r.dependency}</td>
                                <td>${r.age}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
        </html>
    `;
}

function getIndividualReportHtml(resident: Resident): string {
     return `
        <html>
            <head><style>${getCssStyles()}</style></head>
            <body>
                <div class="header">
                    <h1>Informe Detallado del Residente</h1>
                    <p>Generado para <strong>${resident.name}</strong> el ${new Date().toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
                </div>
                
                <h2>Información Personal</h2>
                <div class="card">
                    <div class="info-row"><strong>Nombre:</strong> <span>${resident.name}</span></div>
                    <div class="info-row"><strong>Edad:</strong> <span>${resident.age} años</span></div>
                    <div class="info-row"><strong>Cédula:</strong> <span>${resident.idNumber}</span></div>
                    <div class="info-row"><strong>Fecha de Ingreso:</strong> <span>${new Date(resident.admissionDate).toLocaleDateString('es-ES', {dateStyle: 'long'})}</span></div>
                    <div class="info-row"><strong>Habitación:</strong> <span>${resident.roomType} ${resident.roomNumber || ''}</span></div>
                </div>

                <h2>Información de Cuidado</h2>
                <div class="card">
                     <div class="info-row"><strong>Nivel de Dependencia:</strong> <span>${resident.dependency}</span></div>
                     <div class="info-row"><strong>Riesgo de Caída:</strong> <span>${resident.fallRisk}</span></div>
                     <div class="info-row"><strong>Tipo de Sangre:</strong> <span>${resident.bloodType}</span></div>
                     <div class="info-row"><strong>Alergias:</strong> <span>${resident.allergies?.join(', ') || 'Ninguna'}</span></div>
                </div>
                
                 <h2>Medicamentos</h2>
                <div class="card">
                ${resident.medications && resident.medications.length > 0 ? `
                    <table>
                        <thead><tr><th>Medicamento</th><th>Dosis</th><th>Frecuencia</th></tr></thead>
                        <tbody>
                            ${resident.medications.map(med => `
                                <tr><td>${med.name}</td><td>${med.dose}</td><td>${med.frequency}</td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : '<p>No hay medicamentos registrados.</p>'}
                </div>
            </body>
        </html>
    `;
}

function getDateRangeReportHtml(logs: Log[], range: { from: string, to: string }): string {
     return `
        <html>
            <head><style>${getCssStyles()}</style></head>
            <body>
                <div class="header">
                    <h1>Reporte de Registros por Fecha</h1>
                    <p>Período: ${new Date(range.from).toLocaleDateString('es-ES')} - ${new Date(range.to).toLocaleDateString('es-ES')}</p>
                </div>
                
                ${logs.map(log => `
                    <div class="card">
                        <div class="card-title">
                            ${log.reportType === 'medico' ? 'Reporte Médico' : 'Reporte de Suministro'} - ${new Date(log.endDate).toLocaleString('es-ES')}
                        </div>
                        ${log.reportType === 'medico' ? `
                             <div class="info-row"><strong>Frecuencia Cardíaca:</strong> <span>${log.heartRate || 'N/A'} lpm</span></div>
                             <div class="info-row"><strong>Frecuencia Respiratoria:</strong> <span>${log.respiratoryRate || 'N/A'} rpm</span></div>
                             <div class="info-row"><strong>Saturación O2:</strong> <span>${log.spo2 || 'N/A'} %</span></div>
                             <p><strong>Notas:</strong> ${Array.isArray(log.evolutionNotes) ? log.evolutionNotes.join(', ') : (log.evolutionNotes || 'N/A')}</p>
                        ` : `
                             <div class="info-row"><strong>Entregado por:</strong> <span>${log.supplierName || 'N/A'}</span></div>
                             <div class="info-row"><strong>Descripción:</strong> <span>${log.supplyDescription || 'N/A'}</span></div>
                        `}
                    </div>
                `).join('')}
                 ${logs.length === 0 ? '<p>No se encontraron registros en este período.</p>' : ''}
            </body>
        </html>
    `;
}


const generatePdfReportFlow = ai.defineFlow(
    {
        name: 'generatePdfReportFlow',
        inputSchema: ReportInputSchema,
        outputSchema: ReportOutputSchema,
    },
    async (input) => {
        let htmlContent = '';
        let fileName = `reporte-${Date.now()}.pdf`;

        switch (input.reportType) {
            case 'general':
                htmlContent = getGeneralReportHtml(input.data.residents);
                fileName = 'Reporte_General_Residentes.pdf';
                break;
            case 'individual':
                htmlContent = getIndividualReportHtml(input.data.resident);
                fileName = `Reporte_Individual_${input.data.resident.name.replace(/\s/g, '_')}.pdf`;
                break;
            case 'dateRange':
                htmlContent = getDateRangeReportHtml(input.data.logs, input.data.range);
                fileName = 'Reporte_por_Fecha.pdf';
                break;
        }

        const browser = await puppeteer.launch({ 
            headless: true, 
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();

        return {
            pdfBase64: pdfBuffer.toString('base64'),
            fileName: fileName
        };
    }
);


export async function generatePdfReport(input: ReportInput): Promise<ReportOutput> {
  return generatePdfReportFlow(input);
}
