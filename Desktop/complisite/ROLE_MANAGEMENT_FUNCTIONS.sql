-- ============================================
-- ROLE MANAGEMENT FUNCTIONS FOR COMPLISITE
-- ============================================
-- 
-- This script adds role management functions to the Complisite database
-- including user role detection and role-based access control
-- ============================================

-- Add role column to user_profiles if not exists
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS 
  user_type TEXT DEFAULT 'worker' 
  CHECK (user_type IN ('worker', 'manager', 'admin'));

-- Function to get user's highest role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  role TEXT;
BEGIN
  -- Check if user is org admin
  SELECT 'admin' INTO role
  FROM organization_members
  WHERE organization_members.user_id = $1
  AND organization_members.role = 'admin'
  LIMIT 1;
  
  IF role IS NOT NULL THEN
    RETURN role;
  END IF;
  
  -- Check if user is project manager
  SELECT 'manager' INTO role
  FROM project_members
  WHERE project_members.user_id = $1
  AND project_members.role = 'admin'
  LIMIT 1;
  
  IF role IS NOT NULL THEN
    RETURN role;
  END IF;
  
  -- Default to worker
  RETURN 'worker';
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION user_has_role(user_id UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := get_user_role(user_id);
  
  -- Admin has access to everything
  IF user_role = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Manager has access to manager and worker features
  IF user_role = 'manager' AND required_role IN ('manager', 'worker') THEN
    RETURN true;
  END IF;
  
  -- Worker only has access to worker features
  IF user_role = 'worker' AND required_role = 'worker' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's accessible navigation items
CREATE OR REPLACE FUNCTION get_user_navigation_items(user_id UUID)
RETURNS TABLE (
  label TEXT,
  href TEXT,
  icon TEXT,
  roles TEXT[]
) AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := get_user_role(user_id);
  
  -- Return navigation items based on user role
  IF user_role = 'admin' THEN
    RETURN QUERY
    SELECT 'Dashboard'::TEXT, '/dashboard'::TEXT, 'Home'::TEXT, ARRAY['admin', 'manager', 'worker']::TEXT[]
    UNION ALL
    SELECT 'Projects'::TEXT, '/projects'::TEXT, 'FolderKanban'::TEXT, ARRAY['admin', 'manager', 'worker']::TEXT[]
    UNION ALL
    SELECT 'Team'::TEXT, '/team'::TEXT, 'Users'::TEXT, ARRAY['admin', 'manager']::TEXT[]
    UNION ALL
    SELECT 'Reports'::TEXT, '/reports'::TEXT, 'FileText'::TEXT, ARRAY['admin', 'manager']::TEXT[]
    UNION ALL
    SELECT 'Analytics'::TEXT, '/analytics'::TEXT, 'BarChart3'::TEXT, ARRAY['admin']::TEXT[]
    UNION ALL
    SELECT 'Settings'::TEXT, '/settings'::TEXT, 'Settings'::TEXT, ARRAY['admin', 'manager', 'worker']::TEXT[];
  ELSIF user_role = 'manager' THEN
    RETURN QUERY
    SELECT 'Dashboard'::TEXT, '/dashboard'::TEXT, 'Home'::TEXT, ARRAY['admin', 'manager', 'worker']::TEXT[]
    UNION ALL
    SELECT 'Projects'::TEXT, '/projects'::TEXT, 'FolderKanban'::TEXT, ARRAY['admin', 'manager', 'worker']::TEXT[]
    UNION ALL
    SELECT 'Team'::TEXT, '/team'::TEXT, 'Users'::TEXT, ARRAY['admin', 'manager']::TEXT[]
    UNION ALL
    SELECT 'Reports'::TEXT, '/reports'::TEXT, 'FileText'::TEXT, ARRAY['admin', 'manager']::TEXT[]
    UNION ALL
    SELECT 'Settings'::TEXT, '/settings'::TEXT, 'Settings'::TEXT, ARRAY['admin', 'manager', 'worker']::TEXT[];
  ELSE
    RETURN QUERY
    SELECT 'Dashboard'::TEXT, '/dashboard'::TEXT, 'Home'::TEXT, ARRAY['admin', 'manager', 'worker']::TEXT[]
    UNION ALL
    SELECT 'Projects'::TEXT, '/projects'::TEXT, 'FolderKanban'::TEXT, ARRAY['admin', 'manager', 'worker']::TEXT[]
    UNION ALL
    SELECT 'My Certificates'::TEXT, '/certificates'::TEXT, 'Award'::TEXT, ARRAY['worker']::TEXT[]
    UNION ALL
    SELECT 'Settings'::TEXT, '/settings'::TEXT, 'Settings'::TEXT, ARRAY['admin', 'manager', 'worker']::TEXT[];
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's dashboard data based on role
CREATE OR REPLACE FUNCTION get_user_dashboard_data(user_id UUID)
RETURNS JSON AS $$
DECLARE
  user_role TEXT;
  dashboard_data JSON;
BEGIN
  user_role := get_user_role(user_id);
  
  IF user_role = 'admin' THEN
    -- Admin dashboard data
    SELECT json_build_object(
      'role', 'admin',
      'title', 'Organization Dashboard',
      'subtitle', 'Complete oversight of all projects, teams, and compliance',
      'stats', json_build_object(
        'total_projects', (SELECT COUNT(*) FROM projects),
        'total_users', (SELECT COUNT(*) FROM user_profiles),
        'compliance_rate', 96,
        'active_issues', 7
      )
    ) INTO dashboard_data;
  ELSIF user_role = 'manager' THEN
    -- Manager dashboard data
    SELECT json_build_object(
      'role', 'manager',
      'title', 'Project Management Dashboard',
      'subtitle', 'Oversee team performance and project compliance',
      'stats', json_build_object(
        'active_projects', (SELECT COUNT(*) FROM projects WHERE status = 'active'),
        'team_members', (SELECT COUNT(*) FROM project_members WHERE user_id = $1),
        'compliance_rate', 94,
        'issues', 3
      )
    ) INTO dashboard_data;
  ELSE
    -- Worker dashboard data
    SELECT json_build_object(
      'role', 'worker',
      'title', 'My Compliance Dashboard',
      'subtitle', 'Manage your certificates and compliance tasks',
      'stats', json_build_object(
        'valid_certificates', (SELECT COUNT(*) FROM certificates WHERE user_id = $1 AND status = 'valid'),
        'expiring_soon', (SELECT COUNT(*) FROM certificates WHERE user_id = $1 AND expiry_date < NOW() + INTERVAL '30 days'),
        'tasks_today', 3
      )
    ) INTO dashboard_data;
  END IF;
  
  RETURN dashboard_data;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organization_members_user_role 
ON organization_members(user_id, role);

CREATE INDEX IF NOT EXISTS idx_project_members_user_role 
ON project_members(user_id, role);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type 
ON user_profiles(user_type);

-- Create a view for user roles
CREATE OR REPLACE VIEW user_roles AS
SELECT 
  up.user_id,
  up.full_name,
  up.user_type,
  get_user_role(up.user_id) as effective_role,
  om.organization_id,
  om.role as organization_role
FROM user_profiles up
LEFT JOIN organization_members om ON up.user_id = om.user_id;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_navigation_items(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_dashboard_data(UUID) TO authenticated;
GRANT SELECT ON user_roles TO authenticated;

-- Create RLS policies for role-based access
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Only admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Add notification count function
CREATE OR REPLACE FUNCTION get_user_notification_count(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM certificate_notifications
    WHERE certificate_notifications.user_id = $1
    AND read_at IS NULL
  );
END;
$$ LANGUAGE plpgsql;

-- Grant permission for notification count function
GRANT EXECUTE ON FUNCTION get_user_notification_count(UUID) TO authenticated;
