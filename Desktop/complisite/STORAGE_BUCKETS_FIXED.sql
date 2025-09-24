-- ============================================
-- COMPLISITE STORAGE BUCKETS SETUP (FIXED)
-- ============================================
-- Run this script in Supabase SQL Editor to create
-- and configure all required storage buckets
-- ============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, avif_autodetection, allowed_mime_types, file_size_limit)
VALUES 
  ('certificates', 'certificates', false, false, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'], 10485760), -- 10MB limit
  ('project-files', 'project-files', false, false, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'], 52428800), -- 50MB limit
  ('evidence', 'evidence', false, false, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'video/mp4', 'video/quicktime'], 104857600) -- 100MB limit
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  avif_autodetection = EXCLUDED.avif_autodetection,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  file_size_limit = EXCLUDED.file_size_limit;

-- ============================================
-- STORAGE POLICIES FOR CERTIFICATES BUCKET
-- ============================================

-- Drop existing policies if they exist (bucket-specific)
DROP POLICY IF EXISTS "Users can upload own certificates" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own certificates" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own certificates" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own certificates" ON storage.objects;
DROP POLICY IF EXISTS "Org members can view shared certificates" ON storage.objects;

-- Users can upload their own certificates
CREATE POLICY "Users can upload own certificates"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'certificates' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own certificates
CREATE POLICY "Users can view own certificates"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'certificates' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own certificates
CREATE POLICY "Users can update own certificates"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'certificates' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own certificates
CREATE POLICY "Users can delete own certificates"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'certificates' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Organization members can view shared certificates
CREATE POLICY "Org members can view shared certificates"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'certificates' AND
  EXISTS (
    SELECT 1 FROM user_certificates uc
    JOIN certificate_shares cs ON cs.certificate_id = uc.id
    JOIN organization_members om ON om.organization_id = cs.shared_with_org_id
    WHERE uc.file_path = storage.objects.name
    AND om.user_id = auth.uid()
    AND om.status = 'active'
  )
);

-- ============================================
-- STORAGE POLICIES FOR PROJECT-FILES BUCKET
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Project members can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Project members can view files" ON storage.objects;
DROP POLICY IF EXISTS "Project admins can update files" ON storage.objects;
DROP POLICY IF EXISTS "Project admins can delete files" ON storage.objects;

-- Project members can upload files
CREATE POLICY "Project members can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-files' AND
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id::text = (storage.foldername(name))[1]
    AND pm.user_id = auth.uid()
  )
);

-- Project members can view files
CREATE POLICY "Project members can view files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-files' AND
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id::text = (storage.foldername(name))[1]
    AND pm.user_id = auth.uid()
  )
);

-- Project admins can update files
CREATE POLICY "Project admins can update files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'project-files' AND
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id::text = (storage.foldername(name))[1]
    AND pm.user_id = auth.uid()
    AND pm.role = 'admin'
  )
);

-- Project admins can delete files
CREATE POLICY "Project admins can delete files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-files' AND
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id::text = (storage.foldername(name))[1]
    AND pm.user_id = auth.uid()
    AND pm.role = 'admin'
  )
);

-- ============================================
-- STORAGE POLICIES FOR EVIDENCE BUCKET
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Project members can upload evidence" ON storage.objects;
DROP POLICY IF EXISTS "Project members can view evidence" ON storage.objects;
DROP POLICY IF EXISTS "Project admins can delete evidence" ON storage.objects;

-- Project members can upload evidence
CREATE POLICY "Project members can upload evidence"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'evidence' AND
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id::text = (storage.foldername(name))[1]
    AND pm.user_id = auth.uid()
  )
);

-- Project members can view evidence
CREATE POLICY "Project members can view evidence"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'evidence' AND
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id::text = (storage.foldername(name))[1]
    AND pm.user_id = auth.uid()
  )
);

-- Evidence cannot be updated (audit trail integrity)
-- No UPDATE policy for evidence bucket

