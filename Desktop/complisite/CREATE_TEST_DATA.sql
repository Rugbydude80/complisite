-- ============================================
-- CREATE TEST DATA FOR COMPLISITE
-- ============================================
-- This script creates sample data to test the application
-- Run this in Supabase SQL Editor to populate your database
-- ============================================

-- STEP 1: Create a test user (run this first to get the user ID)
-- NOTE: This creates a user in the auth.users table
-- You may need to run this in the Supabase Auth API or manually create a user

-- For testing purposes, let's create sample data assuming we have user IDs
-- Replace 'USER_ID_HERE' with actual user IDs from your auth.users table

-- STEP 2: Create test companies
INSERT INTO companies (name) VALUES
('Test Construction Ltd'),
('Demo Builders Inc'),
('Sample Construction Co')
ON CONFLICT (name) DO NOTHING;

-- STEP 3: Create test organizations
INSERT INTO organizations (name, description, created_by) VALUES
('Test Construction Ltd', 'A test construction company for development', '00000000-0000-0000-0000-000000000000'),
('Demo Site Operations', 'Demo organization for testing', '00000000-0000-0000-0000-000000000000'),
('Sample Project Team', 'Sample team for development testing', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (name) DO NOTHING;

-- STEP 4: Add users to organizations (replace with actual user IDs)
-- Get actual user IDs from your auth.users table first
INSERT INTO organization_members (organization_id, user_id, role, status) VALUES
-- Replace these UUIDs with actual user IDs from your auth.users table
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'admin', 'active'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'member', 'active'),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'admin', 'active')
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- STEP 5: Create test projects
INSERT INTO projects (
  name,
  organization_id,
  status,
  compliance_status,
  overall_progress,
  risk_level,
  address,
  postcode
) VALUES
(
  'Test Office Building',
  '00000000-0000-0000-0000-000000000001',
  'active',
  'in_progress',
  45,
  'medium',
  '123 Test Street',
  'TE1 2ST'
),
(
  'Demo Warehouse',
  '00000000-0000-0000-0000-000000000002',
  'planning',
  'not_started',
  0,
  'low',
  '456 Demo Avenue',
  'DE3 4MO'
),
(
  'Sample Renovation',
  '00000000-0000-0000-0000-000000000003',
  'active',
  'in_progress',
  78,
  'high',
  '789 Sample Road',
  'SA5 6MP'
)
ON CONFLICT (name) DO NOTHING;

-- STEP 6: Create certificate types if they don't exist
INSERT INTO certificate_types (name, category, issuing_bodies, typical_duration_months, is_mandatory) VALUES
('CSCS Card', 'General', ARRAY['CITB'], 60, true),
('First Aid', 'Health & Safety', ARRAY['Red Cross', 'St Johns Ambulance'], 36, true),
('Asbestos Awareness', 'Health & Safety', ARRAY['UKATA', 'IATP'], 12, true),
('Manual Handling', 'Health & Safety', ARRAY['CITB', 'IOSH'], 36, false),
('Working at Height', 'Health & Safety', ARRAY['CITB', 'PASMA'], 36, false)
ON CONFLICT (name) DO NOTHING;

-- STEP 7: Create user profiles for test users
-- Replace 'USER_ID_HERE' with actual user IDs
INSERT INTO user_profiles (user_id, full_name, trade) VALUES
('00000000-0000-0000-0000-000000000000', 'Test Admin', 'Project Manager'),
('00000000-0000-0000-0000-000000000001', 'Demo Worker', 'Electrician'),
('00000000-0000-0000-0000-000000000002', 'Sample Manager', 'Site Manager')
ON CONFLICT (user_id) DO NOTHING;

-- STEP 8: Create test certificates for users
INSERT INTO user_certificates (
  user_id,
  certificate_type_id,
  status,
  issue_date,
  expiry_date
) VALUES
('00000000-0000-0000-0000-000000000000', 'CSCS Card', 'verified', '2024-01-01', '2025-01-01'),
('00000000-0000-0000-0000-000000000000', 'First Aid', 'verified', '2024-03-01', '2025-03-01'),
('00000000-0000-0000-0000-000000000001', 'CSCS Card', 'verified', '2024-02-01', '2025-02-01'),
('00000000-0000-0000-0000-000000000002', 'Asbestos Awareness', 'verified', '2024-04-01', '2025-04-01')
ON CONFLICT (user_id, certificate_type_id) DO NOTHING;

-- STEP 9: Create project members
INSERT INTO project_members (project_id, user_id, role) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'admin'),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'member'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'admin')
ON CONFLICT (project_id, user_id) DO NOTHING;

-- STEP 10: Initialize compliance for projects
-- This calls the RPC function to set up compliance requirements
SELECT initialize_project_compliance('00000000-0000-0000-0000-000000000001');
SELECT initialize_project_compliance('00000000-0000-0000-0000-000000000002');
SELECT initialize_project_compliance('00000000-0000-0000-0000-000000000003');

-- SUCCESS MESSAGE
DO $$
BEGIN
  RAISE NOTICE '🎉 TEST DATA CREATED SUCCESSFULLY!';
  RAISE NOTICE '✅ Sample organizations, projects, and certificates created';
  RAISE NOTICE '✅ Test users added to organizations and projects';
  RAISE NOTICE '✅ Compliance requirements initialized';
  RAISE NOTICE '📋 Next: Run your application and test the flows!';
  RAISE NOTICE '📋 Check: Organizations table should have 3 records';
  RAISE NOTICE '📋 Check: Projects table should have 3 records';
  RAISE NOTICE '📋 Check: User_certificates table should have 4 records';
END $$;
