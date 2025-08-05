
"use client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Camera, CameraOff, AlertTriangle, RefreshCw } from "lucide-react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface CameraCaptureProps {
  onPhotoTaken: (dataUri: string) => void
}

export function CameraCapture({ onPhotoTaken }: CameraCaptureProps) {
  const { toast } = useToast()
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsStreamActive(false);
  }, [])

  const enableCamera = useCallback(async () => {
    setCapturedImage(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasPermission(false)
      toast({
          variant: "destructive",
          title: "Cámara no Soportada",
          description: "Su navegador no soporta el acceso a la cámara.",
      })
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setHasPermission(true)
      setIsStreamActive(true);
    } catch (error) {
      console.error("Error accessing camera:", error)
      setHasPermission(false)
      toast({
        variant: "destructive",
        title: "Acceso a Cámara Denegado",
        description: "Por favor, habilite el permiso de cámara en su navegador.",
      })
    }
  }, [toast])

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current
      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext("2d")
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
        const dataUri = canvas.toDataURL("image/jpeg")
        setCapturedImage(dataUri)
        onPhotoTaken(dataUri)
        stopCameraStream();
      }
    }
  }
  
  const handleRetry = () => {
    setCapturedImage(null)
    enableCamera()
  };
  
  useEffect(() => {
    // ComponentWillUnmount cleanup
    return () => {
      stopCameraStream()
    }
  }, [stopCameraStream])
  
  // Don't render anything until component is mounted on client
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
      setIsMounted(true);
  }, []);

  if (!isMounted) {
      return null;
  }

  // --- RENDER LOGIC ---

  if (capturedImage) {
    return (
      <div className="space-y-2">
          <p className="text-sm font-medium text-center">Vista Previa:</p>
          <div className="relative aspect-video w-full">
               <img src={capturedImage} alt="Foto capturada" className="w-full h-full object-contain rounded-md"/>
          </div>
          <Button type="button" variant="outline" onClick={handleRetry} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tomar otra foto
          </Button>
      </div>
    );
  }

  if (isStreamActive) {
    return (
        <div className="space-y-2 rounded-md border p-2">
            <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay playsInline muted />
            <div className="flex justify-center gap-2">
                 <Button type="button" onClick={capturePhoto} className="w-full">
                    <Camera className="mr-2 h-4 w-4" />
                    Capturar Foto
                </Button>
                 <Button type="button" variant="outline" onClick={stopCameraStream} className="w-full">
                    <CameraOff className="mr-2 h-4 w-4" />
                    Cerrar Cámara
                </Button>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" onClick={enableCamera} className="w-full">
        <Camera className="mr-2 h-4 w-4" />
        Abrir Cámara
      </Button>

      {hasPermission === false && (
         <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Permiso de Cámara Requerido</AlertTitle>
            <AlertDescription>
                No se pudo acceder a la cámara. Por favor, verifique los permisos en su navegador.
            </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

    