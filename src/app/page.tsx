// src/app/page.tsx
import { redirect } from "next/navigation";

export default function RootPage() {
  // Siempre que alguien entre a la raíz "/", lo mandamos al login oficial
  redirect("/login");
}
