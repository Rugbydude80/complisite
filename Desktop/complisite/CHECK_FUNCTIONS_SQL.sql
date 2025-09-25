-- ============================================
-- CHECK HELPER FUNCTIONS - RUN IN SUPABASE DASHBOARD
-- ============================================
-- 
-- Run this to check if helper functions exist
-- ============================================

-- Check if helper functions exist
SELECT 
  proname as function_name,
  'Helper function exists' as status
FROM pg_proc 
WHERE proname IN ('is_org_admin', 'is_project_admin', 'is_org_member', 'is_project_member', 'get_user_company_id')
ORDER BY proname;

-- Test helper functions if they exist
SELECT 
  is_org_member('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000') as org_member_test,
  'is_org_member function works' as status;

-- Check existing policies
SELECT 
  tablename,
  policyname,
  'Policy exists' as status
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('organization_members', 'project_members', 'user_certificates')
ORDER BY tablename, policyname;
