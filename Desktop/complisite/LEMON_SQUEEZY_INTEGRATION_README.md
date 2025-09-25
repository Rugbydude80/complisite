# Lemon Squeezy Payment Integration

This document provides a complete guide for setting up and using the Lemon Squeezy subscription billing integration for your SaaS application.

## Overview

The integration includes:
- Three subscription tiers: Starter (£89), Professional (£179), Enterprise (£359)
- 14-day free trial
- Automatic VAT handling for UK/EU
- Webhook processing for subscription events
- Post-payment onboarding flow
- Team member invitation system

## Quick Start

### 1. Set up Lemon Squeezy Account

1. Create a Lemon Squeezy account at [lemonsqueezy.com](https://lemonsqueezy.com)
2. Create a store in your dashboard
3. Create three products (Starter, Professional, Enterprise) with monthly billing
4. Note the **Variant IDs** for each plan from your product settings

### 2. Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Lemon Squeezy Configuration
LEMONSQUEEZY_API_KEY=your_api_key_here
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret_here
LEMONSQUEEZY_STORE_ID=your_store_id_here

# Lemon Squeezy Plan Variant IDs (from your dashboard)
LEMONSQUEEZY_STARTER_PLAN_VARIANT_ID=your_starter_variant_id_here
LEMONSQUEEZY_PROFESSIONAL_PLAN_VARIANT_ID=your_professional_variant_id_here
LEMONSQUEEZY_ENTERPRISE_PLAN_VARIANT_ID=your_enterprise_variant_id_here
```

### 3. Set up Webhooks

1. In your Lemon Squeezy dashboard, go to Settings → Webhooks
2. Add a new webhook endpoint: `https://yourdomain.com/api/webhooks/lemon-squeezy`
3. Select these events:
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
4. Copy the webhook secret to your environment variables

### 4. Run Database Migration

Execute the subscription schema in your Supabase SQL editor:

```sql
-- Run the contents of database-subscription-schema.sql
```

### 5. Install Dependencies

The Lemon Squeezy package is already installed:

```bash
npm install @lemonsqueezy/lemonsqueezy.js
```

## Components and Usage

### Pricing Component

Display pricing with checkout integration:

```tsx
import Pricing from '@/components/pricing';

export default function PricingPage() {
  return (
    <div>
      <Pricing userEmail="user@example.com" />
    </div>
  );
}
```

### Subscription Service

Manage subscriptions programmatically:

```tsx
import { getSubscriptionPlans, createCheckoutUrl, getSubscriptionStatus } from '@/lib/subscription-service';

// Get available plans
const plans = await getSubscriptionPlans();

// Create checkout URL
const checkoutUrl = await createCheckoutUrl(variantId, userEmail);

// Get subscription status
const status = await getSubscriptionStatus(organizationId);
```

### Onboarding Flow

Handle post-payment setup:

```tsx
import OnboardingFlow from '@/components/onboarding-flow';

export default function OnboardingPage() {
  return (
    <OnboardingFlow
      organizationId="org-123"
      userId="user-456"
    />
  );
}
```

## API Endpoints

### Webhooks
- **URL**: `/api/webhooks/lemon-squeezy`
- **Method**: POST
- **Purpose**: Processes Lemon Squeezy webhook events

### Organization Invites
- **URL**: `/api/organization/invite`
- **Method**: POST
- **Purpose**: Invite team members to organizations

## Plan Features

### Starter (£89/month)
- Up to 5 team members
- Basic compliance tracking
- Certificate management
- Email support
- Standard checklists

### Professional (£179/month)
- Up to 25 team members
- Advanced compliance tracking
- Advanced certificate management
- Priority support
- Custom checklists
- Project templates
- Reporting dashboard

### Enterprise (£359/month)
- Unlimited team members
- Full compliance suite
- API access
- Dedicated support
- White-label solution
- Advanced analytics
- Custom integrations
- SSO authentication

## Database Schema

The integration adds these columns to the `organizations` table:

- `subscription_status`: 'trial', 'active', 'cancelled', 'past_due'
- `subscription_id`: Lemon Squeezy subscription ID
- `lemonsqueezy_customer_id`: Lemon Squeezy customer ID
- `trial_ends_at`: Trial expiration date
- `plan_tier`: 'starter', 'professional', 'enterprise'

## Webhook Events

The system handles these Lemon Squeezy webhook events:

### subscription_created
- Creates new organization if needed
- Sets subscription status to 'active' or 'trial'
- Logs subscription event

### subscription_cancelled
- Updates organization subscription status to 'cancelled'
- Logs cancellation event

### subscription_updated
- Updates subscription status and plan tier
- Logs update event

## Security Considerations

1. **Webhook Signature Verification**: All webhooks are validated using HMAC signatures
2. **Authentication**: API endpoints require proper authentication
3. **Rate Limiting**: Consider adding rate limiting to webhook endpoints
4. **Error Handling**: Comprehensive error handling prevents data inconsistencies

## Testing

### Test Webhook Events

You can test the integration by:

1. Creating a test subscription in Lemon Squeezy
2. Triggering webhook events
3. Verifying the organization status updates correctly

### Test Checkout Flow

1. Visit `/pricing` page
2. Click "Start 14-day trial" on any plan
3. Complete the Lemon Squeezy checkout process
4. Verify user is redirected to onboarding flow

## Troubleshooting

### Common Issues

1. **Webhook not firing**: Check webhook URL and events in Lemon Squeezy dashboard
2. **Signature validation failing**: Verify webhook secret matches exactly
3. **Checkout not working**: Ensure variant IDs are correct and products are active
4. **Database errors**: Run the subscription schema migration

### Debug Mode

Enable debug logging by setting:

```bash
LEMONSQUEEZY_DEBUG=true
```

## Customization

### Adding New Plans

1. Create new product in Lemon Squeezy
2. Add variant ID to environment variables
3. Update plan configuration in `subscription-service.ts`
4. Update pricing component features

### Modifying Features

Edit the `features` arrays in `subscription-service.ts` to match your product offerings.

### Custom Styling

The pricing component uses Tailwind CSS classes that can be customized in your global styles.

## Support

For Lemon Squeezy-specific issues, refer to:
- [Lemon Squeezy Documentation](https://docs.lemonsqueezy.com/)
- [Lemon Squeezy Support](https://lemonsqueezy.com/support)

For integration-specific issues, check the logs in your Supabase dashboard and the application console.
