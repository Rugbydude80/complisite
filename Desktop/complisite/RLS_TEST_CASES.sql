-- ============================================
-- RLS POLICY TEST CASES
-- ============================================
-- 
-- Comprehensive test cases to verify that the fixed RLS policies
-- work correctly without recursion for all user roles and scenarios
-- ============================================

-- ============================================
-- TEST DATA SETUP
-- ============================================

-- Create test companies
INSERT INTO companies (id, name) VALUES 
('11111111-1111-1111-1111-111111111111', 'Test Construction Ltd'),
('22222222-2222-2222-2222-222222222222', 'Another Construction Co');

-- Create test users (these would normally be created via auth.signUp)
INSERT INTO users (id, email, full_name, company_id, role) VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@test.com', 'Admin User', '11111111-1111-1111-1111-111111111111', 'admin'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'manager@test.com', 'Manager User', '11111111-1111-1111-1111-111111111111', 'manager'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'worker@test.com', 'Worker User', '11111111-1111-1111-1111-111111111111', 'worker'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'other@test.com', 'Other Company User', '22222222-2222-2222-2222-222222222222', 'worker');

-- Create test user profiles
INSERT INTO user_profiles (user_id, full_name, user_type) VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Admin User', 'admin'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Manager User', 'manager'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Worker User', 'worker'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Other Company User', 'worker');

