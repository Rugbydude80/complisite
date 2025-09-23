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

-- ============================================
-- CERTIFICATE MANAGEMENT SYSTEM
-- ============================================

-- Certificate management tables
CREATE TABLE IF NOT EXISTS certificate_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  issuing_bodies TEXT[],
  typical_duration_months INTEGER,
  is_mandatory BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert common UK construction certificates
INSERT INTO certificate_types (name, category, issuing_bodies, typical_duration_months, is_mandatory) VALUES
('ECS Card', 'Electrical', ARRAY['JIB'], 36, true),
('CSCS Card', 'General', ARRAY['CITB'], 60, true),
('First Aid', 'Health & Safety', ARRAY['Red Cross', 'St Johns Ambulance'], 36, true),
('Asbestos Awareness', 'Health & Safety', ARRAY['UKATA', 'IATP'], 12, true),
('Manual Handling', 'Health & Safety', ARRAY['CITB', 'IOSH'], 36, false),
('Working at Height', 'Health & Safety', ARRAY['CITB', 'PASMA'], 36, false),
('Fire Safety', 'Health & Safety', ARRAY['NFPA', 'Fire Service'], 12, false),
('PAT Testing', 'Electrical', ARRAY['City & Guilds'], 24, false),
('17th Edition Wiring', 'Electrical', ARRAY['City & Guilds', 'EAL'], 999, true),
('Gas Safe', 'Plumbing', ARRAY['Gas Safe Register'], 60, true)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_type_id UUID REFERENCES certificate_types(id),
  certificate_number TEXT,
  issuing_body TEXT,
  issue_date DATE NOT NULL,
  expiry_date DATE,
  file_path TEXT,
  file_size INTEGER,
  file_type TEXT,
  status TEXT DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'verified', 'expired', 'suspended', 'rejected')),
  verification_method TEXT CHECK (verification_method IN ('manual', 'api', 'auto')),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP,
  rejection_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS certificate_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  certificate_id UUID NOT NULL REFERENCES user_certificates(id) ON DELETE CASCADE,
  shared_with_org_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  shared_with_project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(certificate_id, shared_with_org_id),
  UNIQUE(certificate_id, shared_with_project_id)
);

CREATE TABLE IF NOT EXISTS project_required_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  certificate_type_id UUID NOT NULL REFERENCES certificate_types(id),
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, certificate_type_id)
);

CREATE TABLE IF NOT EXISTS certificate_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_id UUID NOT NULL REFERENCES user_certificates(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('expiring_soon', 'expired', 'verification_required', 'rejected')),
  days_until_expiry INTEGER,
  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  UNIQUE(certificate_id, notification_type, days_until_expiry)
);

-- Create indexes for certificate tables
CREATE INDEX idx_user_certificates_user ON user_certificates(user_id);
CREATE INDEX idx_user_certificates_expiry ON user_certificates(expiry_date) WHERE status = 'verified';
CREATE INDEX idx_user_certificates_status ON user_certificates(status);
CREATE INDEX idx_certificate_shares_cert ON certificate_shares(certificate_id);
CREATE INDEX idx_certificate_notifications_user ON certificate_notifications(user_id, read_at);

-- Enable RLS for certificate tables
ALTER TABLE certificate_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_required_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for certificates
CREATE POLICY "Anyone can view certificate types" ON certificate_types
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own certificates" ON user_certificates
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Company members can view shared certificates" ON user_certificates
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM certificate_shares cs
      JOIN users u ON u.company_id = cs.shared_with_org_id
      WHERE cs.certificate_id = user_certificates.id
      AND u.id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM certificate_shares cs
      JOIN users u ON u.company_id = (SELECT company_id FROM projects WHERE id = cs.shared_with_project_id)
      WHERE cs.certificate_id = user_certificates.id
      AND u.id = auth.uid()
    )
  );

CREATE POLICY "Company admins can verify certificates" ON user_certificates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN users target ON target.company_id = u.company_id
      WHERE u.id = auth.uid()
      AND target.id = user_certificates.user_id
      AND u.role = 'admin'
    )
  );

-- Function to check certificate expiry
CREATE OR REPLACE FUNCTION check_certificate_expiry()
RETURNS void AS $$
BEGIN
  -- Update expired certificates
  UPDATE user_certificates
  SET status = 'expired'
  WHERE expiry_date < CURRENT_DATE
  AND status = 'verified';
  
  -- Create notifications for expiring certificates
  INSERT INTO certificate_notifications (user_id, certificate_id, notification_type, days_until_expiry)
  SELECT 
    uc.user_id,
    uc.id,
    CASE 
      WHEN uc.expiry_date < CURRENT_DATE THEN 'expired'
      ELSE 'expiring_soon'
    END,
    uc.expiry_date - CURRENT_DATE
  FROM user_certificates uc
  WHERE uc.status = 'verified'
  AND uc.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
  AND uc.expiry_date - CURRENT_DATE IN (90, 60, 30, 14, 7, 1)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add user_profiles table for enhanced user data
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  trade TEXT,
  bio TEXT,
  avatar_url TEXT,
  share_certificates BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policy for user_profiles
CREATE POLICY "Users can manage own profile" ON user_profiles
  FOR ALL USING (user_id = auth.uid());

-- Add organizations table for team management
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  company_id UUID REFERENCES companies(id),
  address TEXT,
  status TEXT DEFAULT 'active',
  compliance_score INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS for new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for organizations
CREATE POLICY "Organization members can view org" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organizations.id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

CREATE POLICY "Organization members can view members" ON organization_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

CREATE POLICY "Project members can view project" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = projects.id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can view project members" ON project_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
    )
  );
