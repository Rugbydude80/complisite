import { supabase } from '@/lib/supabase'

export type Role = 'admin' | 'manager' | 'worker'
export type MemberStatus = 'active' | 'suspended' | 'invited'

export interface OrganizationMember {
  id: string
  user_id: string
  role: Role
  status: MemberStatus
  created_at: string
  user_profile?: {
    full_name: string
    email: string
    phone?: string
    trade?: string
    avatar_url?: string
  }
}

export interface Invitation {
  id: string
  email: string
  role: Role
  status: 'pending' | 'accepted' | 'revoked' | 'expired'
  expires_at: string
  invited_by: string
  created_at: string
}

export class TeamService {
  // Get all organization members
  static async getMembers(organizationId: string): Promise<OrganizationMember[]> {
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        *,
        user_profile:user_profiles(*)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Invite a new member
  static async inviteMember(
    organizationId: string,
    email: string,
    role: Role,
    message?: string
  ): Promise<Invitation> {
    // Check if user already exists in org
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', (
        await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('email', email)
          .single()
      ).data?.user_id)
      .single()

    if (existingMember) {
      throw new Error('User is already a member of this organization')
    }

    // Create invitation
    const { data, error } = await supabase
      .from('invitations')
      .insert({
        organization_id: organizationId,
        email,
        role,
        invited_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single()

    if (error) throw error

    // Log activity
    await supabase.rpc('log_activity', {
      p_org_id: organizationId,
      p_action_type: 'member_invited',
      p_description: `Invited ${email} as ${role}`,
      p_metadata: { email, role, invitation_id: data.id }
    })

    // TODO: Send invitation email
    if (message) {
      // await sendInvitationEmail(email, data.token, message)
    }

    return data
  }

  // Accept invitation
  static async acceptInvitation(token: string): Promise<void> {
    // Get invitation
    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single()

    if (invError || !invitation) {
      throw new Error('Invalid or expired invitation')
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Add user to organization
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: invitation.organization_id,
        user_id: user.id,
        role: invitation.role,
        status: 'active'
      })

    if (memberError) throw memberError

    // Update invitation status
    await supabase
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id)

    // Log activity
    await supabase.rpc('log_activity', {
      p_org_id: invitation.organization_id,
      p_action_type: 'invitation_accepted',
      p_description: `${user.email} accepted invitation`,
      p_metadata: { invitation_id: invitation.id, role: invitation.role }
    })
  }

  // Change member role
  static async changeMemberRole(
    organizationId: string,
    userId: string,
    newRole: Role
  ): Promise<void> {
    const { error } = await supabase
      .from('organization_members')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('organization_id', organizationId)
      .eq('user_id', userId)

    if (error) throw error

    // Log activity
    await supabase.rpc('log_activity', {
      p_org_id: organizationId,
      p_action_type: 'role_changed',
      p_description: `Changed role to ${newRole}`,
      p_metadata: { user_id: userId, new_role: newRole }
    })
  }

  // Suspend/activate member
  static async updateMemberStatus(
    organizationId: string,
    userId: string,
    status: MemberStatus
  ): Promise<void> {
    const { error } = await supabase
      .from('organization_members')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('organization_id', organizationId)
      .eq('user_id', userId)

    if (error) throw error

    // Log activity
    await supabase.rpc('log_activity', {
      p_org_id: organizationId,
      p_action_type: 'status_changed',
      p_description: `Member status changed to ${status}`,
      p_metadata: { user_id: userId, status }
    })
  }

  // Remove member from organization
  static async removeMember(
    organizationId: string,
    userId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', organizationId)
      .eq('user_id', userId)

    if (error) throw error

    // Log activity
    await supabase.rpc('log_activity', {
      p_org_id: organizationId,
      p_action_type: 'member_removed',
      p_description: 'Member removed from organization',
      p_metadata: { user_id: userId }
    })
  }

  // Get pending invitations
  static async getPendingInvitations(organizationId: string): Promise<Invitation[]> {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Revoke invitation
  static async revokeInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase
      .from('invitations')
      .update({ status: 'revoked' })
      .eq('id', invitationId)

    if (error) throw error
  }

  // Resend invitation
  static async resendInvitation(invitationId: string): Promise<void> {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .single()

    if (error) throw error

    // TODO: Send invitation email
    // await sendInvitationEmail(data.email, data.token)
  }
}
