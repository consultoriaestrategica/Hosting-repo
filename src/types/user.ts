export type UserRole = 
  | "Administrador" 
  | "Supervisor" 
  | "Personal de Cuidado" 
  | "Acceso Familiar";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Staff extends AppUser {
  phone: string;
  position?: string;
  department?: string;
  hireDate?: Date;
  permissions: string[];
}

// ✅ MODIFICADO: Agregadas propiedades residentName y phone
export interface FamilyMember extends AppUser {
  residentId: string;
  residentName: string;          // ← AGREGADO
  relationship: string;
  phone?: string;                // ← AGREGADO
  emergencyContact: boolean;
  visitingHours?: string;
}

export function isStaff(user: AppUser): user is Staff {
  return 'permissions' in user;
}

export function isFamilyMember(user: AppUser): user is FamilyMember {
  return 'residentId' in user;
}

export function hasPermission(role: UserRole, permission: string): boolean {
  if (role === "Administrador") return true;
  
  // Verificar permisos específicos para otros roles
  const rolePerms = ROLE_PERMISSIONS[role] || [];
  return rolePerms.includes(permission);
}

// ✅ Definición de permisos por rol
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  "Administrador": [
    "manage_residents",
    "manage_staff",
    "manage_family",
    "view_reports",
    "create_reports",
    "edit_reports",
    "delete_reports",
    "manage_settings",
    "view_agenda",
    "manage_agenda",
    "access_all_modules",
  ],
  "Supervisor": [
    "view_residents",
    "view_staff",
    "view_reports",
    "create_reports",
    "edit_reports",
    "view_agenda",
    "manage_agenda",
  ],
  "Personal de Cuidado": [
    "view_residents",
    "view_reports",
    "create_reports",
    "view_agenda",
  ],
  "Acceso Familiar": [
    "view_residents",
    "view_reports",
    "view_agenda",
  ],
};