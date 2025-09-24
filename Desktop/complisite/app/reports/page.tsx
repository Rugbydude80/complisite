'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Users,
  Award
} from 'lucide-react'

interface Report {
  id: string
  title: string
  type: string
  status: 'completed' | 'pending' | 'failed'
  created_at: string
  file_url?: string
}

interface ComplianceStats {
  total_projects: number
  compliant_projects: number
  compliance_rate: number
  expiring_certificates: number
  safety_incidents: number
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [complianceStats, setComplianceStats] = useState<ComplianceStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReports()
    loadComplianceStats()
  }, [])

  const loadReports = async () => {
    try {
      // Mock data for now - replace with actual Supabase query
      const mockReports: Report[] = [
        {
          id: '1',
          title: 'Monthly Compliance Report - September 2024',
          type: 'Compliance Summary',
          status: 'completed',
          created_at: '2024-09-24',
          file_url: '/reports/compliance-september-2024.pdf'
        },
        {
          id: '2',
          title: 'Safety Incident Report',
          type: 'Safety Analysis',
          status: 'completed',
          created_at: '2024-09-23',
          file_url: '/reports/safety-incident-2024.pdf'
        },
        {
          id: '3',
          title: 'Certificate Expiry Report',
          type: 'Certificate Management',
          status: 'pending',
          created_at: '2024-09-22'
        },
        {
          id: '4',
          title: 'Team Performance Report',
          type: 'Performance Analysis',
          status: 'completed',
          created_at: '2024-09-21',
          file_url: '/reports/team-performance-2024.pdf'
        }
      ]

      setReports(mockReports)
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadComplianceStats = async () => {
    try {
      // Mock data for now - replace with actual Supabase query
      const mockStats: ComplianceStats = {
        total_projects: 12,
        compliant_projects: 11,
        compliance_rate: 92,
        expiring_certificates: 8,
        safety_incidents: 2
      }

      setComplianceStats(mockStats)
    } catch (error) {
      console.error('Error loading compliance stats:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
      case 'pending':
        return <Badge variant="default" className="bg-orange-100 text-orange-800">Pending</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-gray-600">Generate and view compliance reports for your projects</p>
      </div>

      {/* Quick Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Generate New Report
          </Button>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Report
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download All Reports
          </Button>
        </CardContent>
      </Card>

      {/* Compliance Overview */}
      {complianceStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Projects</p>
                  <p className="text-3xl font-bold text-blue-600">{complianceStats.total_projects}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Compliant Projects</p>
                <p className="text-3xl font-bold text-green-600">{complianceStats.compliant_projects}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Compliance Rate</p>
                <p className="text-3xl font-bold text-purple-600">{complianceStats.compliance_rate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Safety Incidents</p>
                <p className="text-3xl font-bold text-red-600">{complianceStats.safety_incidents}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(report.status)}
                    <div>
                      <h3 className="font-semibold">{report.title}</h3>
                      <p className="text-sm text-gray-600">{report.type}</p>
                      <p className="text-xs text-gray-500">
                        Created: {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(report.status)}
                    {report.file_url && (
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Report Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold">Compliance Summary</h3>
                  <p className="text-sm text-gray-600">Monthly compliance overview</p>
                </div>
              </div>
            </div>
            <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold">Team Performance</h3>
                  <p className="text-sm text-gray-600">Individual and team metrics</p>
                </div>
              </div>
            </div>
            <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center space-x-3">
                <Award className="h-8 w-8 text-purple-600" />
                <div>
                  <h3 className="font-semibold">Certificate Status</h3>
                  <p className="text-sm text-gray-600">Training and certification reports</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
