import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Eye, MapPin, Calendar } from "lucide-react"

const projects = [
  {
    id: 1,
    name: "Downtown Office Complex",
    address: "123 Business Ave, Downtown",
    status: "active",
    compliance: 96,
    lastUpdated: "2 hours ago",
  },
  {
    id: 2,
    name: "Riverside Residential",
    address: "456 River Rd, Westside",
    status: "pending",
    compliance: 78,
    lastUpdated: "1 day ago",
  },
  {
    id: 3,
    name: "Industrial Warehouse",
    address: "789 Industrial Blvd, East",
    status: "issues",
    compliance: 65,
    lastUpdated: "3 hours ago",
  },
  {
    id: 4,
    name: "Shopping Center Renovation",
    address: "321 Mall Dr, Northside",
    status: "active",
    compliance: 89,
    lastUpdated: "5 hours ago",
  },
  {
    id: 5,
    name: "Hospital Extension",
    address: "654 Medical Way, Central",
    status: "active",
    compliance: 92,
    lastUpdated: "1 hour ago",
  },
  {
    id: 6,
    name: "School Modernization",
    address: "987 Education St, South",
    status: "pending",
    compliance: 73,
    lastUpdated: "2 days ago",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-success text-success-foreground"
    case "pending":
      return "bg-warning text-warning-foreground"
    case "issues":
      return "bg-destructive text-destructive-foreground"
    default:
      return "bg-secondary text-secondary-foreground"
  }
}

const getComplianceColor = (compliance: number) => {
  if (compliance >= 90) return "text-success"
  if (compliance >= 75) return "text-warning"
  return "text-destructive"
}

export function ProjectsGrid() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Active Projects</h2>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg leading-tight text-balance">{project.name}</CardTitle>
                <Badge className={`${getStatusColor(project.status)} capitalize text-xs`}>{project.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="text-pretty">{project.address}</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Compliance</span>
                  <span className={`font-semibold ${getComplianceColor(project.compliance)}`}>
                    {project.compliance}%
                  </span>
                </div>
                <Progress value={project.compliance} className="h-2" />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Updated {project.lastUpdated}</span>
                </div>
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
