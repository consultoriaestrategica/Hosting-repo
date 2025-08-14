
"use client"

import { useState, useEffect, useCallback } from 'react';

export type Staff = {
  id: string;
  name: string;
  role: 'Enfermera' | 'Médico' | 'Fisioterapeuta' | 'Administrativo' | 'Otro';
  idNumber: string;
  phone: string;
  email: string;
  address: string;
  status: 'Activo' | 'Inactivo';
  hireDate: string; // YYYY-MM-DD
  terminationDate?: string; // YYYY-MM-DD
  salary?: number;
};

const initialStaff: Staff[] = [
  {
    id: "staff-001",
    name: "Ana Pérez",
    role: "Enfermera",
    idNumber: "1122334455",
    phone: "3101234567",
    email: "ana.perez@example.com",
    address: "Carrera 5, #10-20",
    status: "Activo",
    hireDate: "2022-08-15",
    salary: 2500000,
  },
  {
    id: "staff-002",
    name: "Carlos Mendoza",
    role: "Médico",
    idNumber: "6677889900",
    phone: "3207654321",
    email: "carlos.mendoza@example.com",
    address: "Avenida 3, #4-50",
    status: "Activo",
    hireDate: "2021-01-20",
    salary: 6000000,
  }
];

const STAFF_STORAGE_KEY = 'staff_members';

export function useStaff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadStaff = useCallback(() => {
    try {
      const storedStaff = localStorage.getItem(STAFF_STORAGE_KEY);
      if (storedStaff) {
        setStaff(JSON.parse(storedStaff));
      } else {
        localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(initialStaff));
        setStaff(initialStaff);
      }
    } catch (error) {
      console.error("Failed to access localStorage for staff", error);
      setStaff(initialStaff);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadStaff();
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STAFF_STORAGE_KEY) {
        loadStaff();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadStaff]);

  const triggerStorageEvent = () => {
     window.dispatchEvent(new StorageEvent('storage', {
        key: STAFF_STORAGE_KEY,
        newValue: localStorage.getItem(STAFF_STORAGE_KEY),
    }));
  }

  const addStaffMember = useCallback((newStaffData: Omit<Staff, 'id'>) => {
    const storedStaff = JSON.parse(localStorage.getItem(STAFF_STORAGE_KEY) || '[]');
    const staffWithId: Staff = { ...newStaffData, id: `staff-${Date.now()}` };
    const updatedStaff = [...storedStaff, staffWithId];
    try {
        localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(updatedStaff));
        triggerStorageEvent();
    } catch (error) {
        console.error("Failed to save to localStorage", error);
    }
  }, []);

  const updateStaffMember = useCallback((staffId: string, updatedDetails: Partial<Staff>) => {
    const storedStaff = JSON.parse(localStorage.getItem(STAFF_STORAGE_KEY) || '[]');
    const updatedStaff = storedStaff.map((member: Staff) => {
        if (member.id === staffId) {
            return { ...member, ...updatedDetails };
        }
        return member;
    });
    try {
        localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(updatedStaff));
        triggerStorageEvent();
    } catch (error) {
        console.error("Failed to save staff update to localStorage", error);
    }
  }, []);

  return { staff, addStaffMember, updateStaffMember, isLoading };
}
