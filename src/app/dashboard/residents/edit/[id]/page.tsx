import { Suspense } from "react";
import EditResidentForm from "./edit-resident-form";

// ✅ Server Component - Compatible con Next.js 15
export default async function EditResidentPage({ 
    params 
}: { 
    params: Promise<{ id: string }> 
}) {
    const { id } = await params;
    
    return (
        <Suspense fallback={<div className="p-8">Cargando formulario...</div>}>
            <EditResidentForm residentId={id} />
        </Suspense>
    );
}