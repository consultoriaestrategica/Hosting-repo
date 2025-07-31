
"use client"

import { useState, useEffect, useCallback } from 'react';

type Resident = {
  id: string;
  name: string;
  age: number;
  pathology: string;
  dependency: "Baja" | "Media" | "Alta";
  status: "Activo" | "Inactivo";
};

const initialResidents: Resident[] = [
  { id: "res-001", name: "Maria Rodriguez", age: 82, pathology: "Alzheimer", dependency: "Alta", status: "Activo" },
  { id: "res-002", name: "Carlos Gomez", age: 78, pathology: "Hipertensión", dependency: "Media", status: "Activo" },
  { id: "res-003", name: "Ana Torres", age: 85, pathology: "Diabetes", dependency: "Media", status: "Inactivo" },
  { id: "res-004", name: "Luis Fernandez", age: 75, pathology: "Artritis", dependency: "Baja", status: "Activo" },
  { id: "res-005", name: "Elena Sanchez", age: 90, pathology: "Cardiopatía", dependency: "Alta", status: "Activo" },
];

const RESIDENTS_STORAGE_KEY = 'residents';

export function useResidents() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

  const addResident = useCallback((newResident: Resident) => {
    const updatedResidents = [...residents, newResident];
    setResidents(updatedResidents);
    try {
        localStorage.setItem(RESIDENTS_STORAGE_KEY, JSON.stringify(updatedResidents));
    } catch (error) {
        console.error("Failed to save to localStorage", error);
    }
  }, [residents]);

  return { residents, addResident, isLoading };
}