-- Only project admins can delete evidence (with caution)
CREATE POLICY "Project admins can delete evidence"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'evidence' AND
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id::text = (storage.foldername(name))[1]
    AND pm.user_id = auth.uid()
    AND pm.role = 'admin'
  )
);

-- ============================================
-- HELPER FUNCTIONS FOR STORAGE
-- ============================================

-- Function to generate secure file paths
CREATE OR REPLACE FUNCTION generate_storage_path(
  bucket_name TEXT,
  folder_id TEXT,
  file_name TEXT
) RETURNS TEXT AS $$
BEGIN
  RETURN bucket_name || '/' || folder_id || '/' || 
         to_char(NOW(), 'YYYY/MM/DD/') || 
         extract(epoch from NOW())::TEXT || '_' || file_name;
END;
$$ LANGUAGE plpgsql;

-- Function to get signed URL for file access
CREATE OR REPLACE FUNCTION get_signed_url(
  bucket_name TEXT,
  file_path TEXT,
  expires_in INTEGER DEFAULT 3600
) RETURNS TEXT AS $$
DECLARE
  signed_url TEXT;
BEGIN
  -- This would typically call Supabase's storage API
  -- For now, return a placeholder
  -- In production, use Supabase client library for signed URLs
  RETURN 'https://your-project.supabase.co/storage/v1/object/sign/' || 
         bucket_name || '/' || file_path || 
         '?token=eyJ...&expires_in=' || expires_in;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFY BUCKET CREATION
-- ============================================

-- Check that buckets were created successfully
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id IN ('certificates', 'project-files', 'evidence');

-- ============================================
-- USAGE EXAMPLES
-- ============================================

/*
-- Example: Upload a certificate
-- File path format: certificates/{user_id}/{timestamp}_{filename}
-- Example: certificates/123e4567-e89b-12d3-a456-426614174000/1704067200_cscs_card.pdf

-- Example: Upload project compliance photo
-- File path format: project-files/{project_id}/{timestamp}_{filename}
-- Example: project-files/987fcdeb-51a2-43f1-b63c-9a7e5d3b3d4a/1704067200_site_inspection.jpg

-- Example: Upload evidence
-- File path format: evidence/{project_id}/{date}/{timestamp}_{filename}
-- Example: evidence/987fcdeb-51a2-43f1-b63c-9a7e5d3b3d4a/2024/01/01/1704067200_incident_photo.jpg
*/

-- ============================================
-- MAINTENANCE QUERIES
-- ============================================

-- Query to check storage usage by bucket
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  SUM(COALESCE((metadata->>'size')::BIGINT, 0)) as total_size_bytes,
  ROUND(SUM(COALESCE((metadata->>'size')::BIGINT, 0)) / 1024.0 / 1024.0, 2) as total_size_mb
FROM storage.objects
WHERE bucket_id IN ('certificates', 'project-files', 'evidence')
GROUP BY bucket_id;

-- Query to find large files
SELECT 
  bucket_id,
  name,
  COALESCE((metadata->>'size')::BIGINT, 0) as size_bytes,
  ROUND(COALESCE((metadata->>'size')::BIGINT, 0) / 1024.0 / 1024.0, 2) as size_mb,
  created_at
FROM storage.objects
WHERE bucket_id IN ('certificates', 'project-files', 'evidence')
AND COALESCE((metadata->>'size')::BIGINT, 0) > 5242880 -- Files larger than 5MB
ORDER BY size_bytes DESC;

-- ============================================
-- CLEANUP POLICIES (Optional)
-- ============================================

-- Function to clean up orphaned files (files not referenced in database)
CREATE OR REPLACE FUNCTION cleanup_orphaned_files()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- This would need to be implemented based on your specific needs
  -- Example: Delete certificate files not referenced in user_certificates table
  
  -- Return count of deleted files
  RETURN QUERY SELECT deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Storage buckets created successfully!';
  RAISE NOTICE 'Buckets: certificates, project-files, evidence';
  RAISE NOTICE 'RLS policies applied for secure access control';
END $$;
