// ⚠️ IMPORTANTE: Este archivo NO tiene "use client"
// Es lógica pura que será usada por el wrapper

import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import type { FamilyMember } from '@/types/user';
import type { MyRole } from './use-my-role';

/**
 * Función core para obtener datos del familiar autenticado
 * NO es un hook, es una función que retorna callbacks
 *
 * Resuelve primero user_roles/{uid} (el único documento que las
 * Firestore Rules garantizan que el usuario puede leer siempre) para
 * obtener el familyDocId, y recién ahí suscribe al documento real de
 * family_members — ya NO se puede hacer un query por email como antes
 * porque las rules exigen ya ser "family" para leer esa colección.
 */
export function createFamilyAuthListener(
  onFamilyMemberChange: (member: FamilyMember | null) => void,
  onLoadingChange: (loading: boolean) => void
): Unsubscribe {
  onLoadingChange(true);

  // Variable para guardar el unsubscribe de Firestore (family_members)
  let unsubscribeFamilyDoc: Unsubscribe | null = null;
  // Variable para guardar el unsubscribe de user_roles
  let unsubscribeRole: Unsubscribe | null = null;

  const clearNestedListeners = () => {
    if (unsubscribeFamilyDoc) {
      unsubscribeFamilyDoc();
      unsubscribeFamilyDoc = null;
    }
    if (unsubscribeRole) {
      unsubscribeRole();
      unsubscribeRole = null;
    }
  };

  // Listener de Firebase Auth
  const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
    clearNestedListeners();

    if (!authUser) {
      onFamilyMemberChange(null);
      onLoadingChange(false);
      return;
    }

    // Listener de user_roles/{uid}
    unsubscribeRole = onSnapshot(
      doc(db, "user_roles", authUser.uid),
      (roleSnap) => {
        if (unsubscribeFamilyDoc) {
          unsubscribeFamilyDoc();
          unsubscribeFamilyDoc = null;
        }

        if (!roleSnap.exists() || (roleSnap.data() as MyRole).kind !== "family") {
          onFamilyMemberChange(null);
          onLoadingChange(false);
          return;
        }

        const role = roleSnap.data() as Extract<MyRole, { kind: "family" }>;

        // Listener del documento real de family_members
        unsubscribeFamilyDoc = onSnapshot(
          doc(db, "family_members", role.familyDocId),
          (docSnap) => {
            if (!docSnap.exists()) {
              onFamilyMemberChange(null);
              onLoadingChange(false);
              return;
            }

            const data = docSnap.data();
            const member: FamilyMember = {
              id: docSnap.id,
              email: data.email,
              name: data.name,
              role: "Acceso Familiar",
              residentId: data.residentId,
              residentName: data.residentName,
              relationship: data.relationship,
              phone: data.phone,
              isActive: data.isActive ?? true,
              createdAt: data.createdAt?.toDate?.() || new Date(),
              updatedAt: data.updatedAt?.toDate?.(),
              emergencyContact: data.emergencyContact ?? false,
              visitingHours: data.visitingHours,
            };

            onFamilyMemberChange(member);
            onLoadingChange(false);
          },
          (error) => {
            console.error("❌ familyAuthCore: Error leyendo family_members:", error);
            onFamilyMemberChange(null);
            onLoadingChange(false);
          }
        );
      },
      (error) => {
        console.error("❌ familyAuthCore: Error leyendo user_roles:", error);
        onFamilyMemberChange(null);
        onLoadingChange(false);
      }
    );
  });

  // Retornar función de cleanup que limpia TODOS los listeners
  return () => {
    clearNestedListeners();
    unsubscribeAuth();
  };
}
