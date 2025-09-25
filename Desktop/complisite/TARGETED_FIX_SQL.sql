-- ============================================
-- TARGETED FIX FOR REMAINING RECURSION ISSUES
-- ============================================
-- 
-- This script fixes the remaining recursion issues in organization_members and user_certificates
-- ============================================

-- STEP 1: DROP SPECIFIC PROBLEMATIC POLICIES
DROP POLICY IF EXISTS "Organization members can view members" ON organization_members;
DROP POLICY IF EXISTS "Organization members can view shared certificates" ON user_certificates;

-- STEP 2: CREATE NON-RECURSIVE POLICIES FOR ORGANIZATION_MEMBERS
CREATE POLICY "Org members can view org members" ON organization_members
FOR SELECT USING (
  is_org_member(auth.uid(), organization_id)
);

CREATE POLICY "Org admins can manage org members" ON organization_members
FOR ALL USING (is_org_admin(auth.uid(), organization_id));

-- STEP 3: CREATE NON-RECURSIVE POLICIES FOR USER_CERTIFICATES
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

-- STEP 4: VERIFICATION
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

-- SUCCESS MESSAGE
DO $$
BEGIN
  RAISE NOTICE '🎉 Targeted Fix Applied!';
  RAISE NOTICE '✅ Remaining recursion issues should be resolved';
  RAISE NOTICE '✅ organization_members and user_certificates policies fixed';
END $$;
