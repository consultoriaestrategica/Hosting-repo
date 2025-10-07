// Tipos de roles del sistema
export type UserRole = "Administrativo" | "Personal Asistencial" | "Acceso Familiar";

// Tipos de estado para usuarios
export type UserStatus = 'Activo' | 'Inactivo';

// Interface base para usuarios
export interface BaseUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  status: UserStatus; // Agregado para compatibilidad con contratos
  createdAt: Date;
  updatedAt?: Date;
}

// Interface para Staff (hereda de BaseUser)
export interface Staff extends BaseUser {
  // Campos específicos del staff
  phone?: string;
  position?: string;
  department?: string;
  hireDate?: Date;
  permissions?: string[];
  idNumber?: string; // Agregado para contratos
}

// Interface para Familiares (hereda de BaseUser)
export interface FamilyMember extends BaseUser {
  // Campos específicos de familiares
  residentId: string; // ID del residente relacionado
  relationship: string; // "Hijo", "Esposa", "Hermano", etc.
  emergencyContact: boolean;
  visitingHours?: {
    start: string;
    end: string;
    days: string[];
  };
}

// Tipos específicos para residentes (para compatibilidad con contratos)
export type RoomType = "Habitación compartida" | "Habitación individual";

export interface Resident {
  id: string;
  name: string;
  status: UserStatus;
  roomType: RoomType;
  roomNumber: string;
  age: number;
  idNumber: string;
  // ... otras propiedades de residentes
}

// Union type para cualquier tipo de usuario
export type AppUser = Staff | FamilyMember;

// Type guards para verificar el tipo de usuario
export function isStaff(user: AppUser): user is Staff {
  return user.role === "Administrativo" || user.role === "Personal Asistencial";
}

export function isFamilyMember(user: AppUser): user is FamilyMember {
  return user.role === "Acceso Familiar";
}

// Permisos por rol - Actualizado con todos los módulos
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  "Administrativo": [
    "dashboard",
    "residents",
    "staff", 
    "contracts",
    "visitors",
    "logs",
    "reports",
    "settings",
    "users",
    "daily_records", // Agregado para registro diario
    "admin_panel"
  ],
  "Personal Asistencial": [
    "dashboard",
    "residents",
    "visitors", 
    "logs",
    "daily_records", // Agregado para registro diario
    "reports"
  ],
  "Acceso Familiar": [
    "dashboard",
    "my-resident", // Vista limitada del residente relacionado
    "visitors" // Vista limitada de visitantes
  ]
};

// Función para verificar permisos
export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}