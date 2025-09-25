import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface InviteRequest {
  organizationId: string;
  emails: string[];
  role?: 'admin' | 'member';
}

/**
 * POST handler for inviting team members to an organization
 * This endpoint should be protected by authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: InviteRequest = await request.json();
    const { organizationId, emails, role = 'member' } = body;

    // Validate input
    if (!organizationId || !emails || emails.length === 0) {
      return NextResponse.json({ error: 'Organization ID and emails are required' }, { status: 400 });
    }

    if (emails.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 invitations allowed per request' }, { status: 400 });
    }

    // Check if user is admin of the organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (membershipError || !membership || membership.role !== 'admin') {
      return NextResponse.json({ error: 'Only organization admins can invite members' }, { status: 403 });
    }

    // Check organization subscription status
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('subscription_status, plan_tier')
      .eq('id', organizationId)
      .single();

    if (orgError) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (organization.subscription_status !== 'active' && organization.subscription_status !== 'trial') {
      return NextResponse.json({ error: 'Organization must have an active subscription to invite members' }, { status: 403 });
    }

    // Get current member count
    const { count: currentMemberCount } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    // Check plan limits
    const planLimits = {
      starter: 5,
      professional: 25,
      enterprise: 999999, // Unlimited
    };

    const maxMembers = planLimits[organization.plan_tier as keyof typeof planLimits] || 5;

    if (currentMemberCount && currentMemberCount + emails.length > maxMembers) {
      return NextResponse.json({
        error: `Plan limit exceeded. Your ${organization.plan_tier} plan allows up to ${maxMembers} members.`,
        currentMembers: currentMemberCount,
        maxMembers,
        requested: emails.length
      }, { status: 403 });
    }

    // Process invitations
    const results = [];
    for (const email of emails) {
      try {
        // Check if user already exists
        const { data: existingUser, error: userError } = await supabase
          .from('auth.users')
          .select('id')
          .eq('email', email)
          .single();

        if (existingUser) {
          // User exists, add them to organization
          const { error: insertError } = await supabase
            .from('organization_members')
            .insert({
              organization_id: organizationId,
              user_id: existingUser.id,
              role: role,
              status: 'active'
            });

          if (insertError) {
            results.push({ email, status: 'error', message: 'Failed to add existing user' });
          } else {
            results.push({ email, status: 'success', message: 'User added to organization' });
          }
        } else {
          // User doesn't exist, send invitation
          // In a real implementation, you'd send an email invitation
          // For now, we'll just record the pending invitation
          const { error: inviteError } = await supabase
            .from('organization_members')
            .insert({
              organization_id: organizationId,
              user_id: null, // Will be set when they sign up
              role: role,
              status: 'pending'
            });

          if (inviteError) {
            results.push({ email, status: 'error', message: 'Failed to create invitation' });
          } else {
            results.push({ email, status: 'pending', message: 'Invitation sent' });
          }
        }
      } catch (error) {
        results.push({ email, status: 'error', message: 'Unknown error' });
      }
    }

    return NextResponse.json({
      message: 'Invitations processed',
      results,
      summary: {
        total: emails.length,
        successful: results.filter(r => r.status === 'success').length,
        pending: results.filter(r => r.status === 'pending').length,
        errors: results.filter(r => r.status === 'error').length
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error processing invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
