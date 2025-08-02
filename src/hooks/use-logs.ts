
"use client"

import { useState, useEffect, useCallback } from 'react';

type Log = {
  id: string;
  residentId: string;
  date: string;
  mood: string;
  appetite: string;
  sleep: string;
  vitals?: string;
  medsAdministered?: boolean;
  notes: string;
};

const initialLogs: Log[] = [
    { id: "log-001", residentId: "res-001", date: new Date(2024, 6, 20).toISOString(), mood: "Calmada", appetite: "Bueno", sleep: "Reparador", vitals: "130/85, 72ppm, 36.8°C", medsAdministered: true, notes: "Participó en la musicoterapia matutina." },
    { id: "log-002", residentId: "res-001", date: new Date(2024, 6, 19).toISOString(), mood: "Agitada", appetite: "Regular", sleep: "Interrumpido", vitals: "135/88, 78ppm, 37.0°C", medsAdministered: true, notes: "Experimentó algo de confusión por la tarde." },
    { id: "log-003", residentId: "res-001", date: new Date(2024, 6, 18).toISOString(), mood: "Feliz", appetite: "Bueno", sleep: "Bueno", vitals: "128/82, 70ppm, 36.7°C", medsAdministered: true, notes: "Disfrutó la visita de su familia." },
    { id: "log-004", residentId: "res-002", date: new Date(2024, 6, 20).toISOString(), mood: "Feliz", appetite: "Bueno", sleep: "Bueno", vitals: "140/90, 80ppm, 36.9°C", medsAdministered: true, notes: "Presión arterial estable." },
];

const LOGS_STORAGE_KEY = 'daily_logs';

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

  const addLog = useCallback((newLog: Omit<Log, 'id'>) => {
    const logWithId = { ...newLog, id: `log-${Date.now()}` };
    const updatedLogs = [logWithId, ...logs];
     try {
        localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updatedLogs));
        // Manually dispatch event for the current tab to pick up the change
        window.dispatchEvent(new StorageEvent('storage', {
            key: LOGS_STORAGE_KEY,
            newValue: JSON.stringify(updatedLogs),
        }));
    } catch (error) {
        console.error("Failed to save to localStorage", error);
    }
  }, [logs]);

  return { logs, addLog, isLoading };
}
