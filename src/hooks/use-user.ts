"use client"

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { AppUser, Staff, FamilyMember, UserRole, isStaff, isFamilyMember, hasPermission, ROLE_PERMISSIONS } from '@/types/user';

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
            createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date(),
            updatedAt: userData.updatedAt?.toDate ? userData.updatedAt.toDate() : undefined,
            phone: userData.phone,
            position: userData.position,
            department: userData.department,
            hireDate: userData.hireDate?.toDate ? userData.hireDate.toDate() : (userData.hireDate ? new Date(userData.hireDate) : undefined),
            permissions: userData.permissions || [],
          };
          setAppUser(staff);
          setIsLoading(false);
          return;
        }
        
        // Si no está en staff, buscar en la colección users
        const usersQuery = query(collection(db, "users"), where("email", "==", authUser.email));
        
        const unsubscribeUsers = onSnapshot(usersQuery, (usersSnapshot) => {
          if (!usersSnapshot.empty) {
            const userData = usersSnapshot.docs[0].data();
            const user: Staff = {
              id: usersSnapshot.docs[0].id,
              email: userData.email,
              name: userData.Name || userData.name,
              role: userData.role as UserRole,
              isActive: userData.isActive,
              createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date(),
              updatedAt: userData.updatedAt?.toDate ? userData.updatedAt.toDate() : undefined,
              phone: userData.phone || "",
              position: userData.position || "Administrador",
              department: userData.department || "Administración",
              hireDate: userData.hireDate?.toDate ? userData.hireDate.toDate() : undefined,
              permissions: userData.permissions || [],
            };
            setAppUser(user);
            setIsLoading(false);
            return;
          }
          
          // Si no está en users, buscar en familiares
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
                createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date(),
                updatedAt: userData.updatedAt?.toDate ? userData.updatedAt.toDate() : undefined,
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
          console.error("Error fetching users data:", error);
          setAppUser(null);
          setIsLoading(false);
        });

        return unsubscribeUsers;
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
    if (isStaff(appUser) && appUser.permissions) {
      const userPermissions = appUser.permissions;
      
      // Si permissions es un array, usarlo directamente
      if (Array.isArray(userPermissions) && userPermissions.length > 0) {
        return userPermissions;
      }
    }
    
    // Usar permisos por defecto del rol desde ROLE_PERMISSIONS
    return ROLE_PERMISSIONS[role] || [];
  }, [appUser, role]);

  // Utility functions
  const can = (permission: string): boolean => {
    if (!appUser || !role) return false;
    
    // Usar la función hasPermission del archivo de tipos
    if (hasPermission(role, permission)) {
      return true;
    }
    
    // También verificar en permisos personalizados si es staff
    if (isStaff(appUser) && appUser.permissions) {
      return appUser.permissions.includes(permission);
    }
    
    return false;
  };

  const canViewModule = (module: string): boolean => {
    if (!role) return false;
    
    // Si es administrador, tiene acceso a todo
    if (role === "Administrativo") {
      return true;
    }
    
    // Usar la función hasPermission para verificar acceso a módulos
    return hasPermission(role, module);
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
    canViewModule,
    isAdmin,
    isMedicalStaff, 
    isFamily,
    isStaff: appUser ? isStaff(appUser) : false,
    isFamilyMember: appUser ? isFamilyMember(appUser) : false,
  };
}