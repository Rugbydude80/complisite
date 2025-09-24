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

-- Row Level Security Policies (only create if they don't exist)

-- Companies: Users can only see their own company
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Users can view their company') THEN
    CREATE POLICY "Users can view their company" ON companies
    FOR SELECT USING (id = (SELECT company_id FROM users WHERE id = auth.uid()));
  END IF;
END $$;

-- Users: Users can only see users from their company
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view company users') THEN
    CREATE POLICY "Users can view company users" ON users
    FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));
  END IF;
END $$;

-- Projects: Users can only see projects from their company
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can view company projects') THEN
    CREATE POLICY "Users can view company projects" ON projects
    FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));
  END IF;
END $$;

-- Evidence Photos: Users can only see photos from their company
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'evidence_photos' AND policyname = 'Users can view company evidence') THEN
    CREATE POLICY "Users can view company evidence" ON evidence_photos
    FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));
  END IF;
END $$;

-- Evidence Photos: Users can upload to their company projects
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'evidence_photos' AND policyname = 'Users can upload evidence') THEN
    CREATE POLICY "Users can upload evidence" ON evidence_photos
    FOR INSERT WITH CHECK (
      company_id = (SELECT company_id FROM users WHERE id = auth.uid()) AND
      uploaded_by = auth.uid()
    );
  END IF;
END $$;

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

-- RLS Policies for certificates (only create if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'certificate_types' AND policyname = 'Anyone can view certificate types') THEN
    CREATE POLICY "Anyone can view certificate types" ON certificate_types
    FOR SELECT USING (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_certificates' AND policyname = 'Users can manage own certificates') THEN
    CREATE POLICY "Users can manage own certificates" ON user_certificates
    FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_certificates' AND policyname = 'Company members can view shared certificates') THEN
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
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_certificates' AND policyname = 'Company admins can verify certificates') THEN
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
  END IF;
END $$;

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

-- RLS policies for organizations (only create if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'Organization members can view org') THEN
    CREATE POLICY "Organization members can view org" ON organizations
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.organization_id = organizations.id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
      )
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_members' AND policyname = 'Organization members can view members') THEN
    CREATE POLICY "Organization members can view members" ON organization_members
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
      )
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Project members can view project') THEN
    CREATE POLICY "Project members can view project" ON projects
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = projects.id
        AND pm.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_members' AND policyname = 'Project members can view project members') THEN
    CREATE POLICY "Project members can view project members" ON project_members
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- ============================================
-- PHASE 3: PROJECT INTEGRATION & COMPLIANCE TRACKING
-- ============================================

-- Enhanced project structure for compliance tracking
CREATE TABLE IF NOT EXISTS project_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  bsa_classification TEXT, -- 'hrb' (higher-risk building), 'standard', 'exempt'
  min_height_meters NUMERIC,
  min_storeys INTEGER,
  is_residential BOOLEAN DEFAULT false,
  requires_golden_thread BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert BSA 2022 project types
INSERT INTO project_types (name, category, bsa_classification, min_height_meters, min_storeys, is_residential, requires_golden_thread) VALUES
('HRB - Residential 18m+', 'Higher-Risk Building', 'hrb', 18, 7, true, true),
('HRB - Care Home', 'Higher-Risk Building', 'hrb', 18, 2, true, true),
('HRB - Hospital', 'Higher-Risk Building', 'hrb', 18, 2, false, true),
('Standard Residential', 'Standard', 'standard', NULL, NULL, true, false),
('Commercial Building', 'Standard', 'standard', NULL, NULL, false, false),
('Industrial/Warehouse', 'Standard', 'standard', NULL, NULL, false, false),
('Renovation/Refurbishment', 'Standard', 'standard', NULL, NULL, false, false),
('Minor Works', 'Minor', 'standard', NULL, NULL, false, false)
ON CONFLICT (name) DO NOTHING;

