import { Suspense } from "react";
import RouteGuard from "@/components/route-guard";
import StaffForm from "@/components/staff-form";

// ✅ Server Component - Compatible con Next.js 15
export default async function EditStaffPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;

    return (
        <RouteGuard permission="staff">
            <Suspense fallback={<div className="p-8">Cargando formulario...</div>}>
                <StaffForm mode="edit" staffId={id} />
            </Suspense>
        </RouteGuard>
    );
}
