import { Suspense } from "react";
import EditStaffForm from "./edit-staff-form";

// ✅ Server Component - Compatible con Next.js 15
export default async function EditStaffPage({ 
    params 
}: { 
    params: Promise<{ id: string }> 
}) {
    const { id } = await params;
    
    return (
        <Suspense fallback={<div className="p-8">Cargando formulario...</div>}>
            <EditStaffForm staffId={id} />
        </Suspense>
    );
}