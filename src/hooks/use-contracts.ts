
"use client"

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';

export type Contract = {
  id: string;
  residentId: string;
  contractType: 'Habitación compartida' | 'Habitación individual';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'Activo' | 'Finalizado' | 'Cancelado';
  documentName: string;
  documentUrl: string; // URL to the uploaded PDF
  createdAt: string; // ISO string
};

const contractsCollection = collection(db, 'resident_contracts');


export function useContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onSnapshot(contractsCollection, (snapshot) => {
        const contractsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contract));
        setContracts(contractsData);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching resident contracts from Firestore: ", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);


  const addContract = useCallback(async (newContractData: Omit<Contract, 'id'>): Promise<Contract> => {
     try {
        const docRef = await addDoc(contractsCollection, newContractData);
        return { id: docRef.id, ...newContractData };
    } catch (error) {
        console.error("Error adding resident contract to Firestore: ", error);
        throw error; // Re-throw the error to be caught by the calling function
    }
  }, []);

  const updateContract = useCallback(async (contractId: string, updatedDetails: Partial<Contract>) => {
    try {
        const contractDoc = doc(db, 'resident_contracts', contractId);
        await updateDoc(contractDoc, updatedDetails);
    } catch (error) {
        console.error("Error updating resident contract in Firestore: ", error);
    }
  }, []);

  return { contracts, addContract, updateContract, isLoading };
}
