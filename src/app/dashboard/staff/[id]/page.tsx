import { Suspense } from "react";
import StaffProfilePageContent from "./staff-profile-content";

// ✅ Server Component - Compatible con Next.js 15
export default async function StaffProfilePage({ 
    params 
}: { 
    params: Promise<{ id: string }> 
}) {
    const { id } = await params;
    
    return (
        <Suspense fallback={<div className="p-8">Cargando perfil del personal...</div>}>
            <StaffProfilePageContent staffId={id} />
        </Suspense>
    );
}