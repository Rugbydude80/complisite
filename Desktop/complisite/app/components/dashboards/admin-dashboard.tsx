'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Building2, 
  Users, 
  FolderKanban, 
  TrendingUp, 
  AlertCircle,
  Plus,
  Settings,
  BarChart3,
  Shield
} from 'lucide-react'

export function AdminDashboard() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Organization Dashboard</h1>
        <p className="text-gray-600">Complete oversight of all projects, teams, and compliance</p>
      </div>

      {/* Organization Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="text-3xl font-bold text-blue-600">47</p>
              </div>
              <FolderKanban className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-green-600">156</p>
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
                <p className="text-3xl font-bold text-purple-600">96%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Issues</p>
                <p className="text-3xl font-bold text-orange-600">7</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Administrative Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Manage Users
          </Button>
          <Button variant="outline">
            <Building2 className="h-4 w-4 mr-2" />
            Organization Settings
          </Button>
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
        </CardContent>
      </Card>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Projects</span>
                <span className="text-sm font-medium text-blue-600">32</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Completed</span>
                <span className="text-sm font-medium text-green-600">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">On Hold</span>
                <span className="text-sm font-medium text-orange-600">3</span>
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
                <span className="text-sm font-medium text-green-600">148/156</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Training Completed</span>
                <span className="text-sm font-medium text-blue-600">142/156</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Safety Incidents</span>
                <span className="text-sm font-medium text-red-600">2</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Projects Compliant</span>
                <div className="flex items-center gap-2">
                  <Progress value={96} className="w-20" />
                  <span className="text-sm text-gray-600">96%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Certificates Expiring</span>
                <span className="text-sm font-medium text-orange-600">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Audits Scheduled</span>
                <span className="text-sm font-medium text-blue-600">5</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">New certificate uploaded</p>
                <p className="text-xs text-gray-500">John Smith - 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Certificate expiring soon</p>
                <p className="text-xs text-gray-500">Sarah Johnson - 4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Project milestone completed</p>
                <p className="text-xs text-gray-500">Downtown Office Complex - 6 hours ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
