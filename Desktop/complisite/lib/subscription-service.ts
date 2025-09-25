import { createClient } from '@supabase/supabase-js';
import LemonSqueezy from '@lemonsqueezy/lemonsqueezy.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Initialize Lemon Squeezy with your API key
const ls = new LemonSqueezy(process.env.LEMONSQUEEZY_API_KEY!);

export interface PlanTier {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  variantId: string;
  features: string[];
  popular?: boolean;
}

export interface SubscriptionStatus {
  status: 'trial' | 'active' | 'cancelled' | 'past_due';
  planTier: string;
  trialEndsAt?: Date;
  subscriptionId?: string;
}

export interface OrganizationSubscription {
  organizationId: string;
  organizationName: string;
  status: SubscriptionStatus;
  memberCount: number;
  createdAt: Date;
}

/**
 * Get all available subscription plans from Lemon Squeezy
 * @returns Array of plan tiers
 */
export async function getSubscriptionPlans(): Promise<PlanTier[]> {
  try {
    // In a real implementation, you'd fetch these from Lemon Squeezy API
    // For now, we'll return static plans that match your Lemon Squeezy setup
    return [
      {
        id: 'starter',
        name: 'Starter',
        price: 89,
        interval: 'month',
        variantId: process.env.LEMONSQUEEZY_STARTER_PLAN_VARIANT_ID!,
        features: [
          'Up to 5 team members',
          'Basic compliance tracking',
          'Certificate management',
          'Email support',
          'Standard checklists'
        ]
      },
      {
        id: 'professional',
        name: 'Professional',
        price: 179,
        interval: 'month',
        variantId: process.env.LEMONSQUEEZY_PROFESSIONAL_PLAN_VARIANT_ID!,
        features: [
          'Up to 25 team members',
          'Advanced compliance tracking',
          'Advanced certificate management',
          'Priority support',
          'Custom checklists',
          'Project templates',
          'Reporting dashboard'
        ],
        popular: true
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 359,
        interval: 'month',
        variantId: process.env.LEMONSQUEEZY_ENTERPRISE_PLAN_VARIANT_ID!,
        features: [
          'Unlimited team members',
          'Full compliance suite',
          'API access',
          'Dedicated support',
          'White-label solution',
          'Advanced analytics',
          'Custom integrations',
          'SSO authentication'
        ]
      }
    ];
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    throw error;
  }
}

/**
 * Create a subscription checkout URL for a specific plan
 * @param variantId - Lemon Squeezy variant ID for the plan
 * @param userEmail - User's email address
 * @param customData - Optional custom data to pass to Lemon Squeezy
 * @returns Checkout URL
 */
