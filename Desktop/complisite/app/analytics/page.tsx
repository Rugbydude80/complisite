'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users,
  Award,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Download
} from 'lucide-react'

interface AnalyticsData {
  total_projects: number
  active_projects: number
  completed_projects: number
  total_users: number
  active_users: number
  compliance_rate: number
  safety_incidents: number
  expiring_certificates: number
  monthly_trend: {
    month: string
    projects: number
    compliance: number
  }[]
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalyticsData()
  }, [])

  const loadAnalyticsData = async () => {
    try {
      // Mock data for now - replace with actual Supabase query
      const mockData: AnalyticsData = {
        total_projects: 47,
        active_projects: 32,
        completed_projects: 12,
        total_users: 156,
        active_users: 142,
        compliance_rate: 96,
        safety_incidents: 2,
        expiring_certificates: 8,
        monthly_trend: [
          { month: 'Jan', projects: 5, compliance: 92 },
          { month: 'Feb', projects: 8, compliance: 94 },
          { month: 'Mar', projects: 12, compliance: 95 },
          { month: 'Apr', projects: 15, compliance: 96 },
          { month: 'May', projects: 18, compliance: 97 },
          { month: 'Jun', projects: 22, compliance: 96 },
          { month: 'Jul', projects: 25, compliance: 98 },
          { month: 'Aug', projects: 28, compliance: 97 },
          { month: 'Sep', projects: 32, compliance: 96 }
        ]
      }

      setAnalyticsData(mockData)
    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!analyticsData) return null

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-gray-600">Comprehensive insights into your organization's performance</p>
      </div>

      {/* Quick Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Analytics
          </Button>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Set Date Range
          </Button>
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Custom Report
          </Button>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="text-3xl font-bold text-blue-600">{analyticsData.total_projects}</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% from last month
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-green-600">{analyticsData.active_users}</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8% from last month
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Compliance Rate</p>
                <p className="text-3xl font-bold text-purple-600">{analyticsData.compliance_rate}%</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +2% from last month
                </p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Safety Incidents</p>
                <p className="text-3xl font-bold text-red-600">{analyticsData.safety_incidents}</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -50% from last month
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Projects</span>
                <div className="flex items-center gap-2">
                  <Progress value={(analyticsData.active_projects / analyticsData.total_projects) * 100} className="w-20" />
                  <span className="text-sm text-gray-600">{analyticsData.active_projects}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Completed Projects</span>
                <div className="flex items-center gap-2">
                  <Progress value={(analyticsData.completed_projects / analyticsData.total_projects) * 100} className="w-20" />
                  <span className="text-sm text-gray-600">{analyticsData.completed_projects}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">On Hold</span>
                <div className="flex items-center gap-2">
                  <Progress value={((analyticsData.total_projects - analyticsData.active_projects - analyticsData.completed_projects) / analyticsData.total_projects) * 100} className="w-20" />
                  <span className="text-sm text-gray-600">{analyticsData.total_projects - analyticsData.active_projects - analyticsData.completed_projects}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Overall Compliance</span>
                <div className="flex items-center gap-2">
                  <Progress value={analyticsData.compliance_rate} className="w-20" />
                  <span className="text-sm text-gray-600">{analyticsData.compliance_rate}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Certificates Expiring</span>
                <span className="text-sm font-medium text-orange-600">{analyticsData.expiring_certificates}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Safety Incidents</span>
                <span className="text-sm font-medium text-red-600">{analyticsData.safety_incidents}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Project Growth</h3>
              <Badge variant="outline">Last 9 Months</Badge>
            </div>
            <div className="grid grid-cols-9 gap-2">
              {analyticsData.monthly_trend.map((trend, index) => (
                <div key={trend.month} className="text-center">
                  <div className="text-xs text-gray-600 mb-2">{trend.month}</div>
                  <div className="bg-blue-100 rounded h-16 flex items-end justify-center">
                    <div 
                      className="bg-blue-600 rounded-t w-full"
                      style={{ height: `${(trend.projects / Math.max(...analyticsData.monthly_trend.map(t => t.projects))) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{trend.projects}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-green-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Strengths
              </h3>
              <ul className="space-y-2 text-sm">
                <li>• High compliance rate (96%)</li>
                <li>• Low safety incident rate</li>
                <li>• Strong project completion rate</li>
                <li>• Active user engagement</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-orange-600 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Areas for Improvement
              </h3>
              <ul className="space-y-2 text-sm">
                <li>• 8 certificates expiring soon</li>
                <li>• 2 safety incidents this month</li>
                <li>• 3 projects on hold</li>
                <li>• 14 inactive users</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
