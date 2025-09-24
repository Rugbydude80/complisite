-- ============================================
-- MINIMAL CERTIFICATE SCHEMA UPDATE
-- ============================================
-- 
-- This script adds minimal enhancements to the existing user_certificates table
-- without conflicting with the existing schema
-- ============================================

-- Add new columns to user_certificates table (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_certificates' AND column_name = 'category') THEN
    ALTER TABLE user_certificates ADD COLUMN category TEXT DEFAULT 'Safety Training';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_certificates' AND column_name = 'issuing_organization') THEN
    ALTER TABLE user_certificates ADD COLUMN issuing_organization TEXT DEFAULT '';
  END IF;
END $$;

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_certificates_category ON user_certificates(category);
CREATE INDEX IF NOT EXISTS idx_user_certificates_expiry_date ON user_certificates(expiry_date);
CREATE INDEX IF NOT EXISTS idx_user_certificates_user_category ON user_certificates(user_id, category);

-- Create a simple function to get certificate statistics
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
        SELECT COALESCE(category, 'Unknown') as category, COUNT(*) as count
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
GRANT SELECT ON certificate_categories TO authenticated;
GRANT SELECT ON issuing_organizations TO authenticated;

-- Create RLS policies
ALTER TABLE certificate_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE issuing_organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read categories and organizations
CREATE POLICY "Anyone can read certificate categories" ON certificate_categories
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read issuing organizations" ON issuing_organizations
  FOR SELECT USING (true);
