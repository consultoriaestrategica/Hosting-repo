// DEPRECATED: Este componente fue reemplazado por la gestión de documentos
// en la pestaña "Documentos" del perfil de residente.
// Se mantiene por referencia. No se usa activamente.
"use client"

import { useState, useEffect, useRef } from "react"
import { db, storage, auth } from "@/lib/firebase"
import {
  doc,
  onSnapshot,
  updateDoc,
  deleteField,
  serverTimestamp,
} from "firebase/firestore"
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage"
import { useUser } from "@/hooks/use-user"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FileText, Upload, Download, RefreshCw, Trash2, UserCheck } from "lucide-react"

interface ContractData {
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
  storagePath?: string
  uploadedAt: Date
  uploadedBy: {
    uid: string
    displayName: string
    email: string
  }
}

interface ContractAttachmentProps {
  residentId: string
  residentName: string
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export default function ContractAttachment({ residentId, residentName }: ContractAttachmentProps) {
  const [contract, setContract] = useState<ContractData | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const replaceFileInputRef = useRef<HTMLInputElement>(null)

  const { user: staffUser, hasPermission } = useUser()
  const { toast } = useToast()
  const canModify = hasPermission("settings")

  useEffect(() => {
    const residentRef = doc(db, "residents", residentId)
    const unsub = onSnapshot(residentRef, (snap) => {
      const data = snap.data()
      if (data?.contract) {
        setContract({
          ...data.contract,
          uploadedAt: data.contract.uploadedAt?.toDate?.() ?? new Date(),
        })
      } else {
        setContract(null)
      }
    })
    return () => unsub()
  }, [residentId])

  const uploadFile = async (file: File, isReplace = false) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"]
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Tipo de archivo no permitido",
        description: "Solo se permiten archivos PDF, JPG o PNG.",
      })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Archivo demasiado grande",
        description: "El archivo no puede superar los 10 MB.",
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)

    if (isReplace && contract?.storagePath) {
      try {
        await deleteObject(storageRef(storage, contract.storagePath))
      } catch {
        // File may not exist in storage, continue
      }
    }

    const timestamp = Date.now()
    const path = `contracts/${residentId}/${timestamp}_${file.name}`
    const fileRef = storageRef(storage, path)
    const uploadTask = uploadBytesResumable(fileRef, file)

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        setUploadProgress(progress)
      },
      (error) => {
        console.error("Upload error:", error)
        toast({
          variant: "destructive",
          title: "Error al subir el archivo",
          description: "Intenta nuevamente.",
        })
        setUploading(false)
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref)
        const currentUser = auth.currentUser

        await updateDoc(doc(db, "residents", residentId), {
          contract: {
            fileName: file.name,
            fileUrl: url,
            fileSize: file.size,
            fileType: file.type,
            storagePath: path,
            uploadedAt: serverTimestamp(),
            uploadedBy: {
              uid: currentUser?.uid || "",
              displayName:
                staffUser?.name ||
                currentUser?.displayName ||
                currentUser?.email ||
                "—",
              email: currentUser?.email || "",
            },
          },
        })

        toast({
          title: isReplace
            ? "Contrato reemplazado exitosamente"
            : "Contrato adjuntado exitosamente",
        })
        setUploading(false)
        setUploadProgress(0)
      }
    )
  }

  const handleDelete = async () => {
    if (!contract) return
    if (contract.storagePath) {
      try {
        await deleteObject(storageRef(storage, contract.storagePath))
      } catch {
        // May already be deleted
      }
    }
    await updateDoc(doc(db, "residents", residentId), {
      contract: deleteField(),
    })
    toast({ title: "Contrato eliminado" })
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contrato Adjunto
          </CardTitle>
          <CardDescription>
            Documento del contrato firmado de {residentName}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uploading ? (
            <div className="space-y-3 py-6">
              <p className="text-sm text-muted-foreground">Subiendo contrato...</p>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">
                {Math.round(uploadProgress)}%
              </p>
            </div>
          ) : contract ? (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-start gap-3">
                <FileText className="h-8 w-8 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{contract.fileName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatFileSize(contract.fileSize)} · Subido el{" "}
                    {contract.uploadedAt.toLocaleDateString("es-ES", {
                      dateStyle: "long",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <UserCheck className="h-3 w-3 shrink-0" />
                    {contract.uploadedBy?.displayName ||
                      contract.uploadedBy?.email ||
                      "—"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(contract.fileUrl, "_blank")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Descargar
                </Button>
                {canModify && (
                  <>
                    <input
                      ref={replaceFileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) uploadFile(file, true)
                        e.target.value = ""
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => replaceFileInputRef.current?.click()}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reemplazar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 border-2 border-dashed rounded-lg">
              <FileText className="h-12 w-12 text-muted-foreground/40" />
              <div>
                <p className="font-medium text-muted-foreground">
                  Sin contrato adjunto
                </p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Sube el contrato firmado del residente en formato PDF o imagen.
                </p>
              </div>
              {canModify && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) uploadFile(file, false)
                      e.target.value = ""
                    }}
                  />
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Subir contrato
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Formatos: PDF, JPG, PNG (máx. 10 MB)
                  </p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contrato adjunto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el contrato adjunto de{" "}
              {residentName}. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