export async function createCheckoutUrl(
  variantId: string,
  userEmail: string,
  customData?: Record<string, any>
): Promise<string> {
  try {
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;

    if (!storeId) {
      throw new Error('LEMONSQUEEZY_STORE_ID environment variable is required');
    }

    const checkoutData = {
      store: storeId,
      variant: variantId,
      email: userEmail,
      custom_data: customData ? JSON.stringify(customData) : undefined,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing`,
    };

    // Use Lemon Squeezy SDK to create checkout
    const response = await ls.createCheckout(checkoutData);

    if (!response.data?.attributes?.url) {
      throw new Error('Failed to create checkout URL');
    }

    return response.data.attributes.url;
  } catch (error) {
    console.error('Error creating checkout URL:', error);
    throw error;
  }
}

/**
 * Get subscription status for an organization
 * @param organizationId - Organization ID
 * @returns Subscription status
 */
export async function getSubscriptionStatus(organizationId: string): Promise<SubscriptionStatus | null> {
  try {
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('subscription_status, plan_tier, trial_ends_at, subscription_id')
      .eq('id', organizationId)
      .single();

    if (error) {
      console.error('Error fetching subscription status:', error);
      return null;
    }

    if (!organization) {
      return null;
    }

    return {
      status: organization.subscription_status as SubscriptionStatus['status'],
      planTier: organization.plan_tier || 'starter',
      trialEndsAt: organization.trial_ends_at ? new Date(organization.trial_ends_at) : undefined,
      subscriptionId: organization.subscription_id,
    };
  } catch (error) {
    console.error('Error in getSubscriptionStatus:', error);
    return null;
  }
}

/**
 * Get all organizations with their subscription status
 * @param userId - User ID to filter organizations they belong to
 * @returns Array of organization subscriptions
 */
export async function getUserOrganizationsWithSubscriptions(userId: string): Promise<OrganizationSubscription[]> {
  try {
    const { data: memberships, error: membershipError } = await supabase
      .from('organization_members')
      .select(`
        organization_id,
        role,
        status,
        organizations (
          id,
          name,
          subscription_status,
          plan_tier,
          trial_ends_at,
          subscription_id,
          created_at
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (membershipError) {
      console.error('Error fetching user organizations:', membershipError);
      return [];
    }

    if (!memberships || memberships.length === 0) {
      return [];
    }

    // Get member count for each organization
    const organizationsWithCounts = await Promise.all(
      memberships.map(async (membership: any) => {
        const { count } = await supabase
          .from('organization_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', membership.organization_id)
          .eq('status', 'active');

        return {
          organizationId: membership.organization_id,
          organizationName: membership.organizations.name,
          status: {
            status: membership.organizations.subscription_status as SubscriptionStatus['status'],
            planTier: membership.organizations.plan_tier || 'starter',
            trialEndsAt: membership.organizations.trial_ends_at ? new Date(membership.organizations.trial_ends_at) : undefined,
            subscriptionId: membership.organizations.subscription_id,
          },
          memberCount: count || 0,
          createdAt: new Date(membership.organizations.created_at),
        };
      })
    );

    return organizationsWithCounts;
  } catch (error) {
    console.error('Error in getUserOrganizationsWithSubscriptions:', error);
    return [];
  }
}

/**
 * Cancel a subscription
 * @param subscriptionId - Lemon Squeezy subscription ID
 * @returns Success status
 */
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  try {
    // Use Lemon Squeezy SDK to cancel subscription
    await ls.updateSubscription(subscriptionId, {
      cancelled: true
    });

    return true;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return false;
  }
}

/**
 * Update user profile to mark as subscription admin
 * @param userId - User ID
 * @param organizationId - Organization ID
 * @param isAdmin - Whether user should be subscription admin
 */
export async function updateSubscriptionAdminStatus(
  userId: string,
  organizationId: string,
  isAdmin: boolean
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        is_subscription_admin: isAdmin,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error updating subscription admin status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateSubscriptionAdminStatus:', error);
    return false;
  }
}

/**
 * Check if user is subscription admin for an organization
 * @param userId - User ID
 * @param organizationId - Organization ID
 * @returns Whether user is subscription admin
 */
export async function isSubscriptionAdmin(userId: string, organizationId: string): Promise<boolean> {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('is_subscription_admin')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error checking subscription admin status:', error);
      return false;
    }

    return profile?.is_subscription_admin || false;
  } catch (error) {
    console.error('Error in isSubscriptionAdmin:', error);
    return false;
  }
}

/**
 * Get subscription analytics for an organization
 * @param organizationId - Organization ID
 * @returns Subscription analytics data
 */
export async function getSubscriptionAnalytics(organizationId: string): Promise<{
  totalMembers: number;
  activeMembers: number;
  subscriptionStatus: string;
  planTier: string;
  trialEndsAt?: Date;
  daysRemainingInTrial?: number;
} | null> {
  try {
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('subscription_status, plan_tier, trial_ends_at')
      .eq('id', organizationId)
      .single();

    if (orgError) {
      console.error('Error fetching organization:', orgError);
      return null;
    }

    const { count: totalMembers } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    const { count: activeMembers } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    const trialEndsAt = organization.trial_ends_at ? new Date(organization.trial_ends_at) : null;
    const daysRemainingInTrial = trialEndsAt ?
      Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) :
      undefined;

    return {
      totalMembers: totalMembers || 0,
      activeMembers: activeMembers || 0,
      subscriptionStatus: organization.subscription_status,
      planTier: organization.plan_tier || 'starter',
      trialEndsAt,
      daysRemainingInTrial,
    };
  } catch (error) {
    console.error('Error in getSubscriptionAnalytics:', error);
    return null;
  }
}
