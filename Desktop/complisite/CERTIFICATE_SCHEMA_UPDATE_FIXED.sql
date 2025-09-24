-- ============================================
-- CERTIFICATE MANAGEMENT SCHEMA UPDATE (FIXED)
-- ============================================
-- 
-- This script updates the existing user_certificates table to support the new
-- structured certificate management system with categories and types
-- ============================================

-- Update user_certificates table with new fields
ALTER TABLE user_certificates ADD COLUMN IF NOT EXISTS 
  category TEXT NOT NULL DEFAULT 'Safety Training';

ALTER TABLE user_certificates ADD COLUMN IF NOT EXISTS 
  issuing_organization TEXT NOT NULL DEFAULT '';

ALTER TABLE user_certificates ADD COLUMN IF NOT EXISTS 
  certificate_number TEXT NOT NULL DEFAULT '';

ALTER TABLE user_certificates ADD COLUMN IF NOT EXISTS 
  is_renewable BOOLEAN DEFAULT true;

ALTER TABLE user_certificates ADD COLUMN IF NOT EXISTS 
  requires_training BOOLEAN DEFAULT false;

ALTER TABLE user_certificates ADD COLUMN IF NOT EXISTS 
  description TEXT;

-- Create certificate categories table
CREATE TABLE IF NOT EXISTS certificate_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create certificate types table
CREATE TABLE IF NOT EXISTS certificate_types_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES certificate_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_renewable BOOLEAN DEFAULT true,
  requires_training BOOLEAN DEFAULT false,
  typical_validity_months INTEGER DEFAULT 12,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(category_id, name)
);

-- Create issuing organizations table
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

-- Insert predefined certificate types
INSERT INTO certificate_types_new (category_id, name, description, is_renewable, requires_training, typical_validity_months) VALUES
  -- Safety Training
  ((SELECT id FROM certificate_categories WHERE name = 'Safety Training'), 'OSHA 10-Hour Construction Safety', 'Basic construction safety awareness', true, false, 12),
  ((SELECT id FROM certificate_categories WHERE name = 'Safety Training'), 'OSHA 30-Hour Construction Safety', 'Comprehensive construction safety training', true, false, 12),
  ((SELECT id FROM certificate_categories WHERE name = 'Safety Training'), 'OSHA 40-Hour HAZWOPER', 'Hazardous waste operations and emergency response', true, true, 12),
  ((SELECT id FROM certificate_categories WHERE name = 'Safety Training'), 'Confined Space Entry', 'Confined space entry and rescue procedures', true, true, 12),
  ((SELECT id FROM certificate_categories WHERE name = 'Safety Training'), 'Fall Protection', 'Fall protection systems and procedures', true, true, 12),
  ((SELECT id FROM certificate_categories WHERE name = 'Safety Training'), 'Scaffolding Safety', 'Scaffolding assembly, use, and dismantling', true, true, 12),
  ((SELECT id FROM certificate_categories WHERE name = 'Safety Training'), 'Electrical Safety', 'Electrical safety procedures and lockout/tagout', true, true, 12),
  ((SELECT id FROM certificate_categories WHERE name = 'Safety Training'), 'Personal Protective Equipment (PPE)', 'PPE selection, use, and maintenance', true, true, 12),
  
  -- Medical Certifications
  ((SELECT id FROM certificate_categories WHERE name = 'Medical Certifications'), 'First Aid CPR/AED', 'Basic life support and automated external defibrillator', true, true, 24),
  ((SELECT id FROM certificate_categories WHERE name = 'Medical Certifications'), 'Basic Life Support (BLS)', 'Healthcare provider basic life support', true, true, 24),
  ((SELECT id FROM certificate_categories WHERE name = 'Medical Certifications'), 'Advanced Cardiac Life Support (ACLS)', 'Advanced cardiac life support for healthcare providers', true, true, 24),
  ((SELECT id FROM certificate_categories WHERE name = 'Medical Certifications'), 'Bloodborne Pathogens', 'Bloodborne pathogen exposure prevention', true, true, 12),
  
  -- Equipment Certifications
  ((SELECT id FROM certificate_categories WHERE name = 'Equipment Certifications'), 'Forklift Operator License', 'Powered industrial truck operation', true, true, 36),
  ((SELECT id FROM certificate_categories WHERE name = 'Equipment Certifications'), 'Crane Operator Certification', 'Crane operation and safety procedures', true, true, 60),
  ((SELECT id FROM certificate_categories WHERE name = 'Equipment Certifications'), 'Aerial Lift Certification', 'Aerial platform operation and safety', true, true, 36),
  ((SELECT id FROM certificate_categories WHERE name = 'Equipment Certifications'), 'Heavy Equipment Operator', 'Heavy construction equipment operation', true, true, 36),
  ((SELECT id FROM certificate_categories WHERE name = 'Equipment Certifications'), 'Welding Certification', 'Welding processes and safety procedures', true, true, 60),
  
  -- Trade Certifications
  ((SELECT id FROM certificate_categories WHERE name = 'Trade Certifications'), 'Journeyman Electrician', 'Licensed electrical work', true, true, 60),
  ((SELECT id FROM certificate_categories WHERE name = 'Trade Certifications'), 'Master Electrician', 'Advanced electrical work and supervision', true, true, 60),
  ((SELECT id FROM certificate_categories WHERE name = 'Trade Certifications'), 'Plumber License', 'Licensed plumbing work', true, true, 60),
  ((SELECT id FROM certificate_categories WHERE name = 'Trade Certifications'), 'HVAC Certification', 'Heating, ventilation, and air conditioning', true, true, 60),
  ((SELECT id FROM certificate_categories WHERE name = 'Trade Certifications'), 'Carpenter Certification', 'Carpentry and woodworking', true, true, 60),
  
  -- Environmental Certifications
  ((SELECT id FROM certificate_categories WHERE name = 'Environmental Certifications'), 'Asbestos Awareness', 'Asbestos identification and safety procedures', true, true, 12),
  ((SELECT id FROM certificate_categories WHERE name = 'Environmental Certifications'), 'Lead Paint Certification', 'Lead-based paint identification and safety', true, true, 12),
  ((SELECT id FROM certificate_categories WHERE name = 'Environmental Certifications'), 'Mold Remediation', 'Mold identification and remediation procedures', true, true, 12),
  ((SELECT id FROM certificate_categories WHERE name = 'Environmental Certifications'), 'Hazardous Materials Handling', 'Hazardous material identification and handling', true, true, 12),
  
  -- Management Certifications
  ((SELECT id FROM certificate_categories WHERE name = 'Management Certifications'), 'Project Management Professional (PMP)', 'Project management best practices', true, true, 36),
  ((SELECT id FROM certificate_categories WHERE name = 'Management Certifications'), 'Construction Management', 'Construction project management', true, true, 36),
  ((SELECT id FROM certificate_categories WHERE name = 'Management Certifications'), 'Safety Management', 'Workplace safety management', true, true, 36),
  ((SELECT id FROM certificate_categories WHERE name = 'Management Certifications'), 'Quality Management', 'Quality assurance and control', true, true, 36)