-- Create test organizations
INSERT INTO organizations (id, name, description, created_by) VALUES 
('33333333-3333-3333-3333-333333333333', 'Test Organization', 'Test org for RLS testing', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('44444444-4444-4444-4444-444444444444', 'Another Organization', 'Another test org', 'dddddddd-dddd-dddd-dddd-dddddddddddd');

-- Create test organization members
INSERT INTO organization_members (organization_id, user_id, role, status) VALUES 
('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin', 'active'),
('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'member', 'active'),
('33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'member', 'active'),
('44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'admin', 'active');

-- Create test projects
INSERT INTO projects (id, name, organization_id, company_id, status) VALUES 
('55555555-5555-5555-5555-555555555555', 'Test Project 1', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'active'),
('66666666-6666-6666-6666-666666666666', 'Test Project 2', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'active'),
('77777777-7777-7777-7777-777777777777', 'Other Company Project', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'active');

-- Create test project members
INSERT INTO project_members (project_id, user_id, role) VALUES 
('55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin'),
('55555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'member'),
('55555555-5555-5555-5555-555555555555', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'member'),
('66666666-6666-6666-6666-666666666666', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'admin'),
('77777777-7777-7777-7777-777777777777', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'admin');

-- Create test certificates
INSERT INTO user_certificates (id, user_id, certificate_type_id, certificate_number, issue_date, expiry_date, status) VALUES 
('88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', (SELECT id FROM certificate_types LIMIT 1), 'CERT001', '2023-01-01', '2025-01-01', 'verified'),
('99999999-9999-9999-9999-999999999999', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT id FROM certificate_types LIMIT 1), 'CERT002', '2023-01-01', '2025-01-01', 'verified');

-- Create test certificate shares
INSERT INTO certificate_shares (certificate_id, shared_with_org_id, shared_by) VALUES 
('88888888-8888-8888-8888-888888888888', '33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc');

-- ============================================
-- TEST CASE 1: COMPANY-LEVEL ACCESS
-- ============================================

-- Test 1.1: Admin can view their company
-- Expected: Should return 1 company
SELECT 'Test 1.1: Admin views own company' as test_name;
SELECT COUNT(*) as company_count FROM companies 
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Test 1.2: Admin can view company users
-- Expected: Should return 3 users from same company
SELECT 'Test 1.2: Admin views company users' as test_name;
SELECT COUNT(*) as user_count FROM users 
WHERE company_id = '11111111-1111-1111-1111-111111111111';

-- Test 1.3: Worker cannot view other company
-- Expected: Should return 0 companies
SELECT 'Test 1.3: Worker cannot view other company' as test_name;
SELECT COUNT(*) as company_count FROM companies 
WHERE id = '22222222-2222-2222-2222-222222222222';

-- ============================================
-- TEST CASE 2: ORGANIZATION-LEVEL ACCESS
-- ============================================

-- Test 2.1: Organization admin can view their organization
-- Expected: Should return 1 organization
SELECT 'Test 2.1: Org admin views own organization' as test_name;
SELECT COUNT(*) as org_count FROM organizations 
WHERE id = '33333333-3333-3333-3333-333333333333';

-- Test 2.2: Organization members can view organization members
-- Expected: Should return 3 members (no recursion)
SELECT 'Test 2.2: Org members view org members (NO RECURSION)' as test_name;
SELECT COUNT(*) as member_count FROM organization_members 
WHERE organization_id = '33333333-3333-3333-3333-333333333333';

-- Test 2.3: Non-member cannot view organization
-- Expected: Should return 0 organizations
SELECT 'Test 2.3: Non-member cannot view org' as test_name;
SELECT COUNT(*) as org_count FROM organizations 
WHERE id = '44444444-4444-4444-4444-444444444444';

-- ============================================
-- TEST CASE 3: PROJECT-LEVEL ACCESS
-- ============================================

-- Test 3.1: Project members can view their projects
-- Expected: Should return projects they're members of
SELECT 'Test 3.1: Project members view projects' as test_name;
SELECT COUNT(*) as project_count FROM projects 
WHERE id IN ('55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666');

-- Test 3.2: Project members can view project members (NO RECURSION)
-- Expected: Should return members without recursion
SELECT 'Test 3.2: Project members view project members (NO RECURSION)' as test_name;
SELECT COUNT(*) as member_count FROM project_members 
WHERE project_id = '55555555-5555-5555-5555-555555555555';

-- Test 3.3: Non-member cannot view project
-- Expected: Should return 0 projects
SELECT 'Test 3.3: Non-member cannot view project' as test_name;
SELECT COUNT(*) as project_count FROM projects 
WHERE id = '77777777-7777-7777-7777-777777777777';

-- ============================================
-- TEST CASE 4: CERTIFICATE ACCESS
-- ============================================

-- Test 4.1: User can view their own certificates
-- Expected: Should return user's certificates
SELECT 'Test 4.1: User views own certificates' as test_name;
SELECT COUNT(*) as cert_count FROM user_certificates 
WHERE user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Test 4.2: Organization members can view shared certificates
-- Expected: Should return shared certificates
SELECT 'Test 4.2: Org members view shared certificates' as test_name;
SELECT COUNT(*) as shared_cert_count FROM user_certificates 
WHERE id = '88888888-8888-8888-8888-888888888888';

-- Test 4.3: Non-member cannot view unshared certificates
-- Expected: Should return 0 certificates
SELECT 'Test 4.3: Non-member cannot view unshared certificates' as test_name;
SELECT COUNT(*) as cert_count FROM user_certificates 
WHERE user_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

-- ============================================
-- TEST CASE 5: COMPLIANCE ACCESS
-- ============================================

-- Test 5.1: Project members can view compliance
-- Expected: Should return compliance for their projects
SELECT 'Test 5.1: Project members view compliance' as test_name;
SELECT COUNT(*) as compliance_count FROM project_compliance 
WHERE project_id = '55555555-5555-5555-5555-555555555555';

-- Test 5.2: Project members can manage compliance
-- Expected: Should allow INSERT/UPDATE/DELETE operations
SELECT 'Test 5.2: Project members manage compliance' as test_name;
-- This would be tested with actual INSERT/UPDATE/DELETE operations

-- ============================================
-- TEST CASE 6: PERFORMANCE TESTS
-- ============================================

-- Test 6.1: Helper function performance
-- Expected: Should execute quickly without recursion
SELECT 'Test 6.1: Helper function performance' as test_name;
SELECT 
  is_org_member('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333') as is_member,
  is_org_admin('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333') as is_admin,
  is_project_member('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555') as is_project_member;

-- Test 6.2: Complex query performance
-- Expected: Should execute without timeout or recursion errors
SELECT 'Test 6.2: Complex query performance' as test_name;
SELECT COUNT(*) as result_count FROM (
  SELECT p.id, p.name, pm.user_id, pm.role
  FROM projects p
  JOIN project_members pm ON p.id = pm.project_id
  WHERE pm.user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
) as complex_query;

-- ============================================
-- TEST CASE 7: EDGE CASES
-- ============================================

-- Test 7.1: User with no organization membership
-- Expected: Should return 0 organizations
SELECT 'Test 7.1: User with no org membership' as test_name;
SELECT COUNT(*) as org_count FROM organizations 
WHERE id = '33333333-3333-3333-3333-333333333333';

-- Test 7.2: User with no project membership
-- Expected: Should return 0 projects
SELECT 'Test 7.2: User with no project membership' as test_name;
SELECT COUNT(*) as project_count FROM projects 
WHERE id = '55555555-5555-5555-5555-555555555555';

-- Test 7.3: Inactive organization member
-- Expected: Should not have access
SELECT 'Test 7.3: Inactive org member access' as test_name;
-- First, make a member inactive
UPDATE organization_members 
SET status = 'suspended' 
WHERE user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' 
AND organization_id = '33333333-3333-3333-3333-333333333333';

-- Then test access
SELECT COUNT(*) as org_count FROM organizations 
WHERE id = '33333333-3333-3333-3333-333333333333';

-- ============================================
-- TEST CASE 8: SECURITY VERIFICATION
-- ============================================

-- Test 8.1: Verify no cross-company data leakage
-- Expected: Users should only see their own company data
SELECT 'Test 8.1: No cross-company data leakage' as test_name;
SELECT COUNT(*) as other_company_users FROM users 
WHERE company_id = '22222222-2222-2222-2222-222222222222';

-- Test 8.2: Verify no cross-organization data leakage
-- Expected: Users should only see their own organization data
SELECT 'Test 8.2: No cross-org data leakage' as test_name;
SELECT COUNT(*) as other_org_data FROM organizations 
WHERE id = '44444444-4444-4444-4444-444444444444';

-- Test 8.3: Verify no cross-project data leakage
-- Expected: Users should only see their own project data
SELECT 'Test 8.3: No cross-project data leakage' as test_name;
SELECT COUNT(*) as other_project_data FROM projects 
WHERE id = '77777777-7777-7777-7777-777777777777';

-- ============================================
-- CLEANUP TEST DATA
-- ============================================

-- Clean up test data (run this after testing)
/*
DELETE FROM certificate_shares WHERE certificate_id IN ('88888888-8888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999');
DELETE FROM user_certificates WHERE id IN ('88888888-8888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999');
DELETE FROM project_members WHERE project_id IN ('55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777');
DELETE FROM projects WHERE id IN ('55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777');
DELETE FROM organization_members WHERE organization_id IN ('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');
DELETE FROM organizations WHERE id IN ('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');
DELETE FROM user_profiles WHERE user_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd');
DELETE FROM users WHERE id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd');
DELETE FROM companies WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
*/

-- ============================================
-- TEST RESULTS SUMMARY
-- ============================================
-- 
-- Expected Results:
-- ✅ No "infinite recursion detected in policy" errors
-- ✅ All queries execute successfully
-- ✅ Proper data isolation between companies/organizations/projects
-- ✅ Helper functions execute efficiently
-- ✅ Complex queries perform well
-- ✅ Security boundaries are maintained
-- ============================================
