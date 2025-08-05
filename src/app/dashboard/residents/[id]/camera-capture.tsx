
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
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const stopCameraStream = useCallback((stream: MediaStream | null) => {
    stream?.getTracks().forEach((track) => track.stop())
  }, [])

  const enableCamera = useCallback(async () => {
    setCapturedImage(null)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        setHasPermission(true)
        setIsCameraOpen(true)
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (error) {
        console.error("Error accessing camera:", error)
        setHasPermission(false)
        setIsCameraOpen(false)
        toast({
          variant: "destructive",
          title: "Acceso a Cámara Denegado",
          description: "Por favor, habilite el permiso de cámara en su navegador.",
        })
      }
    } else {
        setHasPermission(false)
        toast({
            variant: "destructive",
            title: "Cámara no Soportada",
            description: "Su navegador no soporta el acceso a la cámara.",
        })
    }
  }, [toast])

  const closeCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      stopCameraStream(videoRef.current.srcObject as MediaStream)
      videoRef.current.srcObject = null
    }
    setIsCameraOpen(false)
  }, [stopCameraStream])

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext("2d")
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
        const dataUri = canvas.toDataURL("image/jpeg")
        setCapturedImage(dataUri)
        onPhotoTaken(dataUri)
        closeCamera()
      }
    }
  }

  // Cleanup effect
  useEffect(() => {
    return () => {
       if (videoRef.current && videoRef.current.srcObject) {
            stopCameraStream(videoRef.current.srcObject as MediaStream)
       }
    }
  }, [stopCameraStream])
  
  const handleRetry = () => {
    setHasPermission(null);
    setCapturedImage(null);
    enableCamera();
  };

  return (
    <div className="space-y-2">
      {!isCameraOpen && !capturedImage && (
        <Button type="button" variant="outline" onClick={enableCamera} className="w-full">
          <Camera className="mr-2 h-4 w-4" />
          Abrir Cámara
        </Button>
      )}

      {hasPermission === false && (
         <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Permiso de Cámara Requerido</AlertTitle>
            <AlertDescription>
                No se pudo acceder a la cámara. Por favor, verifique los permisos y vuelva a intentarlo.
            </AlertDescription>
        </Alert>
      )}

      {isCameraOpen && hasPermission && (
        <div className="space-y-2 rounded-md border p-2">
            <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay playsInline muted />
            <div className="flex justify-center gap-2">
                 <Button type="button" onClick={capturePhoto} className="w-full">
                    <Camera className="mr-2 h-4 w-4" />
                    Capturar Foto
                </Button>
                 <Button type="button" variant="outline" onClick={closeCamera} className="w-full">
                    <CameraOff className="mr-2 h-4 w-4" />
                    Cerrar Cámara
                </Button>
            </div>
        </div>
      )}
      
      {capturedImage && (
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
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
