const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkCurrentPolicies() {
  console.log('🔍 Checking Current RLS Policies Status...\n');

  try {
    // Read the SQL check script
    const fs = require('fs');
    const checkSQL = fs.readFileSync('./CHECK_CURRENT_POLICIES.sql', 'utf8');
    
    // Execute the check
    const { data, error } = await supabase.rpc('exec_sql', { sql: checkSQL });
    
    if (error) {
      console.error('❌ Error running policy check:', error);
      return;
    }
    
    console.log('📊 Policy Check Results:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    
    // Try alternative approach - direct queries
    console.log('\n🔄 Trying alternative approach...\n');
    
    try {
      // Check helper functions
      const { data: functions, error: funcError } = await supabase
        .from('pg_proc')
        .select('proname')
        .in('proname', ['is_org_member', 'is_project_member', 'is_org_admin']);
      
      if (!funcError) {
        console.log('✅ Helper functions found:', functions?.map(f => f.proname) || []);
      }
      
      // Test direct queries
      console.log('\n🧪 Testing direct queries...');
      
      const { data: orgMembers, error: orgError } = await supabase
        .from('organization_members')
        .select('id')
        .limit(1);
      
      if (orgError) {
        console.log('❌ organization_members query failed:', orgError.message);
      } else {
        console.log('✅ organization_members query successful');
      }
      
      const { data: userCerts, error: certError } = await supabase
        .from('user_certificates')
        .select('id')
        .limit(1);
      
      if (certError) {
        console.log('❌ user_certificates query failed:', certError.message);
      } else {
        console.log('✅ user_certificates query successful');
      }
      
    } catch (altErr) {
      console.error('❌ Alternative approach failed:', altErr.message);
    }
  }
}

checkCurrentPolicies();
