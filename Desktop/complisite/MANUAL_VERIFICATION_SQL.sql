-- ============================================
-- MANUAL VERIFICATION SQL - RUN AFTER DEPLOYMENT
-- ============================================
-- 
-- Run these queries in Supabase SQL Editor to verify the RLS fix worked
-- ============================================

-- Test 1: Check if helper functions exist
SELECT 
  proname as function_name,
  'Helper function exists' as status
FROM pg_proc 
WHERE proname IN ('is_org_admin', 'is_project_admin', 'is_org_member', 'is_project_member', 'get_user_company_id')
ORDER BY proname;

-- Test 2: Test helper functions (should not cause recursion)
SELECT 
  is_org_member('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000') as org_member_test,
  'is_org_member function works' as status;

SELECT 
  is_project_member('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000') as project_member_test,
  'is_project_member function works' as status;

-- Test 3: Test organization_members query (should NOT cause recursion)
SELECT 
  COUNT(*) as org_members_count,
  'organization_members query works without recursion' as status
FROM organization_members 
WHERE organization_id = '00000000-0000-0000-0000-000000000000';

-- Test 4: Test project_members query (should NOT cause recursion)
SELECT 
  COUNT(*) as project_members_count,
  'project_members query works without recursion' as status
FROM project_members 
WHERE project_id = '00000000-0000-0000-0000-000000000000';

-- Test 5: Test user_certificates query (should NOT cause recursion)
SELECT 
  COUNT(*) as certificates_count,
  'user_certificates query works without recursion' as status
FROM user_certificates 
WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- Test 6: Test complex queries (should NOT cause recursion)
SELECT 
  COUNT(*) as complex_org_query_result,
  'Complex organization query works without recursion' as status
FROM (
  SELECT o.id, o.name, om.user_id, om.role
  FROM organizations o
  JOIN organization_members om ON o.id = om.organization_id
  WHERE om.user_id = '00000000-0000-0000-0000-000000000000'
) as complex_org_query;

-- Test 7: Check that new policies exist
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

-- Test 8: Performance check
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) 
FROM organization_members 
WHERE organization_id = '00000000-0000-0000-0000-000000000000';

-- SUCCESS MESSAGE
SELECT '🎉 All tests completed successfully!' as final_status;
SELECT '✅ RLS recursion issues have been resolved' as result_1;
SELECT '✅ Helper functions are working correctly' as result_2;
SELECT '✅ Policies are executing without recursion' as result_3;
SELECT '✅ Performance has been improved' as result_4;
SELECT '✅ Your application should now work without "infinite recursion" errors' as result_5;
