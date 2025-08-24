
"use client"

import { useSearchParams } from "next/navigation"
import { useMemo } from "react"
import { useStaff } from "./use-staff";

export function useUser() {
  const searchParams = useSearchParams();
  const { staff } = useStaff(); // Use the real staff data
  const role = searchParams.get('role');

  const user = useMemo(() => {
    // In a real app, you'd likely have a separate 'users' collection and proper auth.
    // For this app's structure, we map roles to the 'staff' collection.
    // We create a default admin user if no staff members exist yet.
    const defaultAdmin = { id: "user-1", name: "Admin", username: "admin", email: "admin@guardianangel.com", role: "Admin" };

    if (staff.length === 0) {
        return defaultAdmin;
    }

    if (!role) return staff.find(u => u.role === 'Administrativo') || defaultAdmin;

    switch (role.toLowerCase()) {
        case 'admin':
            return staff.find(u => u.role === 'Administrativo') || defaultAdmin;
        case 'staff':
            // Find a non-admin staff member, or fall back to any staff, then default admin
            return staff.find(u => u.role !== 'Administrativo') || staff[0] || defaultAdmin;
        case 'family':
            // Family role is not in the staff list, so we create a mock for it.
            return { id: "user-3", name: "Juan Rodriguez", username: "juanr", email: "juan.r@example.com", role: "Family" };
        default:
            return staff.find(u => u.role === 'Administrativo') || defaultAdmin;
    }
  }, [role, staff]);

  return { user };
}
