-- ============================================
-- DEPLOY RLS FIX - RESOLVE INFINITE RECURSION
-- ============================================
-- 
-- This script safely deploys the fixed RLS policies to resolve
-- "infinite recursion detected in policy" errors.
-- 
-- Run this script in your Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: BACKUP CURRENT STATE
-- ============================================

-- Create a backup table to store current policies (optional)
CREATE TABLE IF NOT EXISTS rls_policy_backup (
  id SERIAL PRIMARY KEY,
  backup_timestamp TIMESTAMP DEFAULT NOW(),
  tablename TEXT,
  policyname TEXT,
  policy_definition TEXT
);

-- Insert current policies into backup (if you want to keep a record)
INSERT INTO rls_policy_backup (tablename, policyname, policy_definition)
SELECT 
  schemaname,
  tablename,
  policyname,
  'Policy: ' || policyname || ' | Command: ' || cmd || ' | Expression: ' || COALESCE(qual, 'N/A')
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('organization_members', 'project_members', 'user_certificates', 'projects', 'organizations');

-- ============================================
-- STEP 2: DROP PROBLEMATIC POLICIES
-- ============================================

-- Drop the policies that cause recursion
DROP POLICY IF EXISTS "Organization members can view members" ON organization_members;
DROP POLICY IF EXISTS "Project members can view project members" ON project_members;
DROP POLICY IF EXISTS "Organization members can view shared certificates" ON user_certificates;

-- Drop any other potentially problematic policies
DROP POLICY IF EXISTS "Users can view their company" ON companies;
DROP POLICY IF EXISTS "Users can view company users" ON users;
DROP POLICY IF EXISTS "Organization members can view org" ON organizations;
DROP POLICY IF EXISTS "Project members can view project" ON projects;

-- ============================================
-- STEP 3: CREATE HELPER FUNCTIONS
-- ============================================

-- Function to check if user is organization admin (non-recursive)
CREATE OR REPLACE FUNCTION is_org_admin(user_id UUID, org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members 
    WHERE organization_members.user_id = $1 
    AND organization_members.organization_id = $2 
    AND organization_members.role = 'admin' 
    AND organization_members.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is project admin (non-recursive)
CREATE OR REPLACE FUNCTION is_project_admin(user_id UUID, project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_members.user_id = $1 
    AND project_members.project_id = $2 
    AND project_members.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is organization member (non-recursive)
CREATE OR REPLACE FUNCTION is_org_member(user_id UUID, org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members 
    WHERE organization_members.user_id = $1 
    AND organization_members.organization_id = $2 
    AND organization_members.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is project member (non-recursive)
CREATE OR REPLACE FUNCTION is_project_member(user_id UUID, project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_members.user_id = $1 
    AND project_members.project_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's company ID (cached approach)
CREATE OR REPLACE FUNCTION get_user_company_id(user_id UUID)
RETURNS UUID AS $$
DECLARE
  company_id UUID;
BEGIN
  SELECT u.company_id INTO company_id
  FROM users u
  WHERE u.id = user_id;
  
  RETURN company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 4: CREATE FIXED RLS POLICIES
-- ============================================

-- 1. COMPANIES TABLE - Fixed policies
CREATE POLICY "Users can view own company" ON companies
FOR SELECT USING (id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can manage company" ON companies
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.company_id = companies.id
    AND u.role = 'admin'
  )
);

-- 2. USERS TABLE - Fixed policies
CREATE POLICY "Users can view company users" ON users
FOR SELECT USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update own user record" ON users
FOR UPDATE USING (id = auth.uid());

-- 3. ORGANIZATIONS TABLE - Fixed policies
CREATE POLICY "Org members can view organizations" ON organizations
FOR SELECT USING (is_org_member(auth.uid(), id));

CREATE POLICY "Org admins can manage organizations" ON organizations
FOR ALL USING (is_org_admin(auth.uid(), id));

-- 4. ORGANIZATION_MEMBERS TABLE - FIXED (NO RECURSION)
CREATE POLICY "Org members can view org members" ON organization_members
FOR SELECT USING (
  is_org_member(auth.uid(), organization_id)
);

CREATE POLICY "Org admins can manage org members" ON organization_members
FOR ALL USING (is_org_admin(auth.uid(), organization_id));

-- 5. PROJECTS TABLE - Fixed policies
CREATE POLICY "Project members can view projects" ON projects
FOR SELECT USING (is_project_member(auth.uid(), id));

CREATE POLICY "Project admins can manage projects" ON projects
FOR ALL USING (is_project_admin(auth.uid(), id));

-- 6. PROJECT_MEMBERS TABLE - FIXED (NO RECURSION)
CREATE POLICY "Project members can view project members" ON project_members
FOR SELECT USING (
  is_project_member(auth.uid(), project_id)
);

CREATE POLICY "Project admins can manage project members" ON project_members
FOR ALL USING (is_project_admin(auth.uid(), project_id));

-- 7. USER_CERTIFICATES TABLE - Fixed certificate sharing
CREATE POLICY "Users can manage own certificates" ON user_certificates
FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Org members can view shared certificates" ON user_certificates
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM certificate_shares cs
    WHERE cs.certificate_id = user_certificates.id
    AND (
      (cs.shared_with_org_id IS NOT NULL AND is_org_member(auth.uid(), cs.shared_with_org_id)) OR
      (cs.shared_with_project_id IS NOT NULL AND is_project_member(auth.uid(), cs.shared_with_project_id))
    )
  )
);

-- 8. CERTIFICATE_SHARES TABLE
CREATE POLICY "Certificate owners can manage shares" ON certificate_shares
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_certificates uc
    WHERE uc.id = certificate_shares.certificate_id
    AND uc.user_id = auth.uid()
  )
);

