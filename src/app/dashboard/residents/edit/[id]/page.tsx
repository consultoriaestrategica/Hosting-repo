import { Suspense } from "react";
import ResidentForm from "@/components/resident-form";

// ✅ Server Component - Compatible con Next.js 15
export default async function EditResidentPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;

    return (
        <Suspense fallback={<div className="p-8">Cargando formulario...</div>}>
            <ResidentForm mode="edit" residentId={id} />
        </Suspense>
    );
}
