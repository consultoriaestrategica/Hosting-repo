
"use client"

import { useState, useEffect, useCallback } from 'react';

type Resident = {
  id: string;
  name: string;
  age: number;
  pathology: string;
  dependency: "Baja" | "Media" | "Alta";
  status: "Activo" | "Inactivo";
  admissionDate: string;
  roomType: "Básica" | "Premium";
};

const initialResidents: Resident[] = [
  { id: "res-001", name: "Maria Rodriguez", age: 82, pathology: "Alzheimer", dependency: "Alta", status: "Activo", admissionDate: "2023-01-15", roomType: "Premium" },
  { id: "res-002", name: "Carlos Gomez", age: 78, pathology: "Hipertensión", dependency: "Media", status: "Activo", admissionDate: "2023-03-20", roomType: "Básica" },
  { id: "res-003", name: "Ana Torres", age: 85, pathology: "Diabetes", dependency: "Media", status: "Inactivo", admissionDate: "2022-11-10", roomType: "Básica" },
  { id: "res-004", name: "Luis Fernandez", age: 75, pathology: "Artritis", dependency: "Baja", status: "Activo", admissionDate: "2024-02-01", roomType: "Premium" },
  { id: "res-005", name: "Elena Sanchez", age: 90, pathology: "Cardiopatía", dependency: "Alta", status: "Activo", admissionDate: "2021-06-12", roomType: "Premium" },
];

const RESIDENTS_STORAGE_KEY = 'residents';

export function useResidents() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadResidents = useCallback(() => {
    try {
      const storedResidents = localStorage.getItem(RESIDENTS_STORAGE_KEY);
      if (storedResidents) {
        setResidents(JSON.parse(storedResidents));
      } else {
        localStorage.setItem(RESIDENTS_STORAGE_KEY, JSON.stringify(initialResidents));
        setResidents(initialResidents);
      }
    } catch (error) {
      console.error("Failed to access localStorage", error);
      setResidents(initialResidents);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadResidents();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === RESIDENTS_STORAGE_KEY) {
        loadResidents();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadResidents]);


  const addResident = useCallback((newResident: Omit<Resident, 'id'>) => {
    const residentWithId = { ...newResident, id: `res-${Date.now()}` };
    const updatedResidents = [...residents, residentWithId];
    try {
        localStorage.setItem(RESIDENTS_STORAGE_KEY, JSON.stringify(updatedResidents));
         window.dispatchEvent(new StorageEvent('storage', {
            key: RESIDENTS_STORAGE_KEY,
            newValue: JSON.stringify(updatedResidents),
        }));
    } catch (error) {
        console.error("Failed to save to localStorage", error);
    }
  }, [residents]);

  return { residents, addResident, isLoading };
}
