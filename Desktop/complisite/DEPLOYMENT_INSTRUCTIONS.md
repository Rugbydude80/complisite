# Deploy RLS Fix - Quick Instructions

## 🚀 Quick Deployment

### Option 1: Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor

2. **Run the Fixed Schema**
   ```sql
   -- Copy and paste the contents of DEPLOY_RLS_FIX.sql
   -- This will safely deploy all fixes
   ```

3. **Verify Success**
   - Check for any error messages
   - Look for the success notice at the end

### Option 2: Command Line (Advanced)

1. **Install dependencies** (if not already installed)
   ```bash
   npm install @supabase/supabase-js dotenv
   ```

2. **Set environment variables**
   ```bash
   export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

3. **Run deployment script**
   ```bash
   node deploy-fixed-rls.js
   ```

## ✅ What This Fixes

- ❌ **Before**: `infinite recursion detected in policy`
- ✅ **After**: Clean, efficient RLS policies

## 🔍 Verification

After deployment, test these queries to ensure no recursion:

```sql
-- These should work without recursion errors
SELECT * FROM organization_members WHERE organization_id = 'your-org-id';
SELECT * FROM project_members WHERE project_id = 'your-project-id';
SELECT * FROM user_certificates WHERE user_id = auth.uid();
```

## 🆘 Rollback (If Needed)

If issues occur, you can rollback:

```sql
-- Drop the helper functions
DROP FUNCTION IF EXISTS is_org_admin(UUID, UUID);
DROP FUNCTION IF EXISTS is_project_admin(UUID, UUID);
DROP FUNCTION IF EXISTS is_org_member(UUID, UUID);
DROP FUNCTION IF EXISTS is_project_member(UUID, UUID);
DROP FUNCTION IF EXISTS get_user_company_id(UUID);

-- Recreate original policies (if you have them)
```

## 📞 Support

If you encounter issues:
1. Check the Supabase logs for error messages
2. Verify the helper functions were created successfully
3. Test with a simple query first
4. Contact support with specific error messages