-- Enhanced projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type_id UUID REFERENCES project_types(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS postcode TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS longitude NUMERIC;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS planned_start_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS planned_end_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS actual_start_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS actual_end_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_contact TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_value NUMERIC;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS compliance_status TEXT DEFAULT 'not_started' 
  CHECK (compliance_status IN ('not_started', 'in_progress', 'compliant', 'non_compliant', 'requires_attention'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS overall_progress INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'medium' 
  CHECK (risk_level IN ('low', 'medium', 'high', 'critical'));

-- Compliance templates based on BSA 2022
CREATE TABLE IF NOT EXISTS compliance_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  applies_to_hrb BOOLEAN DEFAULT false,
  is_mandatory BOOLEAN DEFAULT false,
  regulation_reference TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert BSA 2022 compliance categories
INSERT INTO compliance_templates (name, category, applies_to_hrb, is_mandatory, regulation_reference) VALUES
-- Golden Thread Requirements (HRB)
('Principal Designer Appointment', 'Dutyholder Regime', true, true, 'BSA 2022 Part 2A'),
('Principal Contractor Appointment', 'Dutyholder Regime', true, true, 'BSA 2022 Part 2A'),
('Building Safety Manager Appointment', 'Dutyholder Regime', true, true, 'BSA 2022 Part 4'),
('Competence Declaration', 'Dutyholder Regime', true, true, 'BSR Competence Requirements'),

-- Gateway Points (HRB)
('Gateway 1 - Planning', 'Gateways', true, true, 'BSA Gateway 1'),
('Gateway 2 - Before Construction', 'Gateways', true, true, 'BSA Gateway 2'),
('Gateway 3 - Before Occupation', 'Gateways', true, true, 'BSA Gateway 3'),

-- Golden Thread Documentation
('Design Intent Document', 'Golden Thread', true, true, 'Regulation 23'),
('Construction Control Plan', 'Golden Thread', true, true, 'Regulation 24'),
('As-Built Information', 'Golden Thread', true, true, 'Regulation 38'),
('Fire Safety Information', 'Golden Thread', true, true, 'Regulation 38'),
('Building Manual', 'Golden Thread', true, true, 'Regulation 40'),

-- Standard Requirements (All Projects)
('Risk Assessment', 'Health & Safety', false, true, 'CDM 2015'),
('Method Statement', 'Health & Safety', false, true, 'CDM 2015'),
('Site Induction', 'Health & Safety', false, true, 'HSE Requirements'),
('Toolbox Talks', 'Health & Safety', false, false, 'Best Practice'),
('Accident Reporting', 'Health & Safety', false, true, 'RIDDOR'),
('Material Compliance', 'Quality', false, true, 'CPR 2013'),
('Testing & Commissioning', 'Quality', false, true, 'Building Regulations'),
('Snagging List', 'Quality', false, false, 'Best Practice'),
('Waste Management', 'Environmental', false, true, 'Waste Regulations 2011'),
('COSHH Assessment', 'Health & Safety', false, true, 'COSHH Regulations')
ON CONFLICT DO NOTHING;

-- Compliance checklist items
CREATE TABLE IF NOT EXISTS compliance_checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES compliance_templates(id),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  requires_evidence BOOLEAN DEFAULT true,
  evidence_type TEXT CHECK (evidence_type IN ('photo', 'document', 'signature', 'any')),
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert checklist items for key templates
INSERT INTO compliance_checklist_items (template_id, title, description, priority, requires_evidence, evidence_type, order_index)
SELECT 
  ct.id,
  item.title,
  item.description,
  item.priority,
  item.requires_evidence,
  item.evidence_type,
  item.order_index
FROM compliance_templates ct
CROSS JOIN LATERAL (
  VALUES 
    -- Risk Assessment items
    ('Identify hazards on site', 'Document all potential hazards in work area', 'high', true, 'document', 1),
    ('Assess risk levels', 'Evaluate likelihood and severity of each hazard', 'high', true, 'document', 2),
    ('Control measures', 'Define measures to eliminate or reduce risks', 'high', true, 'document', 3),
    ('Communicate to team', 'Ensure all workers understand the risks', 'medium', true, 'signature', 4),
    ('Review and update', 'Regular review of risk assessment', 'medium', false, 'any', 5)
) AS item(title, description, priority, requires_evidence, evidence_type, order_index)
WHERE ct.name = 'Risk Assessment'
ON CONFLICT DO NOTHING;

-- Project compliance tracking
CREATE TABLE IF NOT EXISTS project_compliance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES compliance_templates(id),
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'complete', 'overdue', 'na')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  due_date DATE,
  completed_date DATE,
  completed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, template_id)
);

-- Individual checklist completions
CREATE TABLE IF NOT EXISTS checklist_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_compliance_id UUID NOT NULL REFERENCES project_compliance(id) ON DELETE CASCADE,
  checklist_item_id UUID NOT NULL REFERENCES compliance_checklist_items(id),
  completed BOOLEAN DEFAULT false,
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMP,
  evidence_type TEXT,
  evidence_url TEXT,
  notes TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  weather_conditions TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_compliance_id, checklist_item_id)
);

