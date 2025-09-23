'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { supabase } from '@/lib/supabase'
import { ReportGenerator } from '@/components/report-generator'
import { FileText, Download, Building, Calendar, MapPin } from 'lucide-react'

export default function ProjectReportPage() {
  const params = useParams()
  const [project, setProject] = useState<any>(null)
  const [checklists, setChecklists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjectData()
  }, [params.id])

  const fetchProjectData = async () => {
    try {
      // For now, create mock data since the tables might not exist yet
      const mockProject = {
        id: params.id,
        name: 'Downtown Office Complex',
        address: '123 Main Street, Downtown, City',
        status: 'active',
        compliance_score: 85,
        created_at: new Date().toISOString(),
        description: 'Modern office complex with 20 floors'
      }
      
      const mockChecklists = [
        {
          id: '1',
          name: 'Fire Safety & Electrical Compliance',
          category: 'Safety Compliance',
          project_id: params.id,
          total_items: 15,
          completed_items: 12,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Structural Integrity Inspection',
          category: 'Structural Safety',
          project_id: params.id,
          total_items: 8,
          completed_items: 6,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Environmental Compliance',
          category: 'Environmental',
          project_id: params.id,
          total_items: 10,
          completed_items: 7,
          created_at: new Date().toISOString()
        }
      ]

      setProject(mockProject)
      setChecklists(mockChecklists)
      
      // TODO: Uncomment when database tables are created
      // const { data: projectData } = await supabase
      //   .from('projects')
      //   .select('*, checklists(*)')
      //   .eq('id', params.id)
      //   .single()

      // setProject(projectData)
      // setChecklists(projectData?.checklists || [])
    } catch (error) {
      console.error('Error fetching project data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getOverallCompletion = () => {
    if (checklists.length === 0) return 0
    const totalItems = checklists.reduce((sum, c) => sum + c.total_items, 0)
    const completedItems = checklists.reduce((sum, c) => sum + c.completed_items, 0)
    return Math.round((completedItems / totalItems) * 100)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'pending': return 'bg-yellow-500'
      case 'completed': return 'bg-blue-500'
      case 'on-hold': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading project reports...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Project not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Project Reports</h1>
          <p className="text-muted-foreground">Generate compliance reports for {project.name}</p>
        </div>

        {/* Project Overview */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building className="h-6 w-6 text-blue-600" />
                <div>
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4" />
                    {project.address}
                  </CardDescription>
                </div>
              </div>
              <Badge className={`${getStatusColor(project.status)} text-white`}>
                {project.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">Overall Progress</span>
                </div>
                <Progress value={getOverallCompletion()} className="h-2" />
                <p className="text-sm text-muted-foreground mt-1">
                  {getOverallCompletion()}% Complete
                </p>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Compliance Score</div>
                <div className="text-2xl font-bold text-green-600">
                  {project.compliance_score}%
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Total Checklists</div>
                <div className="text-2xl font-bold">
                  {checklists.length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Full Project Report */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Complete Project Report
            </CardTitle>
            <CardDescription>
              Generate a comprehensive compliance report for the entire project including all checklists and evidence
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Report includes:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Project overview and status</li>
                  <li>• All checklist items and completion status</li>
                  <li>• Evidence photos and documentation</li>
                  <li>• Compliance scores and summaries</li>
                  <li>• Professional formatting for inspectors</li>
                </ul>
              </div>
              <div className="flex items-end">
                <ReportGenerator 
                  project={project}
                  checklist={{ 
                    name: 'Complete Project Report', 
                    category: 'Full Project',
                    total_items: checklists.reduce((sum, c) => sum + c.total_items, 0),
                    completed_items: checklists.reduce((sum, c) => sum + c.completed_items, 0)
                  }}
                  items={[]} // Would combine all checklist items
                  photos={[]} // Would include all photos
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Individual Checklist Reports */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Individual Checklist Reports</h2>
          <div className="grid gap-4">
            {checklists.map((checklist) => {
              const completionRate = Math.round((checklist.completed_items / checklist.total_items) * 100)
              
              return (
                <Card key={checklist.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{checklist.name}</h3>
                          <Badge variant="outline">{checklist.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {checklist.completed_items} of {checklist.total_items} items completed
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{completionRate}%</span>
                          </div>
                          <Progress value={completionRate} className="h-2" />
                        </div>
                      </div>
                      <div className="ml-6 flex flex-col gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.location.href = `/checklists/${checklist.id}`}
                        >
                          View Checklist
                        </Button>
                        <ReportGenerator 
                          project={project}
                          checklist={checklist}
                          items={[]} // Would load actual checklist items
                          photos={[]} // Would load actual photos
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Additional reporting and export options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto p-4">
                <div className="text-left">
                  <div className="font-medium">Export Data</div>
                  <div className="text-sm text-muted-foreground">CSV/Excel format</div>
                </div>
              </Button>
              <Button variant="outline" className="h-auto p-4">
                <div className="text-left">
                  <div className="font-medium">Email Report</div>
                  <div className="text-sm text-muted-foreground">Send to stakeholders</div>
                </div>
              </Button>
              <Button variant="outline" className="h-auto p-4">
                <div className="text-left">
                  <div className="font-medium">Schedule Reports</div>
                  <div className="text-sm text-muted-foreground">Automated delivery</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
