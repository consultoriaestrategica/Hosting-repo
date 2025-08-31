
"use client"
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { Staff } from './use-staff';

type AppUser = Staff & { role: string };

export function useUser() {
  const { user: authUser } = useAuth();
  const [appUser, setAppUser] = useState<AppUser | null>(null);

  useEffect(() => {
    if (authUser?.email) {
      const staffQuery = query(collection(db, "staff"), where("email", "==", authUser.email));
      
      const unsubscribe = onSnapshot(staffQuery, (querySnapshot) => {
        if (!querySnapshot.empty) {
          const staffData = querySnapshot.docs[0].data() as Staff;
          // Directly use the role from DB. 'Admin' for admins, other roles are 'staff'.
          const userRole = staffData.role === 'Admin' ? 'Admin' : 'staff';
          setAppUser({
              id: querySnapshot.docs[0].id,
              ...staffData,
              role: userRole
          });
        } else {
            // Handle case where user is authenticated but not in staff collection
            setAppUser(null);
        }
      });

      return () => unsubscribe();
    } else {
      setAppUser(null);
    }
  }, [authUser]);

  const role = useMemo(() => {
      if (!appUser) return null; // Return null if no user
      // This logic ensures that only users with the specific 'Admin' role get admin privileges.
      // All other roles are treated as 'staff'.
      return appUser.role === 'Admin' ? 'Admin' : 'staff';
  }, [appUser]);


  return { user: appUser, role };
}
