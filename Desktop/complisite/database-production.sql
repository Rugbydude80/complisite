-- Production Database Schema for Construction Compliance SaaS
-- Run these commands in your Supabase SQL Editor

-- Note: storage.objects RLS is managed by Supabase
-- We'll create policies through the Supabase Dashboard instead

-- Create evidence_photos table for audit trail
CREATE TABLE IF NOT EXISTS evidence_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_item_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id),
  url TEXT NOT NULL,
  metadata JSONB,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  company_id UUID REFERENCES companies(id),
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company_id UUID REFERENCES companies(id),
  address TEXT,
  status TEXT DEFAULT 'active',
  compliance_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create checklists table
CREATE TABLE IF NOT EXISTS checklists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  project_id UUID REFERENCES projects(id),
  category TEXT,
  total_items INTEGER DEFAULT 0,
  completed_items INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create checklist_items table
CREATE TABLE IF NOT EXISTS checklist_items (
  id TEXT PRIMARY KEY,
  checklist_id UUID REFERENCES checklists(id),
  description TEXT NOT NULL,
  section TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  comments TEXT,
  priority TEXT DEFAULT 'medium',
  requires_evidence BOOLEAN DEFAULT FALSE,
  evidence_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies

-- Companies: Users can only see their own company
CREATE POLICY "Users can view their company" ON companies
FOR SELECT USING (id = (SELECT company_id FROM users WHERE id = auth.uid()));

-- Users: Users can only see users from their company
CREATE POLICY "Users can view company users" ON users
FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

-- Projects: Users can only see projects from their company
CREATE POLICY "Users can view company projects" ON projects
FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

-- Evidence Photos: Users can only see photos from their company
CREATE POLICY "Users can view company evidence" ON evidence_photos
FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

-- Evidence Photos: Users can upload to their company projects
CREATE POLICY "Users can upload evidence" ON evidence_photos
FOR INSERT WITH CHECK (
  company_id = (SELECT company_id FROM users WHERE id = auth.uid()) AND
  uploaded_by = auth.uid()
);

-- Storage Policies for Evidence Bucket
-- Note: These policies need to be created through the Supabase Dashboard
-- Go to Storage → evidence bucket → Policies tab and add:

-- Policy 1: "Company users can view their evidence"
-- SELECT policy for storage.objects
-- USING: bucket_id = 'evidence' AND (storage.foldername(name))[1] = 'checklist-evidence'

-- Policy 2: "Company users can upload evidence" 
-- INSERT policy for storage.objects
-- WITH CHECK: bucket_id = 'evidence' AND (storage.foldername(name))[1] = 'checklist-evidence'

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_evidence_photos_company ON evidence_photos(company_id);
CREATE INDEX IF NOT EXISTS idx_evidence_photos_item ON evidence_photos(checklist_item_id);
CREATE INDEX IF NOT EXISTS idx_evidence_photos_uploaded_by ON evidence_photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_projects_company ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);

-- Functions for audit trail
CREATE OR REPLACE FUNCTION log_photo_upload()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the upload event
  INSERT INTO evidence_photos (
    checklist_item_id,
    project_id,
    uploaded_by,
    company_id,
    url,
    metadata,
    uploaded_at
  ) VALUES (
    NEW.metadata->>'checklist_item_id',
    NEW.metadata->>'project_id',
    (NEW.metadata->>'uploaded_by')::UUID,
    (NEW.metadata->>'company_id')::UUID,
    'https://' || current_setting('app.supabase_url') || '/storage/v1/object/public/' || NEW.bucket_id || '/' || NEW.name,
    NEW.metadata,
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic photo logging
CREATE TRIGGER trigger_photo_upload
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'evidence')
  EXECUTE FUNCTION log_photo_upload();
