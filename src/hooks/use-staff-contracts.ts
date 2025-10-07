"use client"

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';

export type StaffContract = {
  id: string;
  staffId: string;
  salary: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'Activo' | 'Finalizado' | 'Cancelado';
  documentName: string;
  documentUrl: string; // URL to the uploaded PDF
  createdAt: string; // ISO string
};

const staffContractsCollection = collection(db, 'staff_contracts');

export function useStaffContracts() {
  const [contracts, setContracts] = useState<StaffContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onSnapshot(staffContractsCollection, (snapshot) => {
        const contractsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StaffContract));
        setContracts(contractsData);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching staff contracts from Firestore: ", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addStaffContract = useCallback(async (newContractData: Omit<StaffContract, 'id'>): Promise<StaffContract> => {
     try {
        const docRef = await addDoc(staffContractsCollection, newContractData);
        return { id: docRef.id, ...newContractData };
    } catch (error) {
        console.error("Error adding staff contract to Firestore: ", error);
        throw error; // Re-throw the error to be caught by the calling function
    }
  }, []);

  const updateStaffContract = useCallback(async (contractId: string, updatedDetails: Partial<StaffContract>) => {
    try {
        const contractDoc = doc(db, 'staff_contracts', contractId);
        await updateDoc(contractDoc, updatedDetails);
    } catch (error) {
        console.error("Error updating staff contract in Firestore: ", error);
    }
  }, []);

  return { contracts, addStaffContract, updateStaffContract, isLoading };
}