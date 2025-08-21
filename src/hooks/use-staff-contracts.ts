
"use client"

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';


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


  const addContract = useCallback(async (newContractData: Omit<StaffContract, 'id'>): Promise<StaffContract> => {
    try {
        const docRef = await addDoc(staffContractsCollection, newContractData);
        return { ...newContractData, id: docRef.id };
    } catch (error) {
        console.error("Error adding staff contract to Firestore: ", error);
        // In case of error, return a non-persistent object to avoid breaking the UI flow
        return { ...newContractData, id: `error-${Date.now()}` };
    }
  }, []);

  const updateContract = useCallback(async (contractId: string, updatedDetails: Partial<StaffContract>) => {
    try {
        const contractDoc = doc(db, 'staff_contracts', contractId);
        await updateDoc(contractDoc, updatedDetails);
    } catch (error) {
        console.error("Error updating staff contract in Firestore: ", error);
    }
  }, []);

  return { contracts, addContract, updateContract, isLoading };
}
