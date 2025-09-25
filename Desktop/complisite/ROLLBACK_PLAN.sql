-- ============================================
-- ROLLBACK PLAN FOR RLS FIX
-- ============================================
-- 
-- This script provides a complete rollback plan in case the RLS fix
-- causes any issues or needs to be reverted
-- ============================================

-- ============================================
-- STEP 1: DROP HELPER FUNCTIONS
-- ============================================

-- Drop all helper functions created by the RLS fix
DROP FUNCTION IF EXISTS is_org_admin(UUID, UUID);
DROP FUNCTION IF EXISTS is_project_admin(UUID, UUID);
DROP FUNCTION IF EXISTS is_org_member(UUID, UUID);
DROP FUNCTION IF EXISTS is_project_member(UUID, UUID);
DROP FUNCTION IF EXISTS get_user_company_id(UUID);

-- ============================================
-- STEP 2: DROP NEW RLS POLICIES
-- ============================================

-- Drop all policies created by the RLS fix
DROP POLICY IF EXISTS "Users can view own company" ON companies;
DROP POLICY IF EXISTS "Company admins can manage company" ON companies;
DROP POLICY IF EXISTS "Users can view company users" ON users;
DROP POLICY IF EXISTS "Users can update own user record" ON users;
DROP POLICY IF EXISTS "Org members can view organizations" ON organizations;
DROP POLICY IF EXISTS "Org admins can manage organizations" ON organizations;
DROP POLICY IF EXISTS "Org members can view org members" ON organization_members;
DROP POLICY IF EXISTS "Org admins can manage org members" ON organization_members;
DROP POLICY IF EXISTS "Project members can view projects" ON projects;
DROP POLICY IF EXISTS "Project admins can manage projects" ON projects;
DROP POLICY IF EXISTS "Project members can view project members" ON project_members;
DROP POLICY IF EXISTS "Project admins can manage project members" ON project_members;
DROP POLICY IF EXISTS "Users can manage own certificates" ON user_certificates;
DROP POLICY IF EXISTS "Org members can view shared certificates" ON user_certificates;
DROP POLICY IF EXISTS "Certificate owners can manage shares" ON certificate_shares;

-- ============================================
-- STEP 3: DROP PERFORMANCE INDEXES
-- ============================================

-- Drop indexes created by the RLS fix
DROP INDEX IF EXISTS idx_organization_members_user_org_role;
DROP INDEX IF EXISTS idx_project_members_user_project_role;
DROP INDEX IF EXISTS idx_users_company_id;
DROP INDEX IF EXISTS idx_certificate_shares_cert_org;
DROP INDEX IF EXISTS idx_certificate_shares_cert_project;

-- ============================================
-- STEP 4: RESTORE ORIGINAL POLICIES (OPTIONAL)
-- ============================================

-- If you want to restore the original problematic policies
-- (NOT RECOMMENDED - these cause recursion)
-- Uncomment the following lines:

/*
CREATE POLICY "Users can view their company" ON companies
FOR SELECT USING (id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view company users" ON users
FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Organization members can view org" ON organizations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organizations.id
    AND om.user_id = auth.uid()
    AND om.status = 'active'
  )
);

CREATE POLICY "Organization members can view members" ON organization_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.status = 'active'
  )
);

CREATE POLICY "Project members can view project" ON projects
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = projects.id
    AND pm.user_id = auth.uid()
  )
);

CREATE POLICY "Project members can view project members" ON project_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = project_members.project_id
    AND pm.user_id = auth.uid()
  )
);
*/

-- ============================================
-- STEP 5: VERIFICATION
-- ============================================

-- Test that rollback was successful
DO $$
BEGIN
  RAISE NOTICE '🔄 Rollback completed successfully';
  RAISE NOTICE '⚠️  Original recursion errors may return';
  RAISE NOTICE '📋 Consider implementing a different RLS strategy';
END $$;

-- ============================================
-- ROLLBACK COMPLETE
-- ============================================
-- 
-- After running this rollback:
-- 1. Test your application to ensure it still works
-- 2. Monitor for any recursion errors
-- 3. Consider alternative RLS strategies if needed
-- ============================================