-- Photo evidence storage
CREATE TABLE IF NOT EXISTS compliance_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  checklist_completion_id UUID REFERENCES checklist_completions(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  thumbnail_path TEXT,
  file_size INTEGER,
  mime_type TEXT,
  description TEXT,
  tags TEXT[],
  latitude NUMERIC,
  longitude NUMERIC,
  taken_at TIMESTAMP,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  weather_conditions TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Daily compliance reports
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  weather TEXT,
  temperature_celsius INTEGER,
  site_conditions TEXT,
  workers_on_site INTEGER,
  work_completed TEXT,
  issues_raised TEXT,
  health_safety_observations TEXT,
  materials_delivered TEXT,
  visitors TEXT[],
  submitted_by UUID NOT NULL REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, report_date)
);

-- Compliance notifications and alerts
CREATE TABLE IF NOT EXISTS compliance_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('overdue', 'expiring_soon', 'certificate_expiry', 'inspection_due', 'incident', 'non_compliance')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_project_compliance_project ON project_compliance(project_id);
CREATE INDEX idx_project_compliance_status ON project_compliance(status);
CREATE INDEX idx_checklist_completions_compliance ON checklist_completions(project_compliance_id);
CREATE INDEX idx_compliance_photos_project ON compliance_photos(project_id);
CREATE INDEX idx_daily_reports_project_date ON daily_reports(project_id, report_date);
CREATE INDEX idx_compliance_alerts_project_resolved ON compliance_alerts(project_id, resolved);

-- Enable RLS
ALTER TABLE project_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies (only create if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_types' AND policyname = 'Anyone can view project types') THEN
    CREATE POLICY "Anyone can view project types" ON project_types
    FOR SELECT USING (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'compliance_templates' AND policyname = 'Anyone can view compliance templates') THEN
    CREATE POLICY "Anyone can view compliance templates" ON compliance_templates
    FOR SELECT USING (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'compliance_checklist_items' AND policyname = 'Anyone can view checklist items') THEN
    CREATE POLICY "Anyone can view checklist items" ON compliance_checklist_items
    FOR SELECT USING (true);
  END IF;
END $$;

-- Project compliance policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_compliance' AND policyname = 'Project members can view compliance') THEN
    CREATE POLICY "Project members can view compliance" ON project_compliance
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = project_compliance.project_id
        AND pm.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_compliance' AND policyname = 'Project members can manage compliance') THEN
    CREATE POLICY "Project members can manage compliance" ON project_compliance
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = project_compliance.project_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('admin', 'manager', 'member')
      )
    );
  END IF;
END $$;

-- Function to initialize project compliance
CREATE OR REPLACE FUNCTION initialize_project_compliance(p_project_id UUID)
RETURNS void AS $$
DECLARE
  v_project_type TEXT;
BEGIN
  -- Get project type
  SELECT pt.bsa_classification 
  INTO v_project_type
  FROM projects p
  LEFT JOIN project_types pt ON p.project_type_id = pt.id
  WHERE p.id = p_project_id;

  -- Insert applicable compliance templates
  INSERT INTO project_compliance (project_id, template_id, status)
  SELECT 
    p_project_id,
    ct.id,
    'not_started'
  FROM compliance_templates ct
  WHERE ct.is_mandatory = true
  AND (
    (v_project_type = 'hrb' AND ct.applies_to_hrb = true) OR
    (ct.applies_to_hrb = false)
  )
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate project compliance score
CREATE OR REPLACE FUNCTION calculate_project_compliance_score(p_project_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_total INTEGER;
  v_completed INTEGER;
  v_score INTEGER;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'complete')
  INTO v_total, v_completed
  FROM project_compliance
  WHERE project_id = p_project_id
  AND status != 'na';

  IF v_total = 0 THEN
    RETURN 0;
  END IF;

  v_score := (v_completed * 100) / v_total;
  
  -- Update project progress
  UPDATE projects 
  SET overall_progress = v_score,
      compliance_status = CASE
        WHEN v_score = 0 THEN 'not_started'
        WHEN v_score = 100 THEN 'compliant'
        WHEN EXISTS (
          SELECT 1 FROM project_compliance 
          WHERE project_id = p_project_id 
          AND status = 'overdue'
        ) THEN 'requires_attention'
        ELSE 'in_progress'
      END,
      updated_at = NOW()
  WHERE id = p_project_id;

  RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
