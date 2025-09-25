const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function diagnoseRecursion() {
  console.log('🔍 Diagnosing RLS Recursion Issues...\n');

  const tests = [
    {
      name: 'organization_members',
      query: () => supabase.from('organization_members').select('id').limit(1)
    },
    {
      name: 'user_certificates', 
      query: () => supabase.from('user_certificates').select('id').limit(1)
    },
    {
      name: 'project_members',
      query: () => supabase.from('project_members').select('id').limit(1)
    },
    {
      name: 'organizations',
      query: () => supabase.from('organizations').select('id').limit(1)
    },
    {
      name: 'projects',
      query: () => supabase.from('projects').select('id').limit(1)
    }
  ];

  const results = {};

  for (const test of tests) {
    console.log(`🧪 Testing ${test.name}...`);
    
    try {
      const { data, error } = await test.query();
      
      if (error) {
        if (error.message.includes('infinite recursion detected in policy')) {
          console.log(`❌ ${test.name}: RECURSION ERROR`);
          results[test.name] = { status: 'recursion', error: error.message };
        } else {
          console.log(`⚠️  ${test.name}: Other error - ${error.message}`);
          results[test.name] = { status: 'other_error', error: error.message };
        }
      } else {
        console.log(`✅ ${test.name}: SUCCESS`);
        results[test.name] = { status: 'success', data: data };
      }
    } catch (err) {
      console.log(`❌ ${test.name}: Exception - ${err.message}`);
      results[test.name] = { status: 'exception', error: err.message };
    }
  }

  console.log('\n📊 DIAGNOSIS SUMMARY:');
  console.log('====================');
  
  const recursionIssues = Object.entries(results).filter(([_, result]) => result.status === 'recursion');
  const otherIssues = Object.entries(results).filter(([_, result]) => result.status !== 'success' && result.status !== 'recursion');
  const working = Object.entries(results).filter(([_, result]) => result.status === 'success');

  console.log(`✅ Working tables: ${working.map(([name, _]) => name).join(', ')}`);
  console.log(`❌ Recursion issues: ${recursionIssues.map(([name, _]) => name).join(', ')}`);
  console.log(`⚠️  Other issues: ${otherIssues.map(([name, _]) => name).join(', ')}`);

  if (recursionIssues.length > 0) {
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    console.log('======================');
    
    for (const [tableName, result] of recursionIssues) {
      console.log(`\n📋 ${tableName.toUpperCase()}:`);
      console.log(`   Issue: ${result.error}`);
      console.log(`   Action: Re-run FINAL_RLS_FIX_SQL.sql in Supabase Dashboard`);
      console.log(`   Focus: Check policies for ${tableName} table`);
    }
    
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Run FINAL_RLS_FIX_SQL.sql again');
    console.log('3. Pay special attention to policies for tables with recursion');
    console.log('4. Re-run this diagnosis script');
  } else {
    console.log('\n🎉 SUCCESS: No recursion issues detected!');
    console.log('✅ All RLS policies are working correctly');
  }

  return results;
}

diagnoseRecursion();
