"use client"

import { useState, useEffect, useCallback } from 'react';

export type Contract = {
  id: string;
  residentId: string;
  contractType: 'Básica' | 'Premium';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'Activo' | 'Finalizado' | 'Cancelado';
  details: string; // Markdown text of the contract
  createdAt: string; // ISO string
};

const initialContracts: Contract[] = [];

const CONTRACTS_STORAGE_KEY = 'contracts';

export function useContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadContracts = useCallback(() => {
    try {
      const storedContracts = localStorage.getItem(CONTRACTS_STORAGE_KEY);
      if (storedContracts) {
        setContracts(JSON.parse(storedContracts));
      } else {
        localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(initialContracts));
        setContracts(initialContracts);
      }
    } catch (error) {
      console.error("Failed to access localStorage for contracts", error);
      setContracts(initialContracts);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadContracts();
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === CONTRACTS_STORAGE_KEY) {
        loadContracts();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadContracts]);

  const addContract = useCallback((newContractData: Omit<Contract, 'id'>): Contract => {
    const storedContracts = JSON.parse(localStorage.getItem(CONTRACTS_STORAGE_KEY) || '[]');
    const contractWithId: Contract = { ...newContractData, id: `contract-${Date.now()}` };
    const updatedContracts = [...storedContracts, contractWithId];
     try {
        localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(updatedContracts));
        window.dispatchEvent(new StorageEvent('storage', {
            key: CONTRACTS_STORAGE_KEY,
            newValue: JSON.stringify(updatedContracts),
        }));
    } catch (error) {
        console.error("Failed to save to localStorage", error);
    }
    return contractWithId;
  }, []);

  const updateContract = useCallback((contractId: string, updatedDetails: Partial<Contract>) => {
    const storedContracts = JSON.parse(localStorage.getItem(CONTRACTS_STORAGE_KEY) || '[]');
    const updatedContracts = storedContracts.map((contract: Contract) => {
        if (contract.id === contractId) {
            return { ...contract, ...updatedDetails };
        }
        return contract;
    });
    try {
        localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(updatedContracts));
        window.dispatchEvent(new StorageEvent('storage', {
            key: CONTRACTS_STORAGE_KEY,
            newValue: JSON.stringify(updatedContracts),
        }));
    } catch (error) {
        console.error("Failed to save to localStorage", error);
    }
  }, []);

  return { contracts, addContract, updateContract, isLoading };
}
