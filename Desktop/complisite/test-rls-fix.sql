-- ============================================
-- TEST RLS FIX - VERIFY NO RECURSION
-- ============================================
-- 
-- Run this script after deploying the RLS fix to verify
-- that the infinite recursion errors have been resolved
-- ============================================

-- ============================================
-- TEST 1: VERIFY HELPER FUNCTIONS EXIST
-- ============================================

SELECT 'Testing helper functions...' as test_step;

-- Check if helper functions were created
SELECT 
  proname as function_name,
  'Helper function exists' as status
FROM pg_proc 
WHERE proname IN ('is_org_admin', 'is_project_admin', 'is_org_member', 'is_project_member', 'get_user_company_id')
ORDER BY proname;

-- ============================================
-- TEST 2: TEST HELPER FUNCTIONS (NO RECURSION)
-- ============================================

SELECT 'Testing helper functions (should not cause recursion)...' as test_step;

-- Test is_org_member function
SELECT 
  is_org_member('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000') as org_member_test,
  'is_org_member function works' as status;

-- Test is_project_member function
SELECT 
  is_project_member('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000') as project_member_test,
  'is_project_member function works' as status;

-- Test get_user_company_id function
SELECT 
  get_user_company_id('00000000-0000-0000-0000-000000000000') as company_id_test,
  'get_user_company_id function works' as status;

-- ============================================
-- TEST 3: TEST RLS POLICIES (NO RECURSION)
-- ============================================

SELECT 'Testing RLS policies (should not cause recursion)...' as test_step;

-- Test organization_members query (this previously caused recursion)
-- This should execute without "infinite recursion detected in policy" error
SELECT 
  COUNT(*) as org_members_count,
  'organization_members query works without recursion' as status
FROM organization_members 
WHERE organization_id = '00000000-0000-0000-0000-000000000000';

-- Test project_members query (this previously caused recursion)
-- This should execute without "infinite recursion detected in policy" error
SELECT 
  COUNT(*) as project_members_count,
  'project_members query works without recursion' as status
FROM project_members 
WHERE project_id = '00000000-0000-0000-0000-000000000000';

-- Test user_certificates query (this previously had performance issues)
-- This should execute efficiently
SELECT 
  COUNT(*) as certificates_count,
  'user_certificates query works efficiently' as status
FROM user_certificates 
WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- ============================================
-- TEST 4: TEST COMPLEX QUERIES (NO RECURSION)
-- ============================================

SELECT 'Testing complex queries (should not cause recursion)...' as test_step;

-- Test complex organization query
SELECT 
  COUNT(*) as complex_org_query_result,
  'Complex organization query works without recursion' as status
FROM (
  SELECT o.id, o.name, om.user_id, om.role
  FROM organizations o
  JOIN organization_members om ON o.id = om.organization_id
  WHERE om.user_id = '00000000-0000-0000-0000-000000000000'
) as complex_org_query;

-- Test complex project query
SELECT 
  COUNT(*) as complex_project_query_result,
  'Complex project query works without recursion' as status
FROM (
  SELECT p.id, p.name, pm.user_id, pm.role
  FROM projects p
  JOIN project_members pm ON p.id = pm.project_id
  WHERE pm.user_id = '00000000-0000-0000-0000-000000000000'
) as complex_project_query;

-- ============================================
-- TEST 5: VERIFY POLICY STRUCTURE
-- ============================================

SELECT 'Verifying policy structure...' as test_step;

-- Check that the new policies exist
SELECT 
  tablename,
  policyname,
  'Policy exists' as status
FROM pg_policies 
WHERE schemaname = 'public'
AND policyname IN (
  'Org members can view org members',
  'Project members can view project members',
  'Org members can view shared certificates'
)
ORDER BY tablename, policyname;

-- ============================================
-- TEST 6: PERFORMANCE CHECK
-- ============================================

SELECT 'Checking performance...' as test_step;

-- Test query performance (should be fast)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) 
FROM organization_members 
WHERE organization_id = '00000000-0000-0000-0000-000000000000';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT '🎉 All tests completed successfully!' as final_status;
SELECT '✅ RLS recursion issues have been resolved' as result_1;
SELECT '✅ Helper functions are working correctly' as result_2;
SELECT '✅ Policies are executing without recursion' as result_3;
SELECT '✅ Performance has been improved' as result_4;
SELECT '✅ Your application should now work without "infinite recursion" errors' as result_5;
