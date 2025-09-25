-- ============================================
-- CHECK CURRENT RLS POLICIES STATUS
-- ============================================
-- This script checks the current state of RLS policies
-- to identify which ones still have recursion issues
-- ============================================

-- Check if helper functions exist
SELECT 
  'Helper Functions Status' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_org_member') THEN '✅ is_org_member exists'
    ELSE '❌ is_org_member missing'
  END as status
UNION ALL
SELECT 
  'Helper Functions Status',
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_project_member') THEN '✅ is_project_member exists'
    ELSE '❌ is_project_member missing'
  END
UNION ALL
SELECT 
  'Helper Functions Status',
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_org_admin') THEN '✅ is_org_admin exists'
    ELSE '❌ is_org_admin missing'
  END;

-- Check current policies on organization_members
SELECT 
  'Organization Members Policies' as table_name,
  policyname,
  cmd,
  qual as policy_condition
FROM pg_policies 
WHERE tablename = 'organization_members'
ORDER BY policyname;

-- Check current policies on user_certificates  
SELECT 
  'User Certificates Policies' as table_name,
  policyname,
  cmd,
  qual as policy_condition
FROM pg_policies 
WHERE tablename = 'user_certificates'
ORDER BY policyname;

-- Check current policies on project_members
SELECT 
  'Project Members Policies' as table_name,
  policyname,
  cmd,
  qual as policy_condition
FROM pg_policies 
WHERE tablename = 'project_members'
ORDER BY policyname;

-- Test if we can query organization_members without recursion
DO $$
DECLARE
  test_result INTEGER;
BEGIN
  BEGIN
    SELECT COUNT(*) INTO test_result FROM organization_members LIMIT 1;
    RAISE NOTICE '✅ organization_members query successful (no recursion)';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ organization_members query failed: %', SQLERRM;
  END;
END $$;

-- Test if we can query user_certificates without recursion
DO $$
DECLARE
  test_result INTEGER;
BEGIN
  BEGIN
    SELECT COUNT(*) INTO test_result FROM user_certificates LIMIT 1;
    RAISE NOTICE '✅ user_certificates query successful (no recursion)';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ user_certificates query failed: %', SQLERRM;
  END;
END $$;
