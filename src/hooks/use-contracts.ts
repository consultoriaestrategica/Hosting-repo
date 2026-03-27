"use client"

import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export type Contract = {
  id: string;
  residentId: string;
  contractType: 'Habitación compartida' | 'Habitación individual';
  startDate: string;
  endDate: string;
  status: 'Activo' | 'Finalizado' | 'Cancelado';
  documentName: string;
  documentUrl: string;
  createdAt: string;
};

const contractsCollection = collection(db, 'resident_contracts');

export function useContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
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
      unsubSnapshot = onSnapshot(contractsCollection, (snapshot) => {
        const contractsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contract));
        setContracts(contractsData);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching resident contracts from Firestore: ", error);
        setIsLoading(false);
      });
    });

    return () => {
      unsubAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  const addContract = useCallback(async (newContractData: Omit<Contract, 'id'>): Promise<Contract> => {
    try {
      const docRef = await addDoc(contractsCollection, newContractData);
      return { id: docRef.id, ...newContractData };
    } catch (error) {
      console.error("Error adding resident contract:", error);
      throw error;
    }
  }, []);

  const updateContract = useCallback(async (id: string, updates: Partial<Omit<Contract, 'id'>>) => {
    try {
      await updateDoc(doc(db, 'resident_contracts', id), updates);
    } catch (error) {
      console.error("Error updating resident contract:", error);
      throw error;
    }
  }, []);

  return { contracts, isLoading, addContract, updateContract };
}