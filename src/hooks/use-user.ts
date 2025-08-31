
"use client"
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { Staff } from './use-staff';

// We can simplify the AppUser type for this context
type AppUser = Staff;

export function useUser() {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      // If auth state is still loading, our state is also loading.
      setIsLoading(true);
      return;
    }
    
    if (authUser?.email) {
      setIsLoading(true);
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
        setIsLoading(false);
      }, (error) => {
          console.error("Error fetching user data:", error);
          setAppUser(null);
          setIsLoading(false);
      });

      return () => unsubscribe();
    } else {
      // No authenticated user, so not loading and no app user.
      setAppUser(null);
      setIsLoading(false);
    }
  }, [authUser, authLoading]);

  // The role is now the specific role from the database, or null if not found.
  const role = useMemo(() => {
      return appUser?.role || null;
  }, [appUser]);

  return { user: appUser, role, isLoading: isLoading };
}
