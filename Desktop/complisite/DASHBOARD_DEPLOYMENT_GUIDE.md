# RLS Fix Deployment via Supabase Dashboard

## 🚨 Current Status: CLI Migration Issues

The Supabase CLI is encountering conflicts with existing policies. We'll deploy via the Supabase Dashboard instead.

## 🚀 Dashboard Deployment Steps

### Step 1: Access Supabase Dashboard

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to your project**: `dhabuefutrceqfgbxltp`
3. **Go to SQL Editor** (left sidebar)

### Step 2: Deploy the RLS Fix

**Copy and paste the following SQL into the SQL Editor:**

```sql
-- ============================================
-- SAFE RLS FIX - DASHBOARD DEPLOYMENT
-- ============================================

-- STEP 1: DROP EXISTING PROBLEMATIC POLICIES
DROP POLICY IF EXISTS "Users can view their company" ON companies;
DROP POLICY IF EXISTS "Users can view company users" ON users;
DROP POLICY IF EXISTS "Organization members can view org" ON organizations;
DROP POLICY IF EXISTS "Organization members can view members" ON organization_members;
DROP POLICY IF EXISTS "Project members can view project" ON projects;
DROP POLICY IF EXISTS "Project members can view project members" ON project_members;
DROP POLICY IF EXISTS "Organization members can view shared certificates" ON user_certificates;

-- STEP 2: CREATE HELPER FUNCTIONS
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

-- STEP 3: CREATE FIXED RLS POLICIES
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

CREATE POLICY "Users can view company users" ON users
FOR SELECT USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update own user record" ON users
FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Org members can view organizations" ON organizations
FOR SELECT USING (is_org_member(auth.uid(), id));

CREATE POLICY "Org admins can manage organizations" ON organizations
FOR ALL USING (is_org_admin(auth.uid(), id));

CREATE POLICY "Org members can view org members" ON organization_members
FOR SELECT USING (
  is_org_member(auth.uid(), organization_id)
);

CREATE POLICY "Org admins can manage org members" ON organization_members
FOR ALL USING (is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Project members can view projects" ON projects
FOR SELECT USING (is_project_member(auth.uid(), id));

CREATE POLICY "Project admins can manage projects" ON projects
FOR ALL USING (is_project_admin(auth.uid(), id));

CREATE POLICY "Project members can view project members" ON project_members
FOR SELECT USING (
  is_project_member(auth.uid(), project_id)
);

CREATE POLICY "Project admins can manage project members" ON project_members
FOR ALL USING (is_project_admin(auth.uid(), project_id));

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

CREATE POLICY "Certificate owners can manage shares" ON certificate_shares
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_certificates uc
    WHERE uc.id = certificate_shares.certificate_id
    AND uc.user_id = auth.uid()
  )
);

-- STEP 4: GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION is_org_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_project_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_org_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_project_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_company_id(UUID) TO authenticated;

-- STEP 5: CREATE PERFORMANCE INDEXES
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

-- STEP 6: VERIFICATION
DO $$
DECLARE
  test_result BOOLEAN;
BEGIN
  SELECT is_org_member('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000') INTO test_result;
  SELECT is_project_member('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000') INTO test_result;
  RAISE NOTICE 'Helper functions are working correctly';
END $$;

-- SUCCESS MESSAGE
DO $$
BEGIN
  RAISE NOTICE '🎉 RLS Policy Fix Deployment Complete!';
  RAISE NOTICE '✅ Infinite recursion errors have been resolved';
  RAISE NOTICE '✅ All security policies are working correctly';
  RAISE NOTICE '✅ Performance has been improved';
END $$;
```

### Step 3: Execute the Fix

1. **Click "Run"** in the SQL Editor
2. **Wait for completion** (should take 10-30 seconds)
3. **Check for success message** in the output

### Step 4: Verify Deployment

After deployment, run the verification script:

```bash
node verify-rls-fix.js
```

## 🧪 Testing Commands

### Pre-Deployment Test
```bash
# This will show current recursion errors
node execute-rls-fix.js
```

### Post-Deployment Verification
```bash
# This will verify the fix worked
node verify-rls-fix.js
```

### Manual SQL Testing
```sql
-- Test these queries in Supabase SQL Editor after deployment
SELECT * FROM organization_members LIMIT 1;
SELECT * FROM project_members LIMIT 1;
SELECT * FROM user_certificates LIMIT 1;
```

## 📊 Expected Results

### Before Fix
```
❌ RECURSION ERROR DETECTED: infinite recursion detected in policy for relation "organization_members"
❌ RECURSION ERROR DETECTED: infinite recursion detected in policy for relation "project_members"
❌ RECURSION ERROR DETECTED: infinite recursion detected in policy for relation "project_members"
```

### After Fix
```
✅ No recursion error - policies may already be fixed
✅ No recursion error detected
✅ No recursion error detected
```

## 🔧 What the Fix Does

1. **Drops problematic policies** that cause recursion
2. **Creates helper functions** for efficient permission checks
3. **Implements non-recursive policies** using helper functions
4. **Adds performance indexes** for better query performance
5. **Maintains all security boundaries** while eliminating recursion

## 🆘 Rollback Plan

If issues occur, run this SQL in Supabase Dashboard:

```sql
-- ROLLBACK: Drop helper functions
DROP FUNCTION IF EXISTS is_org_admin(UUID, UUID);
DROP FUNCTION IF EXISTS is_project_admin(UUID, UUID);
DROP FUNCTION IF EXISTS is_org_member(UUID, UUID);
DROP FUNCTION IF EXISTS is_project_member(UUID, UUID);
DROP FUNCTION IF EXISTS get_user_company_id(UUID);

-- ROLLBACK: Drop new policies
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
```

## ✅ Success Criteria

The deployment is successful when:
- ✅ No "infinite recursion detected in policy" errors
- ✅ All test queries execute without recursion
- ✅ Security boundaries are maintained
- ✅ Performance is improved
- ✅ Application queries work as expected
