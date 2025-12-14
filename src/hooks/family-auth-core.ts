// ⚠️ IMPORTANTE: Este archivo NO tiene "use client"
// Es lógica pura que será usada por el wrapper

import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, Unsubscribe } from 'firebase/firestore';
import type { FamilyMember } from '@/types/user';

/**
 * Función core para obtener datos del familiar autenticado
 * NO es un hook, es una función que retorna callbacks
 */
export function createFamilyAuthListener(
  onFamilyMemberChange: (member: FamilyMember | null) => void,
  onLoadingChange: (loading: boolean) => void
): Unsubscribe {
  console.log("👨‍👩‍👧 familyAuthCore: Creando listener");
  
  onLoadingChange(true);

  // Variable para guardar el unsubscribe de Firestore
  let unsubscribeFirestore: Unsubscribe | null = null;

  // Listener de Firebase Auth
  const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
    console.log("🔐 familyAuthCore: Auth cambió", { email: authUser?.email });

    // Limpiar listener anterior de Firestore si existe
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
      unsubscribeFirestore = null;
    }

    if (!authUser?.email) {
      console.log("⚠️ familyAuthCore: No hay usuario");
      onFamilyMemberChange(null);
      onLoadingChange(false);
      return;
    }

    console.log("🔍 familyAuthCore: Buscando familiar:", authUser.email);

    // Query a Firestore
    const q = query(
      collection(db, "family_members"),
      where("email", "==", authUser.email)
    );

    // Listener de Firestore
    unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        console.log("📡 familyAuthCore: Snapshot recibido, docs:", snapshot.size);

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = doc.data();

          console.log("✅ familyAuthCore: Familiar encontrado:", {
            id: doc.id,
            name: data.name,
            residentId: data.residentId
          });

          const member: FamilyMember = {
            id: doc.id,
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
        } else {
          console.log("⚠️ familyAuthCore: No se encontró familiar");
          onFamilyMemberChange(null);
          onLoadingChange(false);
        }
      },
      (error) => {
        console.error("❌ familyAuthCore: Error en Firestore:", error);
        onFamilyMemberChange(null);
        onLoadingChange(false);
      }
    );
  });

  // Retornar función de cleanup que limpia AMBOS listeners
  return () => {
    console.log("🧹 familyAuthCore: Ejecutando cleanup");
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
    unsubscribeAuth();
  };
}