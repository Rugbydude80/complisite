import { Header } from "@/app/components/header"
import { StatsCards } from "@/app/components/stats-cards"
import { ProjectsGrid } from "@/app/components/projects-grid"
import { AddProjectButton } from "@/app/components/add-project-button"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-balance">Construction Compliance Dashboard</h1>
          <p className="text-muted-foreground text-pretty">
            Monitor project compliance, track checklists, and manage construction oversight
          </p>
        </div>
        <StatsCards />
        <ProjectsGrid />
      </main>
      <AddProjectButton />
    </div>
  )
}
