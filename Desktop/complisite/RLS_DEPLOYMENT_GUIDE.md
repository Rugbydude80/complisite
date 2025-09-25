# RLS Policy Recursion Fix - Deployment Guide

## Overview

This guide provides step-by-step instructions to fix the "infinite recursion detected in policy" errors in your Complisite database schema.

## Problem Summary

The original RLS policies had circular references that caused infinite recursion:

1. **`organization_members` policy** queried the same table it was protecting
2. **`project_members` policy** had the same self-referencing issue
3. **Complex certificate sharing policies** created performance bottlenecks

## Solution

The fix introduces **helper functions** that eliminate recursion while maintaining security:

- `is_org_admin(user_id, org_id)` - Check organization admin status
- `is_project_admin(user_id, project_id)` - Check project admin status  
- `is_org_member(user_id, org_id)` - Check organization membership
- `is_project_member(user_id, project_id)` - Check project membership
- `get_user_company_id(user_id)` - Get user's company ID

## Deployment Steps

### Step 1: Backup Your Database

```sql
-- Create a backup before making changes
CREATE SCHEMA backup_schema;
-- Export your current data and schema
```

### Step 2: Apply the Fixed Schema

1. **Run the fixed RLS policies:**
   ```bash
   # Execute the fixed schema file
   psql -d your_database -f FIXED_RLS_SCHEMA.sql
   ```

2. **Verify the policies were created:**
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
   FROM pg_policies 
   WHERE schemaname = 'public' 
   ORDER BY tablename, policyname;
   ```

### Step 3: Test the Fix

1. **Run the test cases:**
   ```bash
   # Execute the test cases
   psql -d your_database -f RLS_TEST_CASES.sql
   ```

2. **Verify no recursion errors:**
   ```sql
   -- These queries should execute without "infinite recursion" errors
   SELECT * FROM organization_members WHERE organization_id = 'your-org-id';
   SELECT * FROM project_members WHERE project_id = 'your-project-id';
   ```

### Step 4: Monitor Performance

1. **Check query performance:**
   ```sql
   EXPLAIN ANALYZE SELECT * FROM organization_members WHERE organization_id = 'your-org-id';
   ```

2. **Monitor for any remaining issues:**
   ```sql
   -- Check for any remaining problematic policies
   SELECT tablename, policyname, qual 
   FROM pg_policies 
   WHERE qual LIKE '%organization_members%' 
   AND tablename = 'organization_members';
   ```

## Key Changes Made

### Before (Problematic)
```sql
-- This caused infinite recursion
CREATE POLICY "Organization members can view members" ON organization_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM organization_members om  -- ← RECURSION!
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
  )
);
```

### After (Fixed)
```sql
-- This eliminates recursion using helper functions
CREATE POLICY "Org members can view org members" ON organization_members
FOR SELECT USING (
  is_org_member(auth.uid(), organization_id)  -- ← NO RECURSION!
);
```

## Security Verification

### Test 1: Company Isolation
```sql
-- Users should only see their own company data
SELECT COUNT(*) FROM users WHERE company_id != get_user_company_id(auth.uid());
-- Should return 0
```

### Test 2: Organization Isolation  
```sql
-- Users should only see their organization data
SELECT COUNT(*) FROM organizations 
WHERE id NOT IN (
  SELECT organization_id FROM organization_members 
  WHERE user_id = auth.uid()
);
-- Should return 0 for organization members
```

### Test 3: Project Isolation
```sql
-- Users should only see their project data
SELECT COUNT(*) FROM projects 
WHERE id NOT IN (
  SELECT project_id FROM project_members 
  WHERE user_id = auth.uid()
);
-- Should return 0 for project members
```

## Performance Improvements

The fixed schema includes several performance optimizations:

1. **Helper Functions**: Eliminate recursive queries
2. **Strategic Indexes**: Support efficient permission checks
3. **Simplified Policies**: Reduce query complexity

### Indexes Added
```sql
CREATE INDEX idx_organization_members_user_org_role 
ON organization_members(user_id, organization_id, role, status);

CREATE INDEX idx_project_members_user_project_role 
ON project_members(user_id, project_id, role);

CREATE INDEX idx_users_company_id 
ON users(company_id);
```

## Rollback Plan

If issues occur, you can rollback:

1. **Restore from backup:**
   ```sql
   -- Drop the fixed policies
   DROP POLICY IF EXISTS "Org members can view org members" ON organization_members;
   DROP POLICY IF EXISTS "Project members can view project members" ON project_members;
   
   -- Restore original policies (if you have them)
   ```

2. **Recreate original policies:**
   ```sql
   -- Recreate the original problematic policies
   -- (Only if you need to revert for testing)
   ```

## Monitoring

### Check for Recursion Errors
```sql
-- Monitor PostgreSQL logs for recursion errors
SELECT * FROM pg_stat_activity 
WHERE query LIKE '%infinite recursion%';
```

### Performance Monitoring
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
WHERE query LIKE '%organization_members%' 
ORDER BY mean_time DESC;
```

## Troubleshooting

### Issue: "Function does not exist"
**Solution:** Ensure helper functions are created:
```sql
SELECT proname FROM pg_proc WHERE proname LIKE 'is_%';
```

### Issue: "Permission denied"
**Solution:** Grant execute permissions:
```sql
GRANT EXECUTE ON FUNCTION is_org_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_project_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_org_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_project_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_company_id(UUID) TO authenticated;
```

### Issue: "Policy still recurses"
**Solution:** Check for remaining problematic policies:
```sql
SELECT tablename, policyname, qual 
FROM pg_policies 
WHERE qual LIKE '%EXISTS%SELECT%FROM%' || tablename;
```

## Success Criteria

✅ **No "infinite recursion detected in policy" errors**  
✅ **All user roles can access appropriate data**  
✅ **Company/organization/project isolation maintained**  
✅ **Query performance improved**  
✅ **Security boundaries preserved**  

## Support

If you encounter issues:

1. Check the test cases in `RLS_TEST_CASES.sql`
2. Verify helper functions are created and have proper permissions
3. Monitor PostgreSQL logs for any remaining recursion errors
4. Test with a small dataset first before applying to production

The fixed schema maintains all security requirements while eliminating recursion issues and improving performance.
