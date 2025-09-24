-- ============================================
-- CLEAN CERTIFICATE SCHEMA - NO CONFLICTS
-- ============================================
-- 
-- This script only creates the essential reference tables
-- without any views, functions, or complex operations
-- ============================================

-- Create certificate categories table for reference
CREATE TABLE IF NOT EXISTS certificate_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create issuing organizations table for reference
CREATE TABLE IF NOT EXISTS issuing_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  website TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_recognized BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert predefined certificate categories
INSERT INTO certificate_categories (name, description) VALUES
  ('Safety Training', 'Occupational safety and health training programs'),
  ('Medical Certifications', 'First aid, CPR, and medical response certifications'),
  ('Equipment Certifications', 'Equipment operation and safety certifications'),
  ('Trade Certifications', 'Professional trade and craft certifications'),
  ('Environmental Certifications', 'Environmental safety and compliance certifications'),
  ('Management Certifications', 'Project and safety management certifications')
ON CONFLICT (name) DO NOTHING;

-- Insert predefined issuing organizations
INSERT INTO issuing_organizations (name, website, is_recognized) VALUES
  ('OSHA (Occupational Safety and Health Administration)', 'https://www.osha.gov', true),
  ('American Red Cross', 'https://www.redcross.org', true),
  ('American Heart Association', 'https://www.heart.org', true),
  ('National Safety Council', 'https://www.nsc.org', true),
  ('Associated General Contractors (AGC)', 'https://www.agc.org', true),
  ('Construction Industry Institute', 'https://www.construction-institute.org', true),
  ('International Association of Bridge, Structural, Ornamental and Reinforcing Iron Workers', 'https://www.ironworkers.org', true),
  ('International Brotherhood of Electrical Workers (IBEW)', 'https://www.ibew.org', true),
  ('United Association of Journeymen and Apprentices', 'https://www.ua.org', true),
  ('International Union of Operating Engineers', 'https://www.iuoe.org', true),
  ('Laborers International Union of North America', 'https://www.liuna.org', true),
  ('Other', NULL, false)
ON CONFLICT (name) DO NOTHING;

-- Grant basic permissions
GRANT SELECT ON certificate_categories TO authenticated;
GRANT SELECT ON issuing_organizations TO authenticated;

-- Enable RLS
ALTER TABLE certificate_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE issuing_organizations ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "Anyone can read certificate categories" ON certificate_categories
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read issuing organizations" ON issuing_organizations
  FOR SELECT USING (true);
