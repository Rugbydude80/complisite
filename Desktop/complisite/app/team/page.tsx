'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  UserPlus,
  MoreVertical,
  Mail,
  Shield,
  User,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react'
import { TeamService, type OrganizationMember, type Role, type Invitation } from '@/lib/team-service'
import { supabase } from '@/lib/supabase'

export default function TeamPage() {
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'worker' as Role,
    message: ''
  })
  const [organizationId, setOrganizationId] = useState<string>('')

  useEffect(() => {
    loadTeamData()
  }, [])

  const loadTeamData = async () => {
    try {
      // Get user's organization
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (!orgMember) return

      setOrganizationId(orgMember.organization_id)

      // Load members and invitations
      const [membersData, invitationsData] = await Promise.all([
        TeamService.getMembers(orgMember.organization_id),
        TeamService.getPendingInvitations(orgMember.organization_id)
      ])

      setMembers(membersData)
      setInvitations(invitationsData)
    } catch (error) {
      console.error('Error loading team data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    try {
      await TeamService.inviteMember(
        organizationId,
        inviteData.email,
        inviteData.role,
        inviteData.message
      )
      
      setInviteOpen(false)
      setInviteData({ email: '', role: 'worker', message: '' })
      await loadTeamData()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      await TeamService.changeMemberRole(organizationId, userId, newRole)
      await loadTeamData()
    } catch (error) {
      console.error('Error changing role:', error)
    }
  }

  const handleStatusChange = async (userId: string, status: 'active' | 'suspended') => {
    try {
      await TeamService.updateMemberStatus(organizationId, userId, status)
      await loadTeamData()
    } catch (error) {
      console.error('Error changing status:', error)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return
    
    try {
      await TeamService.removeMember(organizationId, userId)
      await loadTeamData()
    } catch (error) {
      console.error('Error removing member:', error)
    }
  }

  const handleResendInvitation = async (invitationId: string) => {
    try {
      await TeamService.resendInvitation(invitationId)
      alert('Invitation resent successfully')
    } catch (error) {
      console.error('Error resending invitation:', error)
    }
  }

  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      await TeamService.revokeInvitation(invitationId)
      await loadTeamData()
    } catch (error) {
      console.error('Error revoking invitation:', error)
    }
  }

  const getRoleBadge = (role: Role) => {
    const roleConfig = {
      admin: { icon: Shield, color: 'bg-purple-500' },
      manager: { icon: Users, color: 'bg-blue-500' },
      worker: { icon: User, color: 'bg-green-500' }
    }
    const config = roleConfig[role]
    const Icon = config.icon
    
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { icon: CheckCircle, color: 'bg-green-100 text-green-700' },
      suspended: { icon: XCircle, color: 'bg-red-100 text-red-700' },
      invited: { icon: Mail, color: 'bg-blue-100 text-blue-700' }
    }
    const config = statusConfig[status as keyof typeof statusConfig]
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const filteredMembers = members.filter(member =>
    member.user_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.user_profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.user_profile?.trade?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div>Loading team...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Team Management</h1>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your organization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={inviteData.role}
                  onValueChange={(value) => setInviteData({ ...inviteData, role: value as Role })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="worker">Worker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="message">Personal Message (Optional)</Label>
                <Textarea
                  id="message"
                  value={inviteData.message}
                  onChange={(e) => setInviteData({ ...inviteData, message: e.target.value })}
                  placeholder="Welcome to the team..."
                  rows={3}
                />
              </div>
              <Button onClick={handleInvite} className="w-full">
                Send Invitation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">
            Active Members ({members.length})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Pending Invitations ({invitations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Team Members</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    className="pl-10"
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Trade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Certificates</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.user_profile?.avatar_url} />
                            <AvatarFallback>
                              {member.user_profile?.full_name?.substring(0, 2).toUpperCase() || '??'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {member.user_profile?.full_name || 'Unknown'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{member.user_profile?.email}</TableCell>
                      <TableCell>{getRoleBadge(member.role)}</TableCell>
                      <TableCell>{member.user_profile?.trade || '-'}</TableCell>
                      <TableCell>{getStatusBadge(member.status)}</TableCell>
                      <TableCell>0</TableCell>
                      <TableCell>0</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleRoleChange(
                                member.user_id, 
                                member.role === 'worker' ? 'manager' : 'worker'
                              )}
                            >
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(
                                member.user_id,
                                member.status === 'active' ? 'suspended' : 'active'
                              )}
                            >
                              {member.status === 'active' ? 'Suspend' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleRemoveMember(member.user_id)}
                            >
                              Remove from Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              {invitations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pending invitations
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Invited By</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell>{invitation.email}</TableCell>
                        <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                        <TableCell>{invitation.invited_by}</TableCell>
                        <TableCell>
                          {new Date(invitation.expires_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResendInvitation(invitation.id)}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Resend
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRevokeInvitation(invitation.id)}
                            >
                              Revoke
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
