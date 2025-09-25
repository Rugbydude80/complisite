require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testRealData() {
  console.log('🧪 Testing Real Data Flow...\n');

  try {
    console.log('1. Testing secure_organizations access...');
    const { data: orgs, error: orgError } = await supabase
      .from('secure_organizations')
      .select('*');

    if (orgError) {
      console.error('❌ secure_organizations error:', orgError.message);
    } else {
      console.log('✅ secure_organizations working:', orgs?.length || 0, 'organizations found');
    }

    console.log('\n2. Testing secure_organization_members access...');
    const { data: members, error: memberError } = await supabase
      .from('secure_organization_members')
      .select('*');

    if (memberError) {
      console.error('❌ secure_organization_members error:', memberError.message);
    } else {
      console.log('✅ secure_organization_members working:', members?.length || 0, 'members found');
    }

    console.log('\n3. Testing direct database access...');
    try {
      // Test direct queries to projects table
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .limit(5);

      if (projectsError) {
        console.error('❌ Projects query error:', projectsError.message);
      } else {
        console.log('✅ Projects table accessible:', projects?.length || 0, 'projects found');
      }
    } catch (error) {
      console.error('❌ Projects query error:', error.message);
    }

    console.log('\n4. Testing certificate access...');
    try {
      // Test direct queries to user_certificates table
      const { data: certs, error: certsError } = await supabase
        .from('user_certificates')
        .select('*')
        .limit(5);

      if (certsError) {
        console.error('❌ Certificates query error:', certsError.message);
      } else {
        console.log('✅ User certificates accessible:', certs?.length || 0, 'certificates found');
      }
    } catch (error) {
      console.error('❌ Certificates query error:', error.message);
    }

    console.log('\n5. Testing project_members access...');
    try {
      // Test direct queries to project_members table
      const { data: projMembers, error: projMembersError } = await supabase
        .from('project_members')
        .select('*')
        .limit(5);

      if (projMembersError) {
        console.error('❌ Project members query error:', projMembersError.message);
      } else {
        console.log('✅ Project members accessible:', projMembers?.length || 0, 'members found');
      }
    } catch (error) {
      console.error('❌ Project members query error:', error.message);
    }

    console.log('\n📊 REAL DATA TEST SUMMARY:');
    console.log('============================');
    if (orgError || memberError) {
      console.log('❌ Some secure views failed - check errors above');
    } else {
      console.log('✅ Secure views working correctly');
      console.log('✅ Services can access real data');
      console.log('✅ Application ready for testing');
    }

    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Open http://localhost:3000 in your browser');
    console.log('2. Sign up for a new account');
    console.log('3. Create an organization');
    console.log('4. Add team members');
    console.log('5. Create a project');
    console.log('6. Upload certificates');

  } catch (err) {
    console.error('❌ Real data test failed:', err.message);
  }
}

testRealData();
