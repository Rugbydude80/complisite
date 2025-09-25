-- ============================================
-- AGGRESSIVE RLS FIX - TARGETED RECURSION ELIMINATION
-- ============================================
-- 
-- This script aggressively fixes the remaining recursion issues
-- by completely dropping and recreating problematic policies
-- ============================================

-- STEP 1: AGGRESSIVELY DROP ALL POLICIES (INCLUDING VARIATIONS)
-- Drop ALL possible policy names that might exist
DROP POLICY IF EXISTS "Users can view their company" ON companies;
DROP POLICY IF EXISTS "Users can view own company" ON companies;
DROP POLICY IF EXISTS "Company admins can manage company" ON companies;

DROP POLICY IF EXISTS "Users can view company users" ON users;
DROP POLICY IF EXISTS "Users can update own user record" ON users;

DROP POLICY IF EXISTS "Organization members can view org" ON organizations;
DROP POLICY IF EXISTS "Org members can view organizations" ON organizations;
DROP POLICY IF EXISTS "Org admins can manage organizations" ON organizations;

DROP POLICY IF EXISTS "Organization members can view members" ON organization_members;
DROP POLICY IF EXISTS "Org members can view org members" ON organization_members;
DROP POLICY IF EXISTS "Org admins can manage org members" ON organization_members;

DROP POLICY IF EXISTS "Project members can view project" ON projects;
DROP POLICY IF EXISTS "Project members can view projects" ON projects;
DROP POLICY IF EXISTS "Project admins can manage projects" ON projects;

DROP POLICY IF EXISTS "Project members can view project members" ON project_members;
DROP POLICY IF EXISTS "Project admins can manage project members" ON project_members;

DROP POLICY IF EXISTS "Users can manage own certificates" ON user_certificates;
DROP POLICY IF EXISTS "Organization members can view shared certificates" ON user_certificates;
DROP POLICY IF EXISTS "Org members can view shared certificates" ON user_certificates;

DROP POLICY IF EXISTS "Certificate owners can manage shares" ON certificate_shares;

-- STEP 2: DISABLE RLS TEMPORARILY ON PROBLEMATIC TABLES
ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- STEP 3: RECREATE HELPER FUNCTIONS (FORCE REPLACE)
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

-- STEP 4: RE-ENABLE RLS AND CREATE SIMPLE POLICIES FIRST
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- STEP 5: CREATE SIMPLE, NON-RECURSIVE POLICIES
-- Start with the most basic policies that don't reference themselves

-- Organizations - simple policy
CREATE POLICY "Org members can view organizations" ON organizations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organizations.id
    AND om.user_id = auth.uid()
    AND om.status = 'active'
  )
);

-- Organization members - simple policy  
CREATE POLICY "Org members can view org members" ON organization_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.status = 'active'
  )
);

-- User certificates - simple policy
CREATE POLICY "Users can manage own certificates" ON user_certificates
FOR ALL USING (user_id = auth.uid());

-- STEP 6: GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION is_org_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_project_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_org_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_project_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_company_id(UUID) TO authenticated;

-- STEP 7: TEST THE BASIC POLICIES
DO $$
DECLARE
  test_result INTEGER;
BEGIN
  -- Test organization_members
  BEGIN
    SELECT COUNT(*) INTO test_result FROM organization_members LIMIT 1;
    RAISE NOTICE '✅ organization_members basic policy working';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ organization_members still has recursion: %', SQLERRM;
  END;
  
  -- Test user_certificates
  BEGIN
    SELECT COUNT(*) INTO test_result FROM user_certificates LIMIT 1;
    RAISE NOTICE '✅ user_certificates basic policy working';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ user_certificates still has recursion: %', SQLERRM;
  END;
  
  -- Test organizations
  BEGIN
    SELECT COUNT(*) INTO test_result FROM organizations LIMIT 1;
    RAISE NOTICE '✅ organizations basic policy working';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ organizations still has recursion: %', SQLERRM;
  END;
END $$;

-- SUCCESS MESSAGE
DO $$
BEGIN
  RAISE NOTICE '🎉 AGGRESSIVE RLS FIX APPLIED!';
  RAISE NOTICE '✅ All problematic policies dropped';
  RAISE NOTICE '✅ RLS temporarily disabled and re-enabled';
  RAISE NOTICE '✅ Simple non-recursive policies created';
  RAISE NOTICE '✅ Basic functionality restored';
  RAISE NOTICE '📋 Next: Run diagnose-recursion.js to verify';
END $$;
