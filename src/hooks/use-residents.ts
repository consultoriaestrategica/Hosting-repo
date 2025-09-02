"use client"

import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, DocumentData } from 'firebase/firestore';

type PhoneContact = {
    number: string;
};

type FamilyContact = {
  name: string;
  kinship: string;
  address: string;
  phones: PhoneContact[];
  email: string;
};

type Medication = {
  name: string;
  dose: string;
  frequency: string;
};

type ResidentDocument = {
  type: string; // e.g., "Contrato", "Cédula de Paciente"
  name: string;
  size: number;
};

export type DischargeDetails = {
    dischargeDate: string; // YYYY-MM-DD
    reason: 'Traslado' | 'Regreso a casa' | 'Fallecimiento';
    observations?: string;
};

export type AgendaEvent = {
  id: string;
  date: string; // ISO String for date and time
  type: 'Cita Médica' | 'Gestión Personal' | 'Otro';
  title: string;
  description?: string;
  status: 'Pendiente' | 'Completado' | 'Cancelado';
};

export type Visit = {
    id: string;
    visitorName: string;
    visitorIdNumber: string;
    kinship: string;
    visitDate: string; // ISO string
    notes?: string;
};

// Shared properties
type BaseLog = {
  id: string;
  residentId: string;
  startDate: string; // ISO string for when the report was started
  endDate: string; // ISO string for when the report was submitted
};

// Medical Report
type MedicalLog = BaseLog & {
  reportType: 'medico';
  heartRate?: number;
  respiratoryRate?: number;
  spo2?: number;
  feedingType?: string;
  evolutionNotes?: string[];
  photoEvidenceUrl?: string[];
  visitType?: string;
  professionalName?: string;
  entryTime?: string;
  exitTime?: string;
};

// Supply Report
type SupplyLog = BaseLog & {
  reportType: 'suministro';
  supplierName?: string;
  supplyDate?: string; // YYYY-MM-DD
  supplyDescription?: string;
  supplyNotes?: string;
  supplyPhotoEvidenceUrl?: string[];
};

export type Log = MedicalLog | SupplyLog;

export type Resident = {
  id: string;
  name: string;
  age: number;
  dob: string;
  idNumber: string;
  gender?: "Femenino" | "Masculino" | "Otro";
  medicalHistory?: string[];
  surgicalHistory?: string[];
  allergies?: string[];
  dependency: "Dependiente" | "Independiente";
  status: "Activo" | "Inactivo";
  admissionDate: string;
  roomType: "Habitación compartida" | "Habitación individual";
  roomNumber?: string;
  bloodType?: string;
  fallRisk?: "Bajo" | "Medio" | "Alto";
  familyContacts?: FamilyContact[];
  medications?: Medication[];
  diet?: string;
  documents?: ResidentDocument[];
  dischargeDetails?: DischargeDetails;
  agendaEvents?: AgendaEvent[];
  visits?: Visit[];
};

const residentsCollection = collection(db, 'residents');

