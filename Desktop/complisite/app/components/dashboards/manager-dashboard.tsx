'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  FolderKanban, 
  TrendingUp, 
  AlertCircle,
  Plus,
  FileText,
  BarChart3
} from 'lucide-react'

export function ManagerDashboard() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Project Management Dashboard</h1>
        <p className="text-gray-600">Oversee team performance and project compliance</p>
      </div>

      {/* Project Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Projects</p>
                <p className="text-3xl font-bold text-blue-600">12</p>
              </div>
              <FolderKanban className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Team Members</p>
                <p className="text-3xl font-bold text-green-600">24</p>
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
                <p className="text-3xl font-bold text-purple-600">94%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Issues</p>
                <p className="text-3xl font-bold text-orange-600">3</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Manage Team
          </Button>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </CardContent>
      </Card>

      {/* Project Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Downtown Office Complex</span>
                <div className="flex items-center gap-2">
                  <Progress value={75} className="w-20" />
                  <span className="text-sm text-gray-600">75%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Residential Tower</span>
                <div className="flex items-center gap-2">
                  <Progress value={45} className="w-20" />
                  <span className="text-sm text-gray-600">45%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Shopping Mall</span>
                <div className="flex items-center gap-2">
                  <Progress value={90} className="w-20" />
                  <span className="text-sm text-gray-600">90%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Certificates Valid</span>
                <span className="text-sm font-medium text-green-600">22/24</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Training Completed</span>
                <span className="text-sm font-medium text-blue-600">18/24</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Safety Incidents</span>
                <span className="text-sm font-medium text-red-600">0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
