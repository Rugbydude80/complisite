-- Initial schema for Construction Compliance SaaS
-- This migration creates all necessary tables and policies

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_evidence_photos_company ON evidence_photos(company_id);
CREATE INDEX IF NOT EXISTS idx_evidence_photos_item ON evidence_photos(checklist_item_id);
CREATE INDEX IF NOT EXISTS idx_evidence_photos_uploaded_by ON evidence_photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_projects_company ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_photos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their company" ON companies
FOR SELECT USING (id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view company users" ON users
FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view company projects" ON projects
FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view company evidence" ON evidence_photos
FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can upload evidence" ON evidence_photos
FOR INSERT WITH CHECK (
  company_id = (SELECT company_id FROM users WHERE id = auth.uid()) AND
  uploaded_by = auth.uid()
);

-- Create storage bucket for evidence
INSERT INTO storage.buckets (id, name, public) 
VALUES ('evidence', 'evidence', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for evidence bucket
CREATE POLICY "Company users can view their evidence" ON storage.objects
FOR SELECT USING (
  bucket_id = 'evidence' AND
  (storage.foldername(name))[1] = 'checklist-evidence'
);

CREATE POLICY "Company users can upload evidence" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'evidence' AND
  (storage.foldername(name))[1] = 'checklist-evidence'
);

CREATE POLICY "Company users can update their evidence" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'evidence' AND
  (storage.foldername(name))[1] = 'checklist-evidence'
);

CREATE POLICY "Company users can delete their evidence" ON storage.objects
FOR DELETE USING (
  bucket_id = 'evidence' AND
  (storage.foldername(name))[1] = 'checklist-evidence'
);
