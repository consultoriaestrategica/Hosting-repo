"use client"

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { AppUser, Staff, FamilyMember, UserRole, isStaff, isFamilyMember, hasPermission } from '@/types/user';

export function useUser() {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }
    
    if (authUser?.email) {
      setIsLoading(true);
      
      const collectionsToSearch = ["staff", "users", "family_members"];
      let unsubscribes: (() => void)[] = [];
      let foundUser = false;

      const createSubscriber = (collectionName: string) => {
        const q = query(collection(db, collectionName), where("email", "==", authUser.email));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          if (foundUser || snapshot.empty) {
            // If we already found the user in a higher priority collection, or this one is empty, do nothing
            return;
          }

          foundUser = true; // Mark as found to stop other subscribers from overwriting
          
          const doc = snapshot.docs[0];
          const data = doc.data();

          let user: AppUser | null = null;
          
          if (collectionName === "staff" || collectionName === "users") {
            user = {
              id: doc.id,
              email: data.email,
              name: data.name || data.Name,
              role: data.role as UserRole,
              isActive: data.isActive,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined,
              phone: data.phone || "",
              position: data.position,
              department: data.department,
              hireDate: data.hireDate?.toDate ? data.hireDate.toDate() : (data.hireDate ? new Date(data.hireDate) : undefined),
              permissions: data.permissions || [],
            } as Staff;
          } else if (collectionName === "family_members") {
             user = {
                id: doc.id,
                email: data.email,
                name: data.name,
                role: "Acceso Familiar",
                isActive: data.isActive,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined,
                residentId: data.residentId,
                relationship: data.relationship,
                emergencyContact: data.emergencyContact || false,
                visitingHours: data.visitingHours,
              } as FamilyMember
          }
          
          setAppUser(user);
          setIsLoading(false);
          
          // Unsubscribe from all listeners once we've found our user
          unsubscribes.forEach(unsub => unsub());

        }, (error) => {
          console.error(`Error fetching from ${collectionName}:`, error);
          // Don't stop loading on error, let other queries try
        });

        unsubscribes.push(unsubscribe);
      };
      
      collectionsToSearch.forEach(createSubscriber);
      
      // If no user is found after a short period, stop loading
      const timeoutId = setTimeout(() => {
        if (!foundUser) {
          setIsLoading(false);
          setAppUser(null);
        }
      }, 3000); // 3-second timeout

      return () => {
        clearTimeout(timeoutId);
        unsubscribes.forEach(unsub => unsub());
      };

    } else {
      setAppUser(null);
      setIsLoading(false);
    }
  }, [authUser, authLoading]);

  const role = useMemo(() => appUser?.role || null, [appUser]);

  return { 
    user: appUser, 
    role, 
    isLoading,
    hasPermission: (permission: string) => {
      if (!role) return false;
      return hasPermission(role, permission);
    }
  };
}
