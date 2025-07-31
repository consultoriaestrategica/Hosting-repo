import Link from "next/link"
import { PlusCircle, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

const residents = [
  { id: "res-001", name: "Maria Rodriguez", age: 82, pathology: "Alzheimer's", dependency: "High" },
  { id: "res-002", name: "Carlos Gomez", age: 78, pathology: "Hypertension", dependency: "Medium" },
  { id: "res-003", name: "Ana Torres", age: 85, pathology: "Diabetes", dependency: "Medium" },
  { id: "res-004", name: "Luis Fernandez", age: 75, pathology: "Arthritis", dependency: "Low" },
  { id: "res-005", name: "Elena Sanchez", age: 90, pathology: "Heart Disease", dependency: "High" },
]

export default function ResidentsPage() {
  return (
    <>
      <div className="flex items-center">
        <h1 className="text-3xl font-bold font-headline">Residents</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" className="h-8 gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Add New Resident
            </span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resident Roster</CardTitle>
          <CardDescription>
            Manage and view details of all residents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Main Pathology</TableHead>
                <TableHead>Dependency Level</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {residents.map((resident) => (
                <TableRow key={resident.id}>
                  <TableCell className="font-medium">{resident.name}</TableCell>
                  <TableCell>{resident.age}</TableCell>
                  <TableCell>{resident.pathology}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        resident.dependency === "High"
                          ? "destructive"
                          : resident.dependency === "Medium"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {resident.dependency}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                           <Link href={`/dashboard/residents/${resident.id}`}>View Profile</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Generate Report</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
