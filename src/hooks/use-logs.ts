
"use client"

import { useState, useEffect, useCallback } from 'react';

// Shared properties
type BaseLog = {
  id: string;
  residentId: string;
  startDate: string; // ISO string for when the report was started
  endDate: string; // ISO string for when the report was submitted
};

// Medical Report
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

// Supply Report
type SupplyLog = BaseLog & {
  reportType: 'suministro';
  supplierName?: string;
  supplyDate?: string; // YYYY-MM-DD
  supplyDescription?: string;
  supplyNotes?: string;
  supplyPhotoEvidenceUrl?: string[];
};

export type Log = MedicalLog | SupplyLog;

const initialLogs: Log[] = [
    { 
      id: "log-001", 
      residentId: "res-001", 
      startDate: new Date(2024, 6, 20, 9, 55).toISOString(), 
      endDate: new Date(2024, 6, 20, 10, 0).toISOString(), 
      reportType: 'medico',
      heartRate: 80,
      respiratoryRate: 18,
      spo2: 98,
      feedingType: 'Vía Oral',
      evolutionNotes: ["Participó en la musicoterapia matutina, se mostró contenta."],
    },
    { 
      id: "log-002", 
      residentId: "res-001", 
      startDate: new Date(2024, 6, 19, 15, 25).toISOString(), 
      endDate: new Date(2024, 6, 19, 15, 30).toISOString(), 
      reportType: 'medico',
      heartRate: 85,
      respiratoryRate: 20,
      spo2: 97,
      feedingType: 'Vía Oral',
      evolutionNotes: ["Experimentó algo de confusión por la tarde, se le brindó apoyo."],
    },
    { 
      id: "log-003", 
      residentId: "res-002", 
      startDate: new Date(2024, 6, 20, 10, 58).toISOString(), 
      endDate: new Date(2024, 6, 20, 11, 0).toISOString(), 
      reportType: 'suministro',
      supplierName: 'Farmacia Central',
      supplyDate: '2024-07-20',
      supplyDescription: 'Entrega de medicamentos mensuales (Lisinopril, Metformina).',
      supplyNotes: 'Se almacenaron correctamente en el dispensario.',
    }
];

const LOGS_STORAGE_KEY = 'daily_reports'; // Renamed key for clarity

export function useLogs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = useCallback(() => {
    try {
      const storedLogs = localStorage.getItem(LOGS_STORAGE_KEY);
      if (storedLogs) {
        setLogs(JSON.parse(storedLogs));
      } else {
        localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(initialLogs));
        setLogs(initialLogs);
      }
    } catch (error) {
      console.error("Failed to access localStorage", error);
      setLogs(initialLogs);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadLogs();
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LOGS_STORAGE_KEY) {
        loadLogs();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadLogs]);

  const addLog = useCallback((newLogData: Omit<Log, 'id'>) => {
    const storedLogs = JSON.parse(localStorage.getItem(LOGS_STORAGE_KEY) || '[]');
    const logWithId: Log = { ...newLogData, id: `log-${Date.now()}` } as Log;
    const updatedLogs = [logWithId, ...storedLogs];
     try {
        localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updatedLogs));
        window.dispatchEvent(new StorageEvent('storage', {
            key: LOGS_STORAGE_KEY,
            newValue: JSON.stringify(updatedLogs),
        }));
    } catch (error) {
        console.error("Failed to save to localStorage", error);
    }
  }, []);

  return { logs, addLog, isLoading };
}
