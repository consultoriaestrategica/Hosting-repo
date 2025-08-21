
"use client"

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';

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

const staffCollection = collection(db, 'staff');


export function useStaff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onSnapshot(staffCollection, (snapshot) => {
        const staffData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));
        setStaff(staffData);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching staff from Firestore: ", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);


  const addStaffMember = useCallback(async (newStaffData: Omit<Staff, 'id'>) => {
    try {
        await addDoc(staffCollection, newStaffData);
    } catch (error) {
        console.error("Error adding staff member to Firestore: ", error);
    }
  }, []);

  const updateStaffMember = useCallback(async (staffId: string, updatedDetails: Partial<Staff>) => {
     try {
        const staffDoc = doc(db, 'staff', staffId);
        await updateDoc(staffDoc, updatedDetails);
    } catch (error) {
        console.error("Error updating staff member in Firestore: ", error);
    }
  }, []);

  return { staff, addStaffMember, updateStaffMember, isLoading };
}
