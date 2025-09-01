
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
      
      // Buscar primero en la colección staff
      const staffQuery = query(collection(db, "staff"), where("email", "==", authUser.email));
      
      const unsubscribeStaff = onSnapshot(staffQuery, (querySnapshot) => {
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          const staff: Staff = {
            id: querySnapshot.docs[0].id,
            email: userData.email,
            name: userData.name,
            role: userData.role as UserRole,
            isActive: userData.isActive,
            createdAt: userData.createdAt?.toDate() || new Date(),
            updatedAt: userData.updatedAt?.toDate(),
            phone: userData.phone,
            position: userData.position,
            department: userData.department,
            hireDate: userData.hireDate ? new Date(userData.hireDate) : undefined,
            permissions: userData.permissions || [],
          };
          setAppUser(staff);
          setIsLoading(false);
          return;
        }
        
        // Si no está en staff, buscar en familiares
        const familyQuery = query(collection(db, "family_members"), where("email", "==", authUser.email));
        
        const unsubscribeFamily = onSnapshot(familyQuery, (familySnapshot) => {
          if (!familySnapshot.empty) {
            const userData = familySnapshot.docs[0].data();
            const familyMember: FamilyMember = {
              id: familySnapshot.docs[0].id,
              email: userData.email,
              name: userData.name,
              role: "Acceso Familiar",
              isActive: userData.isActive,
              createdAt: userData.createdAt?.toDate() || new Date(),
              updatedAt: userData.updatedAt?.toDate(),
              residentId: userData.residentId,
              relationship: userData.relationship,
              emergencyContact: userData.emergencyContact || false,
              visitingHours: userData.visitingHours,
            };
            setAppUser(familyMember);
          } else {
            setAppUser(null);
          }
          setIsLoading(false);
        }, (error) => {
          console.error("Error fetching family member data:", error);
          setAppUser(null);
          setIsLoading(false);
        });

        return unsubscribeFamily;
      }, (error) => {
        console.error("Error fetching staff data:", error);
        setAppUser(null);
        setIsLoading(false);
      });

      return () => unsubscribeStaff();
    } else {
      setAppUser(null);
      setIsLoading(false);
    }
  }, [authUser, authLoading]);

  // Computed properties
  const role = useMemo(() => appUser?.role || null, [appUser]);
  
  const permissions = useMemo(() => {
    if (!appUser || !role) return [];
    
    // Si es staff y tiene permisos personalizados, usar esos
    if (isStaff(appUser) && appUser.permissions?.length) {
      return appUser.permissions;
    }
    
    // Sino, usar permisos por rol - necesitamos verificar que role no sea null
    return [];
  }, [appUser, role]);

  // Utility functions
  const can = (permission: string): boolean => {
    if (!appUser || !role) return false;
    return hasPermission(role, permission);
  };

  const isAdmin = (): boolean => {
    return role === "Administrativo";
  };

  const isMedicalStaff = (): boolean => {
    return role === "Personal Asistencial";
  };

  const isFamily = (): boolean => {
    return role === "Acceso Familiar";
  };

  return { 
    user: appUser, 
    role, 
    permissions,
    isLoading,
    can,
    isAdmin,
    isMedicalStaff, 
    isFamily,
    isStaff: appUser ? isStaff(appUser) : false,
    isFamilyMember: appUser ? isFamilyMember(appUser) : false,
  };
}
