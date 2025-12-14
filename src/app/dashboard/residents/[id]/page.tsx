import { Suspense } from "react";
import ResidentProfilePageContent from "./resident-profile-content";

export default async function ResidentProfilePage({ 
    params 
}: { 
    params: Promise<{ id: string }> 
}) {
    const { id } = await params;
    
    return (
        <Suspense fallback={
            <div className="p-4 md:p-8">
                <h1 className="text-3xl font-bold font-headline">Cargando perfil...</h1>
            </div>
        }>
            <ResidentProfilePageContent id={id} />
        </Suspense>
    );
}