
"use client"

import { useState, useEffect, useCallback } from 'react';

export type StaffContract = {
  id: string;
  staffId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'Activo' | 'Finalizado' | 'Cancelado';
  salary: number;
  documentName: string;
  documentUrl: string; // URL to the uploaded PDF
  createdAt: string; // ISO string
};

const initialContracts: StaffContract[] = [];

const STAFF_CONTRACTS_STORAGE_KEY = 'staff_contracts';

export function useStaffContracts() {
  const [contracts, setContracts] = useState<StaffContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadContracts = useCallback(() => {
    try {
      const storedContractsJson = localStorage.getItem(STAFF_CONTRACTS_STORAGE_KEY);
      if (storedContractsJson) {
         let storedContracts = JSON.parse(storedContractsJson);

         const needsMigration = storedContracts.some((c: any) => c.details && !c.documentUrl);
         if (needsMigration) {
             storedContracts = storedContracts.map((c: any) => {
                 if (c.details && !c.documentUrl) {
                     return {
                         ...c,
                         documentName: `contrato-personal-${c.id}.pdf`,
                         documentUrl: '', 
                         details: undefined,
                     };
                 }
                 return c;
             });
              localStorage.setItem(STAFF_CONTRACTS_STORAGE_KEY, JSON.stringify(storedContracts));
         }
        setContracts(storedContracts);
      } else {
        localStorage.setItem(STAFF_CONTRACTS_STORAGE_KEY, JSON.stringify(initialContracts));
        setContracts(initialContracts);
      }
    } catch (error) {
      console.error("Failed to access localStorage for staff contracts", error);
      setContracts(initialContracts);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadContracts();
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STAFF_CONTRACTS_STORAGE_KEY) {
        loadContracts();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadContracts]);

  const addContract = useCallback((newContractData: Omit<StaffContract, 'id'>): StaffContract => {
    const storedContracts = JSON.parse(localStorage.getItem(STAFF_CONTRACTS_STORAGE_KEY) || '[]');
    const contractWithId: StaffContract = { ...newContractData, id: `staff-contract-${Date.now()}` };
    const updatedContracts = [...storedContracts, contractWithId];
     try {
        localStorage.setItem(STAFF_CONTRACTS_STORAGE_KEY, JSON.stringify(updatedContracts));
        window.dispatchEvent(new StorageEvent('storage', {
            key: STAFF_CONTRACTS_STORAGE_KEY,
            newValue: JSON.stringify(updatedContracts),
        }));
    } catch (error) {
        console.error("Failed to save to localStorage", error);
    }
    return contractWithId;
  }, []);

  const updateContract = useCallback((contractId: string, updatedDetails: Partial<StaffContract>) => {
    const storedContracts = JSON.parse(localStorage.getItem(STAFF_CONTRACTS_STORAGE_KEY) || '[]');
    const updatedContracts = storedContracts.map((contract: StaffContract) => {
        if (contract.id === contractId) {
            return { ...contract, ...updatedDetails };
        }
        return contract;
    });
    try {
        localStorage.setItem(STAFF_CONTRACTS_STORAGE_KEY, JSON.stringify(updatedContracts));
        window.dispatchEvent(new StorageEvent('storage', {
            key: STAFF_CONTRACTS_STORAGE_KEY,
            newValue: JSON.stringify(updatedContracts),
        }));
    } catch (error) {
        console.error("Failed to save to localStorage", error);
    }
  }, []);

  return { contracts, addContract, updateContract, isLoading };
}
