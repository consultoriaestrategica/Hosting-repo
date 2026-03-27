"use client"

import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export type StaffContract = {
  id: string;
  staffId: string;
  salary: number;
  startDate: string;
  endDate: string;
  status: 'Activo' | 'Finalizado' | 'Cancelado';
  documentName: string;
  documentUrl: string;
  createdAt: string;
};

const staffContractsCollection = collection(db, 'staff_contracts');

export function useStaffContracts() {
  const [contracts, setContracts] = useState<StaffContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubSnapshot: (() => void) | null = null;

    // FIX: Esperar autenticación
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubSnapshot) {
        unsubSnapshot();
        unsubSnapshot = null;
      }

      if (!user) {
        setContracts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      unsubSnapshot = onSnapshot(staffContractsCollection, (snapshot) => {
        const contractsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StaffContract));
        setContracts(contractsData);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching staff contracts from Firestore: ", error);
        setIsLoading(false);
      });
    });

    return () => {
      unsubAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  const addStaffContract = useCallback(async (newContractData: Omit<StaffContract, 'id'>): Promise<StaffContract> => {
    try {
      const docRef = await addDoc(staffContractsCollection, newContractData);
      return { id: docRef.id, ...newContractData };
    } catch (error) {
      console.error("Error adding staff contract:", error);
      throw error;
    }
  }, []);

  const updateStaffContract = useCallback(async (id: string, updates: Partial<Omit<StaffContract, 'id'>>) => {
    try {
      await updateDoc(doc(db, 'staff_contracts', id), updates);
    } catch (error) {
      console.error("Error updating staff contract:", error);
      throw error;
    }
  }, []);

  return { contracts, isLoading, addStaffContract, updateStaffContract };
}