ON CONFLICT (category_id, name) DO NOTHING;

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_certificates_category ON user_certificates(category);
CREATE INDEX IF NOT EXISTS idx_user_certificates_status ON user_certificates(status);
CREATE INDEX IF NOT EXISTS idx_user_certificates_expiry_date ON user_certificates(expiry_date);
CREATE INDEX IF NOT EXISTS idx_user_certificates_user_category ON user_certificates(user_id, category);
CREATE INDEX IF NOT EXISTS idx_certificate_types_new_category ON certificate_types_new(category_id);
CREATE INDEX IF NOT EXISTS idx_issuing_organizations_name ON issuing_organizations(name);

-- Create views for easier querying
CREATE OR REPLACE VIEW certificate_details AS
SELECT 
  uc.*,
  cc.name as category_name,
  ct.name as type_name,
  io.name as issuing_organization_name,
  io.website as issuing_organization_website,
  CASE 
    WHEN uc.expiry_date < CURRENT_DATE THEN 'expired'
    WHEN uc.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring'
    ELSE 'valid'
  END as status
FROM user_certificates uc
LEFT JOIN certificate_categories cc ON uc.category = cc.name
LEFT JOIN certificate_types_new ct ON uc.metadata->>'type' = ct.name AND uc.category = cc.name
LEFT JOIN issuing_organizations io ON uc.issuing_organization = io.name;

-- Create function to get certificate statistics
CREATE OR REPLACE FUNCTION get_certificate_stats(user_id UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'valid', COUNT(*) FILTER (WHERE expiry_date > CURRENT_DATE),
    'expiring', COUNT(*) FILTER (WHERE expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND expiry_date > CURRENT_DATE),
    'expired', COUNT(*) FILTER (WHERE expiry_date <= CURRENT_DATE),
    'by_category', (
      SELECT json_object_agg(category, count)
      FROM (
        SELECT category, COUNT(*) as count
        FROM user_certificates
        WHERE user_certificates.user_id = $1
        GROUP BY category
      ) category_counts
    )
  ) INTO stats
  FROM user_certificates
  WHERE user_certificates.user_id = $1;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_certificate_stats(UUID) TO authenticated;
GRANT SELECT ON certificate_details TO authenticated;
GRANT SELECT ON certificate_categories TO authenticated;
GRANT SELECT ON certificate_types_new TO authenticated;
GRANT SELECT ON issuing_organizations TO authenticated;

-- Create RLS policies
ALTER TABLE certificate_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_types_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE issuing_organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read categories, types, and organizations
CREATE POLICY "Anyone can read certificate categories" ON certificate_categories
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read certificate types" ON certificate_types_new
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read issuing organizations" ON issuing_organizations
  FOR SELECT USING (true);
