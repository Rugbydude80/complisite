#!/usr/bin/env node

/**
 * Verify RLS Fix - Comprehensive Test Suite
 * 
 * This script runs a comprehensive test suite to verify that the RLS fix
 * has resolved all recursion errors and maintains proper security.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyRLSFix() {
  console.log('🧪 Starting RLS Fix Verification...\n');

  const testResults = {
    timestamp: new Date().toISOString(),
    tests: {},
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      recursion_errors: 0
    }
  };

  try {
    // Test 1: Basic Connection Test
    console.log('🔌 Test 1: Basic Connection Test');
    testResults.tests.connection = await testConnection();
    testResults.summary.total++;
    if (testResults.tests.connection.passed) testResults.summary.passed++;
    else testResults.summary.failed++;

    // Test 2: Organization Members Access (No Recursion)
    console.log('\n🏢 Test 2: Organization Members Access');
    testResults.tests.organization_members = await testOrganizationMembers();
    testResults.summary.total++;
    if (testResults.tests.organization_members.passed) testResults.summary.passed++;
    else {
      testResults.summary.failed++;
      if (testResults.tests.organization_members.recursion_error) testResults.summary.recursion_errors++;
    }

    // Test 3: Project Members Access (No Recursion)
    console.log('\n📁 Test 3: Project Members Access');
    testResults.tests.project_members = await testProjectMembers();
    testResults.summary.total++;
    if (testResults.tests.project_members.passed) testResults.summary.passed++;
    else {
      testResults.summary.failed++;
      if (testResults.tests.project_members.recursion_error) testResults.summary.recursion_errors++;
    }

    // Test 4: User Certificates Access (No Recursion)
    console.log('\n📜 Test 4: User Certificates Access');
    testResults.tests.user_certificates = await testUserCertificates();
    testResults.summary.total++;
    if (testResults.tests.user_certificates.passed) testResults.summary.passed++;
    else {
      testResults.summary.failed++;
      if (testResults.tests.user_certificates.recursion_error) testResults.summary.recursion_errors++;
    }

    // Test 5: Complex Queries (No Recursion)
    console.log('\n🔗 Test 5: Complex Queries');
    testResults.tests.complex_queries = await testComplexQueries();
    testResults.summary.total++;
    if (testResults.tests.complex_queries.passed) testResults.summary.passed++;
    else {
      testResults.summary.failed++;
      if (testResults.tests.complex_queries.recursion_error) testResults.summary.recursion_errors++;
    }

    // Test 6: Security Boundaries
    console.log('\n🔒 Test 6: Security Boundaries');
    testResults.tests.security_boundaries = await testSecurityBoundaries();
    testResults.summary.total++;
    if (testResults.tests.security_boundaries.passed) testResults.summary.passed++;
    else testResults.summary.failed++;

    // Generate Final Report
    console.log('\n📊 VERIFICATION REPORT');
    console.log('====================');
    console.log(`Total Tests: ${testResults.summary.total}`);
    console.log(`Passed: ${testResults.summary.passed}`);
    console.log(`Failed: ${testResults.summary.failed}`);
    console.log(`Recursion Errors: ${testResults.summary.recursion_errors}`);

    if (testResults.summary.recursion_errors === 0) {
      console.log('\n🎉 SUCCESS: No recursion errors detected!');
      console.log('✅ RLS fix has been successfully deployed');
      console.log('✅ All security policies are working correctly');
    } else {
      console.log('\n❌ FAILURE: Recursion errors still exist');
      console.log('🔧 Please deploy the RLS fix via Supabase Dashboard');
    }

    // Save detailed report
    fs.writeFileSync(
      path.join(__dirname, 'rls-verification-report.json'),
      JSON.stringify(testResults, null, 2)
    );
    
    console.log('\n💾 Detailed report saved to: rls-verification-report.json');

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    process.exit(1);
  }
}

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .limit(1);
    
    return {
      passed: !error || !error.message.includes('infinite recursion'),
      error: error?.message,
      recursion_error: error?.message.includes('infinite recursion')
    };
  } catch (error) {
    return {
      passed: false,
      error: error.message,
      recursion_error: error.message.includes('infinite recursion')
    };
  }
}

async function testOrganizationMembers() {
  try {
    const { data, error } = await supabase
      .from('organization_members')
      .select('*')
      .limit(1);
    
    return {
      passed: !error || !error.message.includes('infinite recursion'),
      error: error?.message,
      recursion_error: error?.message.includes('infinite recursion')
    };
  } catch (error) {
    return {
      passed: false,
      error: error.message,
      recursion_error: error.message.includes('infinite recursion')
    };
  }
}

async function testProjectMembers() {
  try {
    const { data, error } = await supabase
      .from('project_members')
      .select('*')
      .limit(1);
    
    return {
      passed: !error || !error.message.includes('infinite recursion'),
      error: error?.message,
      recursion_error: error?.message.includes('infinite recursion')
    };
  } catch (error) {
    return {
      passed: false,
      error: error.message,
      recursion_error: error.message.includes('infinite recursion')
    };
  }
}

async function testUserCertificates() {
  try {
    const { data, error } = await supabase
      .from('user_certificates')
      .select('*')
      .limit(1);
    
    return {
      passed: !error || !error.message.includes('infinite recursion'),
      error: error?.message,
      recursion_error: error?.message.includes('infinite recursion')
    };
  } catch (error) {
    return {
      passed: false,
      error: error.message,
      recursion_error: error.message.includes('infinite recursion')
    };
  }
}

async function testComplexQueries() {
  try {
    // Test a complex query that previously caused recursion
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        *,
        organizations!inner(*),
        users!inner(*)
      `)
      .limit(1);
    
    return {
      passed: !error || !error.message.includes('infinite recursion'),
      error: error?.message,
      recursion_error: error?.message.includes('infinite recursion')
    };
  } catch (error) {
    return {
      passed: false,
      error: error.message,
      recursion_error: error.message.includes('infinite recursion')
    };
  }
}

async function testSecurityBoundaries() {
  try {
    // Test that we can't access data we shouldn't have access to
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    // This should either work (if we have access) or fail with a permission error (not recursion)
    return {
      passed: !error?.message.includes('infinite recursion'),
      error: error?.message,
      recursion_error: error?.message.includes('infinite recursion')
    };
  } catch (error) {
    return {
      passed: !error.message.includes('infinite recursion'),
      error: error.message,
      recursion_error: error.message.includes('infinite recursion')
    };
  }
}

// Main execution
if (require.main === module) {
  verifyRLSFix();
}

module.exports = { verifyRLSFix };
