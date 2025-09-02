
"use client"

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc,
  Timestamp 
} from 'firebase/firestore';
import { Staff } from '@/types/user';

export function useStaff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const staffQuery = query(collection(db, "staff"));

    const unsubscribe = onSnapshot(
      staffQuery,
      (querySnapshot) => {
        const staffData: Staff[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            hireDate: data.hireDate?.toDate ? data.hireDate.toDate() : (data.hireDate ? new Date(data.hireDate) : undefined),
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined,
          } as Staff;
        });

        setStaff(staffData);
        setIsLoading(false);
        setError(null);
      },
      (error) => {
        console.error("Error fetching staff:", error);
        setError("Error al cargar el personal");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addStaffMember = useCallback(async (staffData: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>) : Promise<Staff> => {
    try {
      const docRef = await addDoc(collection(db, "staff"), {
        ...staffData,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      });
      return { id: docRef.id, ...staffData, createdAt: new Date(), updatedAt: new Date() };
    } catch (error) {
      console.error("Error adding staff:", error);
      throw error;
    }
  }, []);

  const updateStaffMember = useCallback(async (id: string, updates: Partial<Omit<Staff, 'id' | 'createdAt'>>) => {
    try {
      await updateDoc(doc(db, "staff", id), {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error("Error updating staff:", error);
      throw error;
    }
  }, []);

  return {
    staff,
    isLoading,
    error,
    addStaffMember,
    updateStaffMember,
  };
}

export type { Staff } from '@/types/user';
