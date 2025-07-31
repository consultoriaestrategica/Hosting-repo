"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, FileUp, PlusCircle, CheckCircle, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const resident = {
  id: "res-001",
  name: "Maria Rodriguez",
  dob: "1942-05-15",
  age: 82,
  gender: "Female",
  idNumber: "12345678",
  pathologies: ["Alzheimer's", "Hypertension"],
  allergies: ["Penicillin"],
  medications: ["Donepezil 10mg", "Lisinopril 20mg"],
  diet: "Low sodium, soft foods",
  dependency: "High",
  familyContact: {
    name: "Juan Rodriguez",
    kinship: "Son",
    phone: "+1-202-555-0182",
    email: "juan.r@example.com",
  },
}

const evolutionLog = [
    { date: "2024-07-20", mood: "Calm", appetite: "Good", sleep: "Restful", vitals: "130/85, 72bpm, 36.8°C", meds: true, notes: "Participated in morning music therapy." },
    { date: "2024-07-19", mood: "Agitated", appetite: "Fair", sleep: "Interrupted", vitals: "135/88, 78bpm, 37.0°C", meds: true, notes: "Experienced some confusion in the afternoon." },
    { date: "2024-07-18", mood: "Happy", appetite: "Good", sleep: "Good", vitals: "128/82, 70bpm, 36.7°C", meds: true, notes: "Enjoyed the visit from her family." },
]

const documents = [
    { name: "Historia_Clinica.pdf", date: "2023-01-10" },
    { name: "Cedula_Ciudadania.jpg", date: "2023-01-10" },
    { name: "Consentimiento_Informado.pdf", date: "2023-01-11" },
]


export default function ResidentProfilePage({ params }: { params: { id: string } }) {
  const { toast } = useToast()

  const handleGenerateReport = () => {
    toast({
      title: "Generating Report...",
      description: `A PDF report for ${resident.name} is being created.`,
    })
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold font-headline tracking-tight sm:grow-0">
          {resident.name}'s Profile
        </h1>
        <div className="hidden items-center gap-2 md:ml-auto md:flex">
          <Button variant="outline" size="sm" onClick={handleGenerateReport}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Emergency Alert
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Emergency Notification</AlertDialogTitle>
                <AlertDialogDescription>
                  This will immediately send an emergency alert to {resident.familyContact.name} via Email and WhatsApp. Are you sure you want to proceed?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                  toast({
                    variant: "destructive",
                    title: "Emergency Alert Sent!",
                    description: `${resident.familyContact.name} has been notified.`,
                  })
                }}>
                  Confirm & Send
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div className="grid flex-1 items-start gap-4 lg:grid-cols-3 lg:gap-8 mt-4">
        <div className="grid auto-rows-max items-start gap-4 lg:col-span-1 lg:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Demographics</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
                <div className="grid grid-cols-2 gap-2">
                    <div className="font-semibold">Age</div><div>{resident.age}</div>
                    <div className="font-semibold">Gender</div><div>{resident.gender}</div>
                    <div className="font-semibold">ID</div><div>{resident.idNumber}</div>
                    <div className="font-semibold">D.O.B.</div><div>{resident.dob}</div>
                </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Family Contact</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
                 <div className="grid grid-cols-2 gap-2">
                    <div className="font-semibold">Name</div><div>{resident.familyContact.name}</div>
                    <div className="font-semibold">Kinship</div><div>{resident.familyContact.kinship}</div>
                    <div className="font-semibold">Phone</div><div>{resident.familyContact.phone}</div>
                    <div className="font-semibold">Email</div><div>{resident.familyContact.email}</div>
                </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
           <Tabs defaultValue="evolution">
            <TabsList>
              <TabsTrigger value="evolution">Daily Evolution</TabsTrigger>
              <TabsTrigger value="profile">Full Profile</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            <TabsContent value="evolution">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Log</CardTitle>
                  <CardDescription>Chronological record of the resident's daily status.</CardDescription>
                  <Button size="sm" className="h-8 gap-1 w-fit ml-auto -mt-12">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      Add New Entry
                    </span>
                  </Button>
                </CardHeader>
                <CardContent>
                   <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Mood</TableHead>
                        <TableHead>Appetite</TableHead>
                        <TableHead>Meds</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {evolutionLog.map(log => (
                           <TableRow key={log.date}>
                               <TableCell className="font-medium">{log.date}</TableCell>
                               <TableCell>{log.mood}</TableCell>
                               <TableCell>{log.appetite}</TableCell>
                               <TableCell><CheckCircle className="text-green-500" /></TableCell>
                               <TableCell className="max-w-[200px] truncate">{log.notes}</TableCell>
                           </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Medical & Care Profile</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-4">
                  <div>
                    <h3 className="font-semibold">Dependency Level</h3>
                    <Badge variant={resident.dependency === "High" ? "destructive" : "secondary"}>{resident.dependency}</Badge>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-semibold">Main Pathologies</h3>
                    <div className="flex flex-wrap gap-2 mt-1">{resident.pathologies.map(p => <Badge key={p} variant="outline">{p}</Badge>)}</div>
                  </div>
                  <Separator />
                   <div>
                    <h3 className="font-semibold">Allergies</h3>
                    <div className="flex flex-wrap gap-2 mt-1">{resident.allergies.map(a => <Badge key={a} variant="destructive">{a}</Badge>)}</div>
                  </div>
                   <Separator />
                   <div>
                    <h3 className="font-semibold">Prescribed Medications</h3>
                    <p>{resident.medications.join(", ")}</p>
                  </div>
                   <Separator />
                   <div>
                    <h3 className="font-semibold">Dietary Plan</h3>
                    <p>{resident.diet}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="documents">
                <Card>
                    <CardHeader>
                        <CardTitle>Stored Documents</CardTitle>
                        <CardDescription>Securely stored clinical history and legal documents.</CardDescription>
                         <Button variant="outline" size="sm" className="h-8 gap-1 w-fit ml-auto -mt-12">
                            <FileUp className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                              Upload Document
                            </span>
                          </Button>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>File Name</TableHead>
                                    <TableHead>Upload Date</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {documents.map(doc => (
                                   <TableRow key={doc.name}>
                                       <TableCell className="font-medium">{doc.name}</TableCell>
                                       <TableCell>{doc.date}</TableCell>
                                       <TableCell>
                                           <Button variant="link" size="sm" className="p-0 h-auto">Download</Button>
                                       </TableCell>
                                   </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                    </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
