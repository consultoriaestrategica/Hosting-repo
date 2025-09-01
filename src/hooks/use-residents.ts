
"use client"

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
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
    setIsLoading(true);
    const unsubscribe = onSnapshot(residentsCollection, (snapshot) => {
        const residentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resident));
        setResidents(residentsData);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching residents from Firestore: ", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);


  const addResident = useCallback(async (newResident: Omit<Resident, 'id'>) => {
    try {
        await addDoc(residentsCollection, newResident);
    } catch (error) {
        console.error("Error adding resident to Firestore: ", error);
    }
  }, []);

  const updateResident = useCallback(async (residentId: string, updatedDetails: Partial<Omit<Resident, 'id'>>) => {
    try {
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
