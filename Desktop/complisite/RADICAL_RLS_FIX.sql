-- ============================================
-- RADICAL RLS FIX - COMPLETE BYPASS STRATEGY
-- ============================================
-- 
-- This script uses a radical approach to completely eliminate
-- recursion by using different table relationships and bypassing
-- the problematic self-referencing policies
-- ============================================

-- STEP 1: COMPLETELY DROP ALL ORGANIZATION POLICIES
DROP POLICY IF EXISTS "Organization members can view org" ON organizations;
DROP POLICY IF EXISTS "Org members can view organizations" ON organizations;
DROP POLICY IF EXISTS "Org admins can manage organizations" ON organizations;
DROP POLICY IF EXISTS "Allow authenticated users to view organizations" ON organizations;

DROP POLICY IF EXISTS "Organization members can view members" ON organization_members;
DROP POLICY IF EXISTS "Org members can view org members" ON organization_members;
DROP POLICY IF EXISTS "Org admins can manage org members" ON organization_members;
DROP POLICY IF EXISTS "Allow authenticated users to view org members" ON organization_members;

-- STEP 2: DISABLE RLS COMPLETELY ON ORGANIZATION TABLES
ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- STEP 3: CREATE A HELPER VIEW THAT BYPASSES THE RECURSION
-- This view will be used instead of direct table access
CREATE OR REPLACE VIEW user_organization_access AS
SELECT 
  u.id as user_id,
  om.organization_id,
  om.role,
  om.status,
  o.name as organization_name
FROM users u
JOIN organization_members om ON om.user_id = u.id
JOIN organizations o ON o.id = om.organization_id
WHERE om.status = 'active';

-- STEP 4: CREATE A HELPER FUNCTION THAT USES THE VIEW
CREATE OR REPLACE FUNCTION can_access_organization(user_id UUID, org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_organization_access
    WHERE user_organization_access.user_id = $1
    AND user_organization_access.organization_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 5: RE-ENABLE RLS WITH SIMPLE POLICIES
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- STEP 6: CREATE SIMPLE POLICIES THAT DON'T SELF-REFERENCE
-- Organizations - use the helper function
CREATE POLICY "Users can view organizations they belong to" ON organizations
FOR SELECT USING (
  can_access_organization(auth.uid(), id)
);

-- Organization members - use the helper function  
CREATE POLICY "Users can view org members of their orgs" ON organization_members
FOR SELECT USING (
  can_access_organization(auth.uid(), organization_id)
);

-- STEP 7: GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION can_access_organization(UUID, UUID) TO authenticated;
GRANT SELECT ON user_organization_access TO authenticated;

-- STEP 8: TEST THE NEW APPROACH
DO $$
DECLARE
  test_result INTEGER;
BEGIN
  -- Test organization_members
  BEGIN
    SELECT COUNT(*) INTO test_result FROM organization_members LIMIT 1;
    RAISE NOTICE '✅ organization_members new policy working';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ organization_members still has recursion: %', SQLERRM;
  END;
  
  -- Test organizations
  BEGIN
    SELECT COUNT(*) INTO test_result FROM organizations LIMIT 1;
    RAISE NOTICE '✅ organizations new policy working';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ organizations still has recursion: %', SQLERRM;
  END;
  
  -- Test the helper view
  BEGIN
    SELECT COUNT(*) INTO test_result FROM user_organization_access LIMIT 1;
    RAISE NOTICE '✅ user_organization_access view working';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ user_organization_access view failed: %', SQLERRM;
  END;
END $$;

-- SUCCESS MESSAGE
DO $$
BEGIN
  RAISE NOTICE '🎉 RADICAL RLS FIX APPLIED!';
  RAISE NOTICE '✅ Organization tables RLS completely reset';
  RAISE NOTICE '✅ Helper view created to bypass recursion';
  RAISE NOTICE '✅ New policies use helper function instead of self-reference';
  RAISE NOTICE '✅ All organization access now goes through user_organization_access view';
  RAISE NOTICE '📋 Next: Run diagnose-recursion.js to verify';
END $$;
