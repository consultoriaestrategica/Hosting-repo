"use client"
import { useState } from "react";
import type { Staff } from "@/hooks/use-staff"; // Asegúrate de que tu tipo 'Staff' esté disponible para importar

// Hooks
import { useToast } from "@/hooks/use-toast";

// Componentes de UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";

// SDK de Firebase
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app as firebaseApp } from "@/lib/firebase"; // Verifica la ruta a tu config de Firebase
// import { collection, addDoc } from "firebase/firestore"; 
// import { db } from "@/lib/firebase";

// Define las propiedades que el componente recibirá de la página padre
interface NewStaffContractFormProps {
  staffMember: Staff;
  onFormSubmit: () => void; // Función para cerrar el modal
}

export default function NewStaffContractForm({ staffMember, onFormSubmit }: NewStaffContractFormProps) {
  const { toast } = useToast();
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSaveContract = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!contractFile) {
      toast({ variant: "destructive", title: "Error", description: "Por favor, adjunte un documento de contrato." });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const filePath = `staff-contracts/${staffMember.id}/${Date.now()}-${contractFile.name}`;
      const storage = getStorage(firebaseApp);
      const fileRef = ref(storage, filePath);

      toast({ title: "Subiendo archivo...", description: "Por favor espere." });
      const snapshot = await uploadBytes(fileRef, contractFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log("Archivo subido con éxito. URL:", downloadURL);

      // (Paso futuro) Aquí es donde guardarías la `downloadURL` en Firestore
      // ...

      toast({ title: "¡Contrato Guardado!", description: "El archivo se ha subido y el contrato ha sido creado." });
      onFormSubmit(); // Llama a la función del padre para cerrar el modal

    } catch (error) {
      console.error("Error al subir el archivo:", error);
      toast({ variant: "destructive", title: "Error de subida", description: "No se pudo subir el archivo." });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSaveContract} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="contract-file">Documento del Contrato (PDF)</Label>
        <Input
          id="contract-file"
          type="file"
          accept=".pdf"
          onChange={(e) => setContractFile(e.target.files ? e.target.files[0] : null)}
          required
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onFormSubmit}>Cancelar</Button>
        <Button type="submit" disabled={isUploading}>
          {isUploading ? "Guardando..." : "Guardar Contrato"}
        </Button>
      </DialogFooter>
    </form>
  );
}