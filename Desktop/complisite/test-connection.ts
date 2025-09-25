import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testConnection() {
  console.log('🧪 Testing database connection and secure views...\n')

  try {
    // Test secure views
    console.log('1. Testing secure_organizations view...')
    const { data: orgs, error: orgError } = await supabase
      .from('secure_organizations')
      .select('*')

    if (orgError) {
      console.error('❌ secure_organizations error:', orgError.message)
    } else {
      console.log('✅ secure_organizations working:', orgs?.length || 0, 'organizations found')
    }

    console.log('\n2. Testing secure_organization_members view...')
    const { data: members, error: memberError } = await supabase
      .from('secure_organization_members')
      .select('*')

    if (memberError) {
      console.error('❌ secure_organization_members error:', memberError.message)
    } else {
      console.log('✅ secure_organization_members working:', members?.length || 0, 'members found')
    }

    console.log('\n3. Testing user_org_memberships materialized view...')
    const { data: memberships, error: membershipError } = await supabase
      .from('user_org_memberships')
      .select('*')

    if (membershipError) {
      console.error('❌ user_org_memberships error:', membershipError.message)
    } else {
      console.log('✅ user_org_memberships working:', memberships?.length || 0, 'memberships found')
    }

    console.log('\n4. Testing helper functions...')
    const { data: accessTest, error: accessError } = await supabase.rpc('user_can_access_organization', {
      check_user_id: '00000000-0000-0000-0000-000000000000',
      org_id: '00000000-0000-0000-0000-000000000000'
    })

    if (accessError) {
      console.error('❌ user_can_access_organization error:', accessError.message)
    } else {
      console.log('✅ user_can_access_organization working')
    }

    console.log('\n5. Testing creating a project...')
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: 'Test Project - Connection Test',
        organization_id: orgs?.[0]?.id,
        status: 'planning',
        compliance_status: 'not_started',
        overall_progress: 0,
        risk_level: 'low'
      })
      .select()
      .single()

    if (projectError) {
      console.error('❌ Project creation error:', projectError.message)
    } else {
      console.log('✅ Project creation working:', project.name)

      // Clean up the test project
      await supabase.from('projects').delete().eq('id', project.id)
      console.log('✅ Test project cleaned up')
    }

    console.log('\n📊 CONNECTION TEST SUMMARY:')
    console.log('============================')
    if (orgError || memberError || membershipError || accessError || projectError) {
      console.log('❌ Some tests failed - check the errors above')
    } else {
      console.log('✅ All tests passed! Database is working correctly.')
      console.log('✅ Secure views are accessible')
      console.log('✅ Helper functions are working')
      console.log('✅ Project creation is working')
    }

  } catch (err) {
    console.error('❌ Connection test failed:', err)
  }
}

testConnection()
