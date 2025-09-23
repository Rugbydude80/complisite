import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, CheckSquare, TrendingUp, AlertTriangle } from "lucide-react"

const stats = [
  {
    title: "Total Projects",
    value: "24",
    icon: Building,
    description: "Active construction sites",
  },
  {
    title: "Active Checklists",
    value: "156",
    icon: CheckSquare,
    description: "Pending compliance checks",
  },
  {
    title: "Compliance Score",
    value: "94%",
    icon: TrendingUp,
    description: "Overall compliance rating",
  },
  {
    title: "Pending Items",
    value: "12",
    icon: AlertTriangle,
    description: "Require immediate attention",
  },
]

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