function useResidents() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;
    let mounted = true;
    
    console.log('🚀 Inicializando useResidents...');
    
    // Esperar a que Firebase Auth se inicialice completamente
    const initializeWithAuth = () => {
      console.log('🔍 Verificando estado de autenticación...');
      
      const unsubscribeAuth = auth.onAuthStateChanged((user) => {
        console.log('=== AUTH STATE CHANGED ===');
        console.log('Auth user:', user?.email || 'null');
        console.log('User authenticated:', !!user);
        console.log('Component mounted:', mounted);
        console.log('=========================');
        
        // Solo proceder si el componente sigue montado
        if (!mounted) {
          console.log('🚫 Componente desmontado, cancelando operación');
          return;
        }
        
        // Limpiar suscripción anterior si existe
        if (unsubscribeFirestore) {
          console.log('🧹 Limpiando suscripción anterior de Firestore');
          unsubscribeFirestore();
          unsubscribeFirestore = null;
        }
        
        if (user) {
          console.log('✅ Usuario autenticado confirmado, iniciando consulta de residentes...');
          setIsLoading(true);
          
          unsubscribeFirestore = onSnapshot(residentsCollection, (snapshot) => {
              if (!mounted) return;
              
              console.log('📊 Successfully fetched residents:', snapshot.docs.length);
              const residentsData = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
              } as Resident));
              setResidents(residentsData);
              setIsLoading(false);
          }, (error) => {
              if (!mounted) return;
              
              console.error("❌ Error fetching residents:", error.code, error.message);
              
              // Solo mostrar el error si realmente hay un problema persistente
              if (auth.currentUser) {
                console.error("🔴 Error persistente con usuario autenticado:", auth.currentUser.email);
              }
              
              setResidents([]);
              setIsLoading(false);
          });
        } else {
          console.log('🚫 No hay usuario autenticado');
          setResidents([]);
          setIsLoading(false);
        }
      });
      
      return unsubscribeAuth;
    };
    
    // Inicializar con un pequeño delay para asegurar que Auth esté listo
    const initTimer = setTimeout(() => {
      if (mounted) {
        const unsubscribeAuth = initializeWithAuth();
        
        // Guardar la función de cleanup
        if (mounted) {
          return () => {
            console.log('🧹 Limpiando suscripción de Auth');
            unsubscribeAuth();
          };
        }
      }
    }, 50); // Delay mínimo para que Auth se inicialice
    
    // Cleanup function
    return () => {
      console.log('🛑 Desmontando useResidents...');
      mounted = false;
      clearTimeout(initTimer);
      
      if (unsubscribeFirestore) {
        console.log('🧹 Limpiando suscripción de Firestore en cleanup');
        unsubscribeFirestore();
      }
    };
  }, []);

  const addResident = useCallback(async (newResident: Omit<Resident, 'id'>) => {
    try {
        console.log('Adding resident. Auth user:', auth.currentUser?.email);
        await addDoc(residentsCollection, newResident);
    } catch (error) {
        console.error("Error adding resident to Firestore: ", error);
    }
  }, []);

  const updateResident = useCallback(async (residentId: string, updatedDetails: Partial<Omit<Resident, 'id'>>) => {
    try {
        console.log('Updating resident. Auth user:', auth.currentUser?.email);
        const residentDoc = doc(db, 'residents', residentId);
        await updateDoc(residentDoc, updatedDetails);
    } catch (error) {
        console.error("Error updating resident in Firestore: ", error);
    }
  }, []);

  const dischargeResident = useCallback((residentId: string, dischargeDetails: DischargeDetails) => {
      updateResident(residentId, {
        status: 'Inactivo',
        dischargeDetails: dischargeDetails,
      });
  }, [updateResident]);

  const addAgendaEvent = useCallback(async (residentId: string, eventData: Omit<AgendaEvent, 'id'>) => {
    const resident = residents.find(r => r.id === residentId);
    if (!resident) return;

    await updateResident(residentId, {
      agendaEvents: [
        ...(resident.agendaEvents || []),
        { ...eventData, id: `evt-${Date.now()}` }
      ]
    });
  }, [residents, updateResident]);

  const updateAgendaEvent = useCallback(async (residentId: string, eventId: string, eventData: Partial<AgendaEvent>) => {
    const resident = residents.find(r => r.id === residentId);
    if (!resident) return;

    const updatedEvents = (resident.agendaEvents || []).map(event => 
      event.id === eventId ? { ...event, ...eventData } : event
    );
    
    await updateResident(residentId, { agendaEvents: updatedEvents });
  }, [residents, updateResident]);

  const deleteAgendaEvent = useCallback(async (residentId: string, eventId: string) => {
    const resident = residents.find(r => r.id === residentId);
    if (!resident) return;

    const updatedEvents = (resident.agendaEvents || []).filter(event => event.id !== eventId);
    await updateResident(residentId, { agendaEvents: updatedEvents });
  }, [residents, updateResident]);

  const addVisit = useCallback(async (residentId: string, visitData: Omit<Visit, 'id' | 'visitDate'>) => {
    const resident = residents.find(r => r.id === residentId);
    if (!resident) return;

     const updatedVisits = [
        ...(resident.visits || []),
        { ...visitData, id: `visit-${Date.now()}`, visitDate: new Date().toISOString() }
     ];
    
    await updateResident(residentId, { visits: updatedVisits });
  }, [residents, updateResident]);

  return { residents, addResident, updateResident, dischargeResident, addAgendaEvent, updateAgendaEvent, deleteAgendaEvent, addVisit, isLoading };
}

export { useResidents };