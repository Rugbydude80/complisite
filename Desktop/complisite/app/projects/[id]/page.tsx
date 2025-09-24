'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  BarChart3,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Users,
  AlertTriangle,
  Download,
  Plus,
  Shield,
  TrendingUp
} from 'lucide-react'
import { ProjectService } from '@/lib/project-service'
import { ComplianceChecklist } from '@/components/compliance-checklist'
import { TeamReadiness } from '@/components/team-readiness'
import { DailyReportModal } from '@/components/daily-report-modal'
import { PhotoUpload } from '@/components/photo-upload'

export default function ProjectDashboard() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
  const [project, setProject] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [compliance, setCompliance] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (projectId) {
      loadProjectData()
    }
  }, [projectId])

  const loadProjectData = async () => {
    try {
      const [projectData, statsData, complianceData, alertsData] = await Promise.all([
        ProjectService.getProject(projectId),
        ProjectService.getProjectStats(projectId),
        ProjectService.getProjectCompliance(projectId),
        ProjectService.getProjectAlerts(projectId, false)
      ])

      setProject(projectData)
      setStats(statsData)
      setCompliance(complianceData)
      setAlerts(alertsData)
    } catch (error) {
      console.error('Error loading project:', error)
    } finally {
      setLoading(false)
    }
  }

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50'
    if (score >= 70) return 'text-yellow-600 bg-yellow-50'
    if (score >= 50) return 'text-orange-600 bg-orange-50'
    return 'text-red-600 bg-red-50'
  }

  const getStatusBadge = (status: string) => {
    const config = {
      compliant: { color: 'bg-green-100 text-green-700', label: 'Compliant' },
      in_progress: { color: 'bg-blue-100 text-blue-700', label: 'In Progress' },
      requires_attention: { color: 'bg-orange-100 text-orange-700', label: 'Attention Required' },
      non_compliant: { color: 'bg-red-100 text-red-700', label: 'Non-Compliant' },
      not_started: { color: 'bg-gray-100 text-gray-700', label: 'Not Started' }
    }
    
    const cfg = config[status as keyof typeof config] || config.not_started
    return <Badge className={cfg.color}>{cfg.label}</Badge>
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading project...</div>
  }

  if (!project) {
    return <div>Project not found</div>
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {project.address || 'No address specified'}
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {stats?.team_size || 0} team members
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {stats?.days_remaining || 0} days remaining
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(project.compliance_status)}
            {project.project_type?.requires_golden_thread && (
              <Badge className="bg-purple-100 text-purple-700">
                <Shield className="h-3 w-3 mr-1" />
                Golden Thread Required
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription>
            <span className="font-semibold text-orange-800">
              {alerts.length} active {alerts.length === 1 ? 'alert' : 'alerts'}
            </span>
            {' - '}
            {alerts[0].title}
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Compliance Score</p>
                <p className={`text-3xl font-bold ${getComplianceColor(stats?.compliance_score || 0)}`}>
                  {stats?.compliance_score || 0}%
                </p>
              </div>
              <div className={`p-3 rounded-lg ${getComplianceColor(stats?.compliance_score || 0)}`}>
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
            <Progress value={stats?.compliance_score || 0} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Requirements</p>
                <p className="text-3xl font-bold">
                  {stats?.completed_requirements || 0}/{stats?.total_requirements || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            {stats?.overdue_items > 0 && (
              <p className="text-sm text-red-600 mt-2">
                {stats.overdue_items} overdue
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Documentation</p>
                <p className="text-3xl font-bold">{stats?.photos_uploaded || 0}</p>
                <p className="text-sm text-gray-500">Photos uploaded</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <Camera className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Daily Reports</p>
                <p className="text-3xl font-bold">{stats?.daily_reports || 0}</p>
                <p className="text-sm text-gray-500">Submitted</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compliance by Category */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Compliance by Category</CardTitle>
                <Button size="sm" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {compliance
                    .reduce((acc: any[], item) => {
                      const category = item.template?.category
                      if (!category) return acc
                      
                      const existing = acc.find(c => c.category === category)
                      if (existing) {
                        existing.total++
                        if (item.status === 'complete') existing.completed++
                      } else {
                        acc.push({
                          category,
                          total: 1,
                          completed: item.status === 'complete' ? 1 : 0
                        })
                      }
                      return acc
                    }, [])
                    .map((cat) => (
                      <div key={cat.category}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{cat.category}</span>
                          <span className="text-sm text-gray-500">
                            {cat.completed}/{cat.total}
                          </span>
                        </div>
                        <Progress 
                          value={(cat.completed / cat.total) * 100} 
                          className="h-2"
                        />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Risk Assessment completed</p>
                      <p className="text-xs text-gray-500">By John Smith • 2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Camera className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">5 photos uploaded</p>
                      <p className="text-xs text-gray-500">Site progress documentation • 4 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileText className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Daily report submitted</p>
                      <p className="text-xs text-gray-500">By Sarah Johnson • Yesterday</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance">
          <ComplianceChecklist 
            projectId={projectId}
            compliance={compliance}
            onUpdate={loadProjectData}
          />
        </TabsContent>

        <TabsContent value="team">
          <TeamReadiness 
            projectId={projectId}
            onUpdate={loadProjectData}
          />
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Project Documents</CardTitle>
              <div className="flex gap-2">
                <PhotoUpload 
                  projectId={projectId}
                  onSuccess={loadProjectData}
                />
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Document management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Daily Reports</CardTitle>
              <DailyReportModal 
                projectId={projectId}
                onSuccess={loadProjectData}
              />
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Report history coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2">
        <Button 
          size="lg" 
          className="shadow-lg"
          onClick={() => setActiveTab('compliance')}
        >
          <CheckCircle2 className="h-5 w-5 mr-2" />
          Complete Checklist
        </Button>
        <Button 
          size="lg" 
          variant="secondary"
          className="shadow-lg"
        >
          <Camera className="h-5 w-5 mr-2" />
          Upload Photo
        </Button>
      </div>
    </div>
  )
}