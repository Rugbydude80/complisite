import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';
import { LemonSqueezyWebhookEvent } from '@lemonsqueezy/lemonsqueezy.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface LemonSqueezySubscriptionData {
  id: string;
  status: string;
  customer_id: string;
  customer_email: string;
  product_id: string;
  variant_id: string;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Validates the HMAC signature from Lemon Squeezy webhook
 * @param payload - Raw webhook payload
 * @param signature - HMAC signature from headers
 * @param secret - Webhook secret from environment
 * @returns boolean - Whether signature is valid
 */
function validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expected = createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');

    return signature === expected;
  } catch (error) {
    console.error('Error validating webhook signature:', error);
    return false;
  }
}

/**
 * Maps Lemon Squeezy variant_id to plan tiers
 * @param variantId - Lemon Squeezy variant ID
 * @returns plan tier string
 */
function getPlanTierFromVariantId(variantId: string): string {
  // These should match your Lemon Squeezy plan variant IDs from .env
  const starterId = process.env.LEMONSQUEEZY_STARTER_PLAN_VARIANT_ID;
  const professionalId = process.env.LEMONSQUEEZY_PROFESSIONAL_PLAN_VARIANT_ID;
  const enterpriseId = process.env.LEMONSQUEEZY_ENTERPRISE_PLAN_VARIANT_ID;

  if (variantId === starterId) return 'starter';
  if (variantId === professionalId) return 'professional';
  if (variantId === enterpriseId) return 'enterprise';

  return 'starter'; // Default fallback
}

/**
 * Updates organization subscription status based on webhook event
 * @param organizationId - Organization ID
 * @param subscriptionData - Subscription data from webhook
 */
async function updateOrganizationSubscription(organizationId: string, subscriptionData: LemonSqueezySubscriptionData) {
  const planTier = getPlanTierFromVariantId(subscriptionData.variant_id);
  const subscriptionStatus = subscriptionData.status === 'active' ? 'active' :
                           subscriptionData.status === 'cancelled' ? 'cancelled' :
                           subscriptionData.status === 'past_due' ? 'past_due' : 'trial';

  const updateData: any = {
    subscription_status: subscriptionStatus,
    subscription_id: subscriptionData.id,
    plan_tier: planTier,
  };

  // Set trial end date if applicable
  if (subscriptionStatus === 'trial' && subscriptionData.trial_ends_at) {
    updateData.trial_ends_at = new Date(subscriptionData.trial_ends_at).toISOString();
  } else if (subscriptionStatus === 'trial') {
    // Set 14-day trial if no specific trial end date
    updateData.trial_ends_at = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  }

  // Update organization
  const { error: updateError } = await supabase
    .from('organizations')
    .update(updateData)
    .eq('id', organizationId);

  if (updateError) {
    console.error('Error updating organization subscription:', updateError);
    throw updateError;
  }

  // Log the subscription event
  const { error: eventError } = await supabase
    .from('subscription_events')
    .insert({
      organization_id: organizationId,
      user_id: subscriptionData.customer_id, // Using customer_id as user_id for now
      event_type: subscriptionStatus === 'active' ? 'subscription_created' :
                 subscriptionStatus === 'cancelled' ? 'subscription_cancelled' :
                 'subscription_updated',
      metadata: {
        lemonsqueezy_subscription_id: subscriptionData.id,
        plan_tier: planTier,
        customer_email: subscriptionData.customer_email,
        variant_id: subscriptionData.variant_id,
      }
    });

  if (eventError) {
    console.error('Error logging subscription event:', eventError);
    // Don't throw here, as the main update was successful
  }
}

/**
 * POST handler for Lemon Squeezy webhooks
 * Handles subscription_created, subscription_updated, and subscription_cancelled events
 */
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-signature');
    const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      console.error('Missing webhook signature or secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawBody = await request.text();
    const isValidSignature = validateWebhookSignature(rawBody, signature, webhookSecret);

    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const webhookData: LemonSqueezyWebhookEvent = JSON.parse(rawBody);
    const eventName = webhookData.meta.event_name;
    const subscriptionData = webhookData.data as LemonSqueezySubscriptionData;

    console.log(`Processing webhook event: ${eventName}`, subscriptionData);

    // Only process subscription-related events
    if (!eventName.startsWith('subscription_')) {
      return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
    }

    // Find organization by Lemon Squeezy customer_id
    // This assumes the customer_id matches the organization ID
    // You may need to adjust this logic based on your implementation
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('lemonsqueezy_customer_id', subscriptionData.customer_id)
      .single();

    if (orgError && orgError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error finding organization:', orgError);
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (!organization) {
      // Create new organization if it doesn't exist
      console.log('Creating new organization for customer:', subscriptionData.customer_id);

      const { data: newOrg, error: createError } = await supabase
        .from('organizations')
        .insert({
          name: subscriptionData.customer_email.split('@')[0] + ' Organization',
          lemonsqueezy_customer_id: subscriptionData.customer_id,
          subscription_status: subscriptionData.status === 'active' ? 'active' : 'trial',
          plan_tier: getPlanTierFromVariantId(subscriptionData.variant_id),
          trial_ends_at: subscriptionData.trial_ends_at ?
            new Date(subscriptionData.trial_ends_at).toISOString() :
            new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select('id, name')
        .single();

      if (createError) {
        console.error('Error creating organization:', createError);
        return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
      }

      await updateOrganizationSubscription(newOrg.id, subscriptionData);
    } else {
      await updateOrganizationSubscription(organization.id, subscriptionData);
    }

    return NextResponse.json({ message: 'Webhook processed successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET handler for webhook verification
 * Lemon Squeezy sends a test webhook on setup
 */
export async function GET() {
  return NextResponse.json({
    message: 'Lemon Squeezy webhook endpoint active',
    timestamp: new Date().toISOString()
  });
}
