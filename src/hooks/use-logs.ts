
"use client"

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';

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

const logsCollection = collection(db, 'logs');

export function useLogs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onSnapshot(logsCollection, (snapshot) => {
        const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Log));
        setLogs(logsData);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching logs from Firestore: ", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addLog = useCallback(async (newLogData: Omit<Log, 'id'>) => {
    try {
        // We add the 'endDate' right before saving, which is more accurate.
        const logWithEndDate = { ...newLogData, endDate: new Date().toISOString() };
        await addDoc(logsCollection, logWithEndDate);
    } catch (error) {
        console.error("Error adding log to Firestore: ", error);
    }
  }, []);

  return { logs, addLog, isLoading };
}
