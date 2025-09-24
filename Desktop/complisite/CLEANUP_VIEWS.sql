-- ============================================
-- CLEANUP SCRIPT - REMOVE PROBLEMATIC VIEWS
-- ============================================
-- 
-- This script removes any views that might be causing conflicts
-- ============================================

-- Drop any problematic views that might exist
DROP VIEW IF EXISTS certificate_details;
DROP VIEW IF EXISTS user_roles;

-- Drop any functions that might be causing issues
DROP FUNCTION IF EXISTS get_certificate_stats(UUID);
DROP FUNCTION IF EXISTS get_user_role(UUID);
DROP FUNCTION IF EXISTS user_has_role(UUID, TEXT);
DROP FUNCTION IF EXISTS get_user_navigation_items(UUID);
DROP FUNCTION IF EXISTS get_user_dashboard_data(UUID);
DROP FUNCTION IF EXISTS get_user_notification_count(UUID);

-- Clean up any tables that might have been created with conflicts
DROP TABLE IF EXISTS certificate_types_new;
DROP TABLE IF EXISTS certificate_types_backup;
