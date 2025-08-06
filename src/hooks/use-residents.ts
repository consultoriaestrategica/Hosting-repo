
"use client"

import { useState, useEffect, useCallback } from 'react';

type FamilyContact = {
  name: string;
  kinship: string;
  phone: string;
  email: string;
};

type Medication = {
  name: string;
  dose: string;
  frequency: string;
};

type ResidentDocument = {
  type: string; // e.g., "Contrato", "Cédula de Paciente"
  name: string;
  size: number;
};

type Resident = {
  id: string;
  name: string;
  age: number;
  dob: string;
  idNumber: string;
  pathologies?: string[];
  allergies?: string[];
  dependency: "Dependiente" | "Independiente";
  status: "Activo" | "Inactivo";
  admissionDate: string;
  roomType: "Básica" | "Premium";
  bloodType?: string;
  fallRisk?: "Bajo" | "Medio" | "Alto";
  familyContacts?: FamilyContact[];
  medications?: Medication[];
  diet?: string;
  documents?: ResidentDocument[];
};

const initialResidents: Resident[] = [
  { 
    id: "res-001", 
    name: "Maria Rodriguez", 
    age: 82,
    dob: "1942-05-15",
    idNumber: "12345678",
    dependency: "Dependiente", 
    status: "Activo", 
    admissionDate: "2023-01-15", 
    roomType: "Premium",
    bloodType: "O+",
    fallRisk: "Alto",
    pathologies: ["Alzheimer", "Hipertensión"],
    allergies: ["Penicilina"],
    medications: [
        { name: "Donepezilo", dose: "10mg", frequency: "Cada noche" },
        { name: "Lisinopril", dose: "20mg", frequency: "Cada mañana" },
    ],
    familyContacts: [
        { name: "Juan Rodriguez", kinship: "Hijo", phone: "+1-202-555-0182", email: "juan.r@example.com" }
    ],
    documents: [
        { type: "Cédula de Paciente", name: "cedula_maria.pdf", size: 1024 },
        { type: "Historia Clínica", name: "historia_clinica_maria.pdf", size: 2048 },
    ],
    diet: "Baja en sodio, alimentos blandos",
  },
   { 
    id: "res-002", 
    name: "Carlos Gomez", 
    age: 78,
    dob: "1946-03-22",
    idNumber: "87654321",
    dependency: "Independiente", 
    status: "Activo", 
    admissionDate: "2023-03-20", 
    roomType: "Básica",
    bloodType: "A-",
    fallRisk: "Medio",
    pathologies: ["Hipertensión"],
    medications: [
        { name: "Lisinopril", dose: "10mg", frequency: "Diaria" },
    ],
     familyContacts: [
        { name: "Ana Gomez", kinship: "Hija", phone: "+1-202-555-0183", email: "ana.g@example.com" }
    ],
  },
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

    