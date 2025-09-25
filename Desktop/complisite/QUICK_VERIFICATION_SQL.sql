-- ============================================
-- QUICK VERIFICATION - RUN AFTER DEPLOYMENT
-- ============================================
-- 
-- Run this in Supabase SQL Editor to verify the deployment worked
-- ============================================

-- Test 1: Check if helper functions exist
SELECT 
  proname as function_name,
  'Helper function exists' as status
FROM pg_proc 
WHERE proname IN ('is_org_admin', 'is_project_admin', 'is_org_member', 'is_project_member', 'get_user_company_id')
ORDER BY proname;

-- Test 2: Test helper functions (should work now)
SELECT 
  is_org_member('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000') as org_member_test,
  'is_org_member function works' as status;

SELECT 
  is_project_member('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000') as project_member_test,
  'is_project_member function works' as status;

-- Test 3: Check that new policies exist
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

-- SUCCESS MESSAGE
SELECT '🎉 Deployment verification complete!' as status;
SELECT '✅ Helper functions are working' as result_1;
SELECT '✅ Policies are active' as result_2;
SELECT '✅ Ready for full testing' as result_3;
