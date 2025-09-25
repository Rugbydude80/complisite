-- ============================================
-- LEMON SQUEEZY SUBSCRIPTION SCHEMA
-- ============================================
--
-- This script adds subscription management to the existing organizations table
-- for Lemon Squeezy payment integration
--
-- Run this script in your Supabase SQL Editor after the main schema
-- ============================================

-- Add subscription columns to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'past_due')),
ADD COLUMN IF NOT EXISTS subscription_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS lemonsqueezy_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'starter' CHECK (plan_tier IN ('starter', 'professional', 'enterprise'));

-- Add subscription-related columns to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS is_subscription_admin BOOLEAN DEFAULT false;

-- Create subscription events table for audit trail
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('subscription_created', 'subscription_updated', 'subscription_cancelled', 'trial_started', 'trial_ended', 'payment_failed')),
  lemonsqueezy_event_id TEXT UNIQUE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status ON organizations(subscription_status);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_id ON organizations(subscription_id);
CREATE INDEX IF NOT EXISTS idx_organizations_trial_ends_at ON organizations(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_subscription_events_organization_id ON subscription_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON subscription_events(created_at);

-- Create a function to automatically set trial_ends_at when subscription_status changes to 'trial'
CREATE OR REPLACE FUNCTION set_trial_end_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subscription_status = 'trial' AND NEW.subscription_status != COALESCE(OLD.subscription_status, '') THEN
    NEW.trial_ends_at := NOW() + INTERVAL '14 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set trial end date
DROP TRIGGER IF EXISTS trigger_set_trial_end_date ON organizations;
CREATE TRIGGER trigger_set_trial_end_date
  BEFORE INSERT OR UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION set_trial_end_date();

-- Enable Row Level Security on subscription_events table
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Create policies for subscription_events (organization members can read their org's events)
CREATE POLICY "Organization members can view their subscription events" ON subscription_events
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert subscription events" ON subscription_events
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create a view for subscription summary
CREATE OR REPLACE VIEW subscription_summary AS
SELECT
  o.id as organization_id,
  o.name as organization_name,
  o.subscription_status,
  o.plan_tier,
  o.trial_ends_at,
  o.subscription_id,
  COUNT(DISTINCT om.user_id) as member_count,
  o.created_at as organization_created_at
FROM organizations o
LEFT JOIN organization_members om ON o.id = om.organization_id AND om.status = 'active'
GROUP BY o.id, o.name, o.subscription_status, o.plan_tier, o.trial_ends_at, o.subscription_id, o.created_at;

-- Add comments for documentation
COMMENT ON COLUMN organizations.subscription_status IS 'Current subscription status: trial, active, cancelled, past_due';
COMMENT ON COLUMN organizations.subscription_id IS 'Lemon Squeezy subscription ID';
COMMENT ON COLUMN organizations.lemonsqueezy_customer_id IS 'Lemon Squeezy customer ID';
COMMENT ON COLUMN organizations.trial_ends_at IS 'When the 14-day trial expires';
COMMENT ON COLUMN organizations.plan_tier IS 'Current plan tier: starter, professional, enterprise';
COMMENT ON COLUMN user_profiles.is_subscription_admin IS 'Whether user can manage subscription and invite members';
