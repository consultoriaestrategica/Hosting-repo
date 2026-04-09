"use client"

import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '@/lib/firebase';
import { authSecondary } from '@/lib/firebase-secondary';
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
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';

export type FamilyMember = {
  id: string;
  email: string;
  name: string;
  residentId: string;
  residentName: string;
  relationship: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
};

const familyMembersCollection = collection(db, 'family_members');

export function useFamilyMembers() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ========================================================
    // FIX: Esperar a que el usuario esté autenticado antes de
    // suscribirse a family_members. Las Firestore rules
    // requieren isAdmin() || isStaffByEmail() para leer esta
    // colección, así que sin auth el listener siempre falla.
    // ========================================================
    let unsubSnapshot: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // Si no hay usuario autenticado, limpiar y no suscribirse
      if (!user) {
        setFamilyMembers([]);
        setIsLoading(false);
        setError(null);
        // Limpiar suscripción anterior si existía
        if (unsubSnapshot) {
          unsubSnapshot();
          unsubSnapshot = null;
        }
        return;
      }

      // Usuario autenticado → suscribirse a family_members
      const familyQuery = query(familyMembersCollection);

      unsubSnapshot = onSnapshot(
        familyQuery,
        (querySnapshot) => {
          const familyData: FamilyMember[] = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined,
            } as FamilyMember;
          });
          setFamilyMembers(familyData);
          setIsLoading(false);
          setError(null);
        },
        (err) => {
          console.error("Error fetching family members:", err);
          setError("Error al cargar los familiares");
          setIsLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  // ========================================================
  // FIX: Usar authSecondary para crear usuarios, evitando
  // que se cierre la sesión del administrador actual.
  // ========================================================
  const addFamilyMember = useCallback(
    async (
      familyData: Omit<FamilyMember, "id" | "createdAt" | "updatedAt">,
      password: string
    ): Promise<FamilyMember> => {
      try {
        // 1. Crear usuario en Firebase Auth usando la instancia SECUNDARIA
        //    Esto NO afecta la sesión del admin logueado en la app principal
        await createUserWithEmailAndPassword(
          authSecondary,
          familyData.email,
          password
        );

        // 2. Guardar en Firestore
        const docRef = await addDoc(familyMembersCollection, {
          ...familyData,
          isActive: familyData.isActive ?? true,
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
        });

        // 3. Cerrar sesión SOLO en la instancia secundaria (no afecta al admin)
        await firebaseSignOut(authSecondary);

        return {
          id: docRef.id,
          ...familyData,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } catch (error: any) {
        console.error("Error adding family member:", error);

        if (error.code === 'auth/email-already-in-use') {
          throw new Error('Este correo electrónico ya está registrado');
        } else if (error.code === 'auth/weak-password') {
          throw new Error('La contraseña debe tener al menos 6 caracteres');
        } else if (error.code === 'auth/invalid-email') {
          throw new Error('El correo electrónico no es válido');
        }
        throw error;
      }
    },
    []
  );

  const updateFamilyMember = useCallback(
    async (id: string, updates: Partial<Omit<FamilyMember, "id" | "createdAt">>) => {
      try {
        const updateData: any = {
          ...updates,
          updatedAt: Timestamp.fromDate(new Date()),
        };
        await updateDoc(doc(db, "family_members", id), updateData);
      } catch (error) {
        console.error("Error updating family member:", error);
        throw error;
      }
    },
    []
  );

  const deleteFamilyMember = useCallback(
    async (familyMemberId: string) => {
      const familyDoc = doc(db, "family_members", familyMemberId)
      await deleteDoc(familyDoc)
    },
    []
  );

  // Login de familiar (usa auth principal, que es correcto aquí)
  const signInFamilyMember = useCallback(
    async (email: string, password: string): Promise<FamilyMember | null> => {
      try {
        // 1. Autenticar con Firebase Auth
        await signInWithEmailAndPassword(auth, email, password);

        // 2. Buscar en la colección family_members
        const q = query(familyMembersCollection, where("email", "==", email));

        return new Promise((resolve, reject) => {
          const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
              unsubscribe();
              if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                const data = doc.data();
                const familyMember: FamilyMember = {
                  id: doc.id,
                  email: data.email,
                  name: data.name,
                  residentId: data.residentId,
                  residentName: data.residentName,
                  relationship: data.relationship,
                  phone: data.phone,
                  isActive: data.isActive ?? true,
                  createdAt: data.createdAt?.toDate?.() || new Date(),
                  updatedAt: data.updatedAt?.toDate?.(),
                };

                if (!familyMember.isActive) {
                  firebaseSignOut(auth);
                  reject(new Error('Esta cuenta está desactivada'));
                  return;
                }

                resolve(familyMember);
              } else {
                firebaseSignOut(auth);
                reject(new Error('Usuario no encontrado como familiar'));
              }
            },
            (error) => {
              unsubscribe();
              reject(error);
            }
          );
        });
      } catch (error: any) {
        console.error("Error signing in family member:", error);

        if (error.code === 'auth/invalid-credential') {
          throw new Error('Correo o contraseña incorrectos');
        } else if (error.code === 'auth/user-not-found') {
          throw new Error('Usuario no encontrado');
        } else if (error.code === 'auth/wrong-password') {
          throw new Error('Contraseña incorrecta');
        }
        throw error;
      }
    },
    []
  );

  return {
    familyMembers,
    isLoading,
    error,
    addFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
    signInFamilyMember,
  };
}