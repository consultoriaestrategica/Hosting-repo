"use client"

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  Timestamp 
} from 'firebase/firestore';
import { Staff, UserRole } from '@/types/user';

export function useStaff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const staffQuery = query(
      collection(db, "staff"),
      where("isActive", "==", true)
    );

    const unsubscribe = onSnapshot(
      staffQuery,
      (querySnapshot) => {
        const staffData: Staff[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Staff[];

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

  // Función para agregar personal
  const addStaff = async (staffData: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, "staff"), {
        ...staffData,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding staff:", error);
      throw error;
    }
  };

  // Función para actualizar personal
  const updateStaff = async (id: string, updates: Partial<Omit<Staff, 'id' | 'createdAt'>>) => {
    try {
      await updateDoc(doc(db, "staff", id), {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error("Error updating staff:", error);
      throw error;
    }
  };

  // Función para eliminar personal (soft delete)
  const deleteStaff = async (id: string) => {
    try {
      await updateDoc(doc(db, "staff", id), {
        isActive: false,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error("Error deleting staff:", error);
      throw error;
    }
  };

  // Filtros útiles
  const getStaffByRole = (role: UserRole): Staff[] => {
    return staff.filter(member => member.role === role);
  };

  const getAdministrators = (): Staff[] => {
    return getStaffByRole("Administrativo");
  };

  const getMedicalStaff = (): Staff[] => {
    return getStaffByRole("Personal Asistencial");
  };

  return {
    staff,
    isLoading,
    error,
    addStaff,
    updateStaff,
    deleteStaff,
    getStaffByRole,
    getAdministrators,
    getMedicalStaff,
  };
}

// Re-export el tipo Staff para compatibilidad hacia atrás
export type { Staff } from '@/types/user';