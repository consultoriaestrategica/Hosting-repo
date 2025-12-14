"use client"

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { useFamilyAuth } from './use-family-auth';
import { subDays } from 'date-fns';

// ============================================
// TIPOS DE LOGS
// ============================================

type BaseLog = {
  id: string;
  residentId: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
};

type MedicalLog = BaseLog & {
  reportType: 'medico';
  heartRate?: number;
  respiratoryRate?: number;
  spo2?: number;
  feedingType?: string;
  evolutionNotes?: string[];
  photoEvidenceUrl?: string[];
  visitType?: string;
  professionalName?: string;
  entryTime?: string;
  exitTime?: string;
};

type SupplyLog = BaseLog & {
  reportType: 'suministro';
  supplierName?: string;
  supplyDate?: string; // YYYY-MM-DD
  supplyDescription?: string;
  supplyNotes?: string;
  supplyPhotoEvidenceUrl?: string[];
};

export type Log = MedicalLog | SupplyLog;

// ============================================
// HOOK: useFamilyLogs
// ============================================

/**
 * Hook especializado para que los familiares obtengan logs de los últimos 7 días
 * de su residente asignado.
 * 
 * Características:
 * - Solo devuelve logs del residente asociado al familiar autenticado
 * - Filtra automáticamente los últimos 7 días
 * - Escucha cambios en tiempo real
 * - Ordena por fecha descendente (más recientes primero)
 * - Calcula estadísticas útiles
 * 
 * @returns {Object} { logs, stats, isLoading, error }
 */
export function useFamilyLogs() {
  const { familyMember, isLoading: familyLoading } = useFamilyAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('📊 useFamilyLogs: Iniciando...', {
      familyMember: familyMember?.name,
      residentId: familyMember?.residentId,
      familyLoading
    });

    // Esperar a que termine de cargar la autenticación del familiar
    if (familyLoading) {
      console.log('⏳ useFamilyLogs: Esperando autenticación...');
      setIsLoading(true);
      return;
    }

    // Si no hay familiar autenticado o no tiene residentId, no hacer nada
    if (!familyMember?.residentId) {
      console.log('⚠️ useFamilyLogs: No hay familiar o residentId');
      setLogs([]);
      setIsLoading(false);
      return;
    }

    // Calcular fecha de hace 7 días
    const sevenDaysAgo = subDays(new Date(), 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    console.log('📅 useFamilyLogs: Rango de fechas', {
      desde: sevenDaysAgoISO,
      hasta: new Date().toISOString(),
      residentId: familyMember.residentId
    });

    // Crear query para obtener logs del residente en los últimos 7 días
    const logsQuery = query(
      collection(db, 'logs'),
      where('residentId', '==', familyMember.residentId),
      where('endDate', '>=', sevenDaysAgoISO)
    );

    console.log('🔍 useFamilyLogs: Query configurado');

    setIsLoading(true);

    // Escuchar cambios en tiempo real
    const unsubscribe = onSnapshot(
      logsQuery,
      (snapshot) => {
        console.log('📡 useFamilyLogs: Snapshot recibido', {
          documentos: snapshot.size
        });

        const logsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data
          } as Log;
        });

        // Ordenar por fecha descendente (más recientes primero)
        logsData.sort((a, b) => {
          const dateA = new Date(a.endDate).getTime();
          const dateB = new Date(b.endDate).getTime();
          return dateB - dateA;
        });

        console.log('✅ useFamilyLogs: Logs procesados', {
          total: logsData.length,
          medicos: logsData.filter(l => l.reportType === 'medico').length,
          suministros: logsData.filter(l => l.reportType === 'suministro').length
        });

        setLogs(logsData);
        setIsLoading(false);
        setError(null);
      },
      (error) => {
        console.error('❌ useFamilyLogs: Error en snapshot:', error);
        console.error('Código de error:', error.code);
        console.error('Mensaje:', error.message);
        
        setError('Error al cargar los registros');
        setIsLoading(false);
        setLogs([]);
      }
    );

    // Cleanup: desuscribirse cuando el componente se desmonte
    return () => {
      console.log('🧹 useFamilyLogs: Limpiando listener');
      unsubscribe();
    };
  }, [familyMember, familyLoading]);

  // Calcular estadísticas de los logs
  const stats = useMemo(() => {
    const medicalLogs = logs.filter(log => log.reportType === 'medico').length;
    const supplyLogs = logs.filter(log => log.reportType === 'suministro').length;
    
    const statistics = {
      total: logs.length,
      medical: medicalLogs,
      supply: supplyLogs,
    };

    console.log('📈 useFamilyLogs: Estadísticas calculadas', statistics);

    return statistics;
  }, [logs]);

  return { 
    logs,      // Array de logs filtrados y ordenados
    stats,     // Estadísticas: { total, medical, supply }
    isLoading, // Boolean: estado de carga
    error      // String | null: mensaje de error
  };
}