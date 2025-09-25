'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { MapPin, Eye, Calendar } from "lucide-react"
import { getProjects, type Project } from '@/lib/data'

export function ProjectsGrid() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true)
        const data = await getProjects()
        setProjects(data)
        setError(null)
      } catch (error) {
        console.error('Error fetching projects:', error)
        setError(error instanceof Error ? error.message : 'Failed to load projects')
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'pending': return 'bg-yellow-500'
      case 'issues': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getComplianceColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Active Projects</h2>
          <Button variant="ghost" disabled>View All</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Active Projects</h2>
          <Button variant="ghost" disabled>View All</Button>
        </div>
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={() => {
            setError(null)
            setLoading(true)
            // Re-trigger the useEffect
            window.location.reload()
          }}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Active Projects</h2>
        <Button variant="ghost">View All</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <Badge variant="outline" className={`${getStatusColor(project.status)} text-white border-0`}>
                  {project.status}
                </Badge>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1" />
                {project.address}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Compliance</span>
                  <span className={`font-medium ${getComplianceColor(project.compliance_score)}`}>
                    {project.compliance_score}%
                  </span>
                </div>
                <Progress value={project.compliance_score} className="h-2" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                Updated {new Date(project.updated_at).toLocaleDateString()}
              </div>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
