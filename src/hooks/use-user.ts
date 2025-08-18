
"use client"

import { useSearchParams } from "next/navigation"
import { useMemo } from "react"

// Mock user data. In a real app, this would come from an auth provider.
const MOCK_USERS = [
  { id: "user-1", name: "Admin", username: "admin", email: "admin@guardianangel.com", role: "Admin" },
  { id: "user-2", name: "Enfermera Ana", username: "anap", email: "ana.p@guardianangel.com", role: "Staff" },
  { id: "user-3", name: "Juan Rodriguez", username: "juanr", email: "juan.r@example.com", role: "Family" },
];

export function useUser() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role');

  const user = useMemo(() => {
    if (!role) return MOCK_USERS[0]; // Default to Admin

    switch (role.toLowerCase()) {
        case 'admin':
            return MOCK_USERS.find(u => u.role.toLowerCase() === 'admin');
        case 'staff':
            return MOCK_USERS.find(u => u.role.toLowerCase() === 'staff');
        case 'family':
            return MOCK_USERS.find(u => u.role.toLowerCase() === 'family');
        default:
            return MOCK_USERS[0];
    }
  }, [role]);

  return { user };
}