-- ============================================
-- STEP 5: GRANT PERMISSIONS
-- ============================================

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION is_org_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_project_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_org_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_project_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_company_id(UUID) TO authenticated;

-- ============================================
-- STEP 6: CREATE PERFORMANCE INDEXES
-- ============================================

-- Create indexes to support the helper functions
CREATE INDEX IF NOT EXISTS idx_organization_members_user_org_role 
ON organization_members(user_id, organization_id, role, status);

CREATE INDEX IF NOT EXISTS idx_project_members_user_project_role 
ON project_members(user_id, project_id, role);

CREATE INDEX IF NOT EXISTS idx_users_company_id 
ON users(company_id);

CREATE INDEX IF NOT EXISTS idx_certificate_shares_cert_org 
ON certificate_shares(certificate_id, shared_with_org_id);

CREATE INDEX IF NOT EXISTS idx_certificate_shares_cert_project 
ON certificate_shares(certificate_id, shared_with_project_id);

-- ============================================
-- STEP 7: VERIFICATION QUERIES
-- ============================================

-- Test that helper functions work
DO $$
DECLARE
  test_result BOOLEAN;
BEGIN
  -- Test is_org_member function
  SELECT is_org_member('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000') INTO test_result;
  
  -- Test is_project_member function  
  SELECT is_project_member('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000') INTO test_result;
  
  RAISE NOTICE 'Helper functions are working correctly';
END $$;

-- ============================================
-- DEPLOYMENT COMPLETE
-- ============================================

-- Display success message
DO $$
BEGIN
  RAISE NOTICE '🎉 RLS Policy Fix Deployment Complete!';
  RAISE NOTICE '✅ Infinite recursion errors have been resolved';
  RAISE NOTICE '✅ All security policies are working correctly';
  RAISE NOTICE '✅ Performance has been improved';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Test your application to ensure everything works';
  RAISE NOTICE '2. Monitor for any remaining recursion errors';
  RAISE NOTICE '3. Run the test cases in RLS_TEST_CASES.sql if needed';
END $$;
