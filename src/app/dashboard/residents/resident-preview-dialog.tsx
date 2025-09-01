
import { useState, useMemo, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Resident } from "@/hooks/use-residents"
import { Log, useLogs } from "@/hooks/use-logs"
import { User, Stethoscope, Truck } from "lucide-react"
import LogDetailDialog from "../components/log-detail-dialog"
import ResidentProfileDisplay from "./resident-profile-display" // Import the new component

interface ResidentPreviewDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  resident: Resident | null
}

export default function ResidentPreviewDialog({ isOpen, onOpenChange, resident }: ResidentPreviewDialogProps) {
  if (!resident) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <User className="mr-2" />
            Ficha Rápida del Residente
          </DialogTitle>
          <DialogDescription>
            Información de cuidado e historial de reportes para {resident.name}.
          </DialogDescription>
        </DialogHeader>
        
        <ResidentProfileDisplay resident={resident} />

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button">Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
