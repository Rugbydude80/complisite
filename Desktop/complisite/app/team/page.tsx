'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  UserPlus, 
  Mail,
  Phone,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreHorizontal
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { TeamService } from '@/lib/team-service'

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  trade: string
  avatar?: string
  status: 'active' | 'inactive' | 'pending'
  certificates: number
  compliance_rate: number
  last_active: string
}

export default function TeamPage() {
  const supabase = createClient()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTeamMembers()
  }, [])

  const loadTeamMembers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Please log in to view team members')
        return
      }

      // Get user's organization
      const { data: orgMember } = await supabase
        .from('secure_organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (!orgMember) {
        setError('You are not part of any organization')
        return
      }

      // Load team members from database
      const members = await TeamService.getMembers(orgMember.organization_id)
      
      // Transform to our interface
      const transformedMembers: TeamMember[] = members.map(member => ({
        id: member.id,
        name: member.user_profile?.full_name || 'Unknown',
        email: member.user_profile?.email || 'No email',
        role: member.role,
        trade: member.user_profile?.trade || 'Unknown',
        status: member.status as 'active' | 'inactive' | 'pending',
        certificates: 0, // TODO: Calculate from certificates
        compliance_rate: 0, // TODO: Calculate from compliance data
        last_active: member.created_at
      }))

      setTeamMembers(transformedMembers)
    } catch (error) {
      console.error('Error loading team members:', error)
      setError('Failed to load team members. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-600" />
      case 'inactive':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
      case 'pending':
        return <Badge variant="default" className="bg-orange-100 text-orange-800">Pending</Badge>
      case 'inactive':
        return <Badge variant="destructive">Inactive</Badge>
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
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Team</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => {
            setError(null)
            setLoading(true)
            loadTeamMembers()
          }}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Team Management</h1>
        <p className="text-gray-600">Manage your team members and their compliance status</p>
      </div>

      {/* Quick Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Team Member
          </Button>
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Send Bulk Email
          </Button>
          <Button variant="outline">
            <Award className="h-4 w-4 mr-2" />
            View Training Status
          </Button>
        </CardContent>
      </Card>

      {/* Team Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="text-3xl font-bold text-blue-600">{teamMembers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Members</p>
                <p className="text-3xl font-bold text-green-600">
                  {teamMembers.filter(m => m.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-3xl font-bold text-orange-600">
                  {teamMembers.filter(m => m.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Compliance</p>
                <p className="text-3xl font-bold text-purple-600">
                  {Math.round(teamMembers.reduce((acc, m) => acc + m.compliance_rate, 0) / teamMembers.length)}%
                </p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div key={member.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{member.name}</h3>
                      <p className="text-sm text-gray-600">{member.role} • {member.trade}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{member.certificates} certificates</p>
                      <p className="text-xs text-gray-500">{member.compliance_rate}% compliant</p>
                    </div>
                    {getStatusIcon(member.status)}
                    {getStatusBadge(member.status)}
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}