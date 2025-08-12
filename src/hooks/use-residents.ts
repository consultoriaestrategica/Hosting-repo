
"use client"

import { useState, useEffect, useCallback } from 'react';

type PhoneContact = {
    number: string;
};

type FamilyContact = {
  name: string;
  kinship: string;
  address: string;
  phones: PhoneContact[];
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

export type Resident = {
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
  roomType: "Habitación compartida" | "Habitación individual";
  roomNumber?: string;
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
    roomType: "Habitación individual",
    roomNumber: "101",
    bloodType: "O+",
    fallRisk: "Alto",
    pathologies: ["Alzheimer", "Hipertensión"],
    allergies: ["Penicilina"],
    medications: [
        { name: "Donepezilo", dose: "10mg", frequency: "Cada noche" },
        { name: "Lisinopril", dose: "20mg", frequency: "Cada mañana" },
    ],
    familyContacts: [
        { name: "Juan Rodriguez", kinship: "Hijo", address: "Calle Falsa 123, Ciudad", phones: [{ number: "+1-202-555-0182" }], email: "juan.r@example.com" }
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
    roomType: "Habitación compartida",
    roomNumber: "205-A",
    bloodType: "A-",
    fallRisk: "Medio",
    pathologies: ["Diabetes"],
    medications: [
        { name: "Metformina", dose: "850mg", frequency: "Diaria" },
    ],
     familyContacts: [
        { name: "Ana Gomez", kinship: "Hija", address: "Avenida Siempre Viva 742", phones: [{ number: "+1-202-555-0183" }], email: "ana.g@example.com" }
    ],
  },
   { 
    id: "res-003", 
    name: "Ana Torres", 
    age: 85,
    dob: "1939-11-01",
    idNumber: "11223344",
    dependency: "Independiente", 
    status: "Inactivo", 
    admissionDate: "2022-10-01", 
    roomType: "Habitación compartida",
  },
   { 
    id: "res-004", 
    name: "Luis Fernandez", 
    age: 75,
    dob: "1949-07-30",
    idNumber: "55667788",
    dependency: "Independiente", 
    status: "Activo", 
    admissionDate: "2024-02-10", 
    roomType: "Habitación individual",
  },
   { 
    id: "res-005", 
    name: "Elena Sanchez", 
    age: 88,
    dob: "1936-09-05",
    idNumber: "99887766",
    dependency: "Dependiente", 
    status: "Activo", 
    admissionDate: "2023-05-18", 
    roomType: "Habitación individual",
  },
   { 
    id: "res-006", 
    name: "Lucelly Acevedo", 
    age: 79,
    dob: "1945-01-25",
    idNumber: "12312312",
    dependency: "Independiente", 
    status: "Activo", 
    admissionDate: "2023-08-01", 
    roomType: "Habitación compartida",
  },
  { 
    id: "res-007", 
    name: "Carlos Gallo", 
    age: 81,
    dob: "1943-06-12",
    idNumber: "45645645",
    dependency: "Independiente", 
    status: "Activo", 
    admissionDate: "2023-09-02", 
    roomType: "Habitación compartida",
  },
  { 
    id: "res-008", 
    name: "Marta Lucia Ramirez", 
    age: 90,
    dob: "1934-04-10",
    idNumber: "78978978",
    dependency: "Dependiente", 
    status: "Activo", 
    admissionDate: "2022-12-15", 
    roomType: "Habitación individual",
  },
  { 
    id: "res-009", 
    name: "Jorge Ivan Perez", 
    age: 76,
    dob: "1948-02-28",
    idNumber: "14725836",
    dependency: "Independiente", 
    status: "Activo", 
    admissionDate: "2024-01-20", 
    roomType: "Habitación compartida",
  },
  { 
    id: "res-010", 
    name: "Sofia Vergara", 
    age: 83,
    dob: "1941-10-17",
    idNumber: "36925814",
    dependency: "Dependiente", 
    status: "Activo", 
    admissionDate: "2023-11-05", 
    roomType: "Habitación individual",
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
        const parsedResidents = JSON.parse(storedResidents);
        if(parsedResidents.length === 0) {
             localStorage.setItem(RESIDENTS_STORAGE_KEY, JSON.stringify(initialResidents));
             setResidents(initialResidents);
        } else {
            setResidents(parsedResidents);
        }
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

    