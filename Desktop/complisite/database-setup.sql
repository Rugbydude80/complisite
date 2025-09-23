-- Database setup for Complisite project
-- Run these commands in your Supabase SQL editor

-- 1. Create checklists table
CREATE TABLE IF NOT EXISTS checklists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  total_items INTEGER NOT NULL DEFAULT 0,
  completed_items INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  compliance_score INTEGER NOT NULL DEFAULT 0,
  company_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Insert sample projects
INSERT INTO projects (id, name, address, status, compliance_score, company_id) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Downtown Office Complex', '123 Main St, Downtown', 'active', 85, NULL),
  ('550e8400-e29b-41d4-a716-446655440002', 'Riverside Residential', '456 River Rd, Riverside', 'active', 72, NULL),
  ('550e8400-e29b-41d4-a716-446655440003', 'Industrial Warehouse', '789 Industrial Blvd, Industrial District', 'pending', 45, NULL),
  ('550e8400-e29b-41d4-a716-446655440004', 'Shopping Center Renovation', '321 Commerce St, Shopping District', 'active', 91, NULL),
  ('550e8400-e29b-41d4-a716-446655440005', 'Hospital Extension', '654 Health Ave, Medical District', 'issues', 38, NULL)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert sample checklists
INSERT INTO checklists (project_id, name, category, total_items, completed_items) VALUES
  -- Downtown Office Complex checklists
  ('550e8400-e29b-41d4-a716-446655440001', 'Building Safety Act Compliance', 'safety', 25, 18),
  ('550e8400-e29b-41d4-a716-446655440001', 'Fire Safety Assessment', 'fire-safety', 30, 30),
  ('550e8400-e29b-41d4-a716-446655440001', 'Electrical Installation', 'electrical', 20, 15),
  ('550e8400-e29b-41d4-a716-446655440001', 'Structural Integrity Check', 'structural', 15, 12),
  
  -- Riverside Residential checklists
  ('550e8400-e29b-41d4-a716-446655440002', 'Building Safety Act Compliance', 'safety', 25, 20),
  ('550e8400-e29b-41d4-a716-446655440002', 'Fire Safety Assessment', 'fire-safety', 30, 25),
  ('550e8400-e29b-41d4-a716-446655440002', 'Electrical Installation', 'electrical', 20, 12),
  ('550e8400-e29b-41d4-a716-446655440002', 'Plumbing Installation', 'plumbing', 18, 10),
  
  -- Industrial Warehouse checklists
  ('550e8400-e29b-41d4-a716-446655440003', 'Building Safety Act Compliance', 'safety', 25, 8),
  ('550e8400-e29b-41d4-a716-446655440003', 'Fire Safety Assessment', 'fire-safety', 30, 5),
  ('550e8400-e29b-41d4-a716-446655440003', 'Electrical Installation', 'electrical', 20, 3),
  
  -- Shopping Center Renovation checklists
  ('550e8400-e29b-41d4-a716-446655440004', 'Building Safety Act Compliance', 'safety', 25, 25),
  ('550e8400-e29b-41d4-a716-446655440004', 'Fire Safety Assessment', 'fire-safety', 30, 30),
  ('550e8400-e29b-41d4-a716-446655440004', 'Electrical Installation', 'electrical', 20, 18),
  ('550e8400-e29b-41d4-a716-446655440004', 'Accessibility Compliance', 'accessibility', 12, 12),
  
  -- Hospital Extension checklists
  ('550e8400-e29b-41d4-a716-446655440005', 'Building Safety Act Compliance', 'safety', 25, 5),
  ('550e8400-e29b-41d4-a716-446655440005', 'Fire Safety Assessment', 'fire-safety', 30, 8),
  ('550e8400-e29b-41d4-a716-446655440005', 'Electrical Installation', 'electrical', 20, 4),
  ('550e8400-e29b-41d4-a716-446655440005', 'Medical Gas Systems', 'medical', 15, 2);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_checklists_project_id ON checklists(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);

-- 6. Enable Row Level Security (RLS) - optional but recommended
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;

-- 7. Create policies for RLS (allow all for now - customize as needed)
CREATE POLICY "Allow all operations on projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all operations on checklists" ON checklists FOR ALL USING (true);
