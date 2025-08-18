
"use client"

import { useMemo } from 'react';
import Link from 'next/link';
import { useLogs } from '@/hooks/use-logs';
import { useContracts as useResidentContracts } from '@/hooks/use-contracts';
import { useStaffContracts } from '@/hooks/use-staff-contracts';
import { useResidents } from '@/hooks/use-residents';
import { useStaff } from '@/hooks/use-staff';
import { Stethoscope, FileText, User, Car, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

type ActivityItem = {
    id: string;
    type: 'log' | 'resident-contract' | 'staff-contract' | 'visit';
    date: string; // ISO string
    icon: React.ReactNode;
    description: React.ReactNode;
};

const ITEMS_TO_SHOW = 15;

export default function ActivityFeed() {
    const { logs, isLoading: logsLoading } = useLogs();
    const { contracts: residentContracts, isLoading: resContractsLoading } = useResidentContracts();
    const { contracts: staffContracts, isLoading: staffContractsLoading } = useStaffContracts();
    const { residents, isLoading: residentsLoading } = useResidents();
    const { staff, isLoading: staffLoading } = useStaff();

    const allActivities = useMemo(() => {
        const logActivities: ActivityItem[] = logs.map(log => {
            const residentName = residents.find(r => r.id === log.residentId)?.name || 'Residente desconocido';
            return {
                id: log.id,
                type: 'log',
                date: log.endDate,
                icon: <Stethoscope className="h-4 w-4" />,
                description: (
                    <p>
                        Nuevo{' '}
                        <Badge variant="outline">{log.reportType === 'medico' ? 'Reporte Médico' : 'Reporte de Suministro'}</Badge> para{' '}
                        <Link href={`/dashboard/residents/${log.residentId}?role=admin`} className="font-semibold hover:underline">{residentName}</Link>.
                    </p>
                )
            };
        });

        const residentContractActivities: ActivityItem[] = residentContracts.map(contract => {
            const residentName = residents.find(r => r.id === contract.residentId)?.name || 'Residente desconocido';
            return {
                id: contract.id,
                type: 'resident-contract',
                date: contract.createdAt,
                icon: <FileText className="h-4 w-4" />,
                description: (
                    <p>
                        Nuevo <Badge variant="outline">Contrato de Residente</Badge> generado para{' '}
                        <Link href={`/dashboard/residents/${contract.residentId}?role=admin`} className="font-semibold hover:underline">{residentName}</Link>.
                    </p>
                )
            };
        });
        
        const staffContractActivities: ActivityItem[] = staffContracts.map(contract => {
            const staffName = staff.find(s => s.id === contract.staffId)?.name || 'Personal desconocido';
            return {
                id: contract.id,
                type: 'staff-contract',
                date: contract.createdAt,
                icon: <Briefcase className="h-4 w-4" />,
                description: (
                    <p>
                        Nuevo <Badge variant="outline">Contrato Laboral</Badge> generado para{' '}
                        <Link href={`/dashboard/staff/${contract.staffId}?role=admin`} className="font-semibold hover:underline">{staffName}</Link>.
                    </p>
                )
            };
        });

        const visitActivities: ActivityItem[] = residents.flatMap(resident =>
            (resident.visits || []).map(visit => ({
                id: visit.id,
                type: 'visit' as const,
                date: visit.visitDate,
                icon: <Car className="h-4 w-4" />,
                description: (
                     <p>
                        <Badge variant="secondary">Visita</Badge> de <strong>{visit.visitorName}</strong> a{' '}
                        <Link href={`/dashboard/residents/${resident.id}?role=admin`} className="font-semibold hover:underline">{resident.name}</Link>.
                    </p>
                )
            }))
        );

        return [...logActivities, ...residentContractActivities, ...staffContractActivities, ...visitActivities]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, ITEMS_TO_SHOW);

    }, [logs, residentContracts, staffContracts, residents, staff]);

    const isLoading = logsLoading || resContractsLoading || staffContractsLoading || residentsLoading || staffLoading;

    if (isLoading) {
        return <p>Cargando actividad...</p>;
    }
    
    if (allActivities.length === 0) {
        return <p className="text-muted-foreground text-center">No hay actividad reciente para mostrar.</p>
    }

    return (
        <ScrollArea className="h-72">
            <div className="space-y-4">
                {allActivities.map((activity, index) => (
                    <div key={activity.id} className="grid grid-cols-[auto,1fr,auto] items-start gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                            {activity.icon}
                        </div>
                        <div className="text-sm">
                            {activity.description}
                        </div>
                        <time className="text-sm text-muted-foreground">
                            {new Date(activity.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </time>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}
