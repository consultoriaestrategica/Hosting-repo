
"use client"
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { Staff } from './use-staff';

// We can simplify the AppUser type for this context
type AppUser = Staff;

export function useUser() {
  const { user: authUser } = useAuth();
  const [appUser, setAppUser] = useState<AppUser | null>(null);

  useEffect(() => {
    if (authUser?.email) {
      const staffQuery = query(collection(db, "staff"), where("email", "==", authUser.email));
      
      const unsubscribe = onSnapshot(staffQuery, (querySnapshot) => {
        if (!querySnapshot.empty) {
          const staffData = querySnapshot.docs[0].data() as Omit<Staff, 'id'>;
          setAppUser({
              id: querySnapshot.docs[0].id,
              ...staffData,
          });
        } else {
            setAppUser(null);
        }
      }, (error) => {
          console.error("Error fetching user data:", error);
          setAppUser(null);
      });

      return () => unsubscribe();
    } else {
      setAppUser(null);
    }
  }, [authUser]);

  const role = useMemo(() => {
      if (!appUser) return null;
      // If the user's role stored in the database is 'Admin', their role is 'Admin'.
      // Otherwise, no matter what their specific job title is (Enfermera, etc.),
      // their role for permissions purposes is 'staff'.
      return appUser.role === 'Admin' ? 'Admin' : 'staff';
  }, [appUser]);


  return { user: appUser, role };
}
