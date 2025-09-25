import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    const results = []
    
    // Test 1: Authentication
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      results.push({
        test: 'Authentication',
        success: !error,
        message: error ? error.message : 'User authentication working',
        data: user ? { id: user.id, email: user.email } : null
      })
    } catch (err) {
      results.push({
        test: 'Authentication',
        success: false,
        message: err instanceof Error ? err.message : 'Auth test failed'
      })
    }
    
    // Test 2: Basic table access
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .limit(1)
      
      results.push({
        test: 'Companies Table',
        success: !error,
        message: error ? error.message : 'Companies table accessible',
        data: data
      })
    } catch (err) {
      results.push({
        test: 'Companies Table',
        success: false,
        message: err instanceof Error ? err.message : 'Companies test failed'
      })
    }
    
    // Test 3: Certificate Types
    try {
      const { data, error } = await supabase
        .from('certificate_types')
        .select('*')
        .limit(5)
      
      results.push({
        test: 'Certificate Types',
        success: !error,
        message: error ? error.message : 'Certificate types accessible',
        data: data
      })
    } catch (err) {
      results.push({
        test: 'Certificate Types',
        success: false,
        message: err instanceof Error ? err.message : 'Certificate types test failed'
      })
    }
    
    // Test 4: Compliance Templates
    try {
      const { data, error } = await supabase
        .from('compliance_templates')
        .select('*')
        .limit(5)
      
      results.push({
        test: 'Compliance Templates',
        success: !error,
        message: error ? error.message : 'Compliance templates accessible',
        data: data
      })
    } catch (err) {
      results.push({
        test: 'Compliance Templates',
        success: false,
        message: err instanceof Error ? err.message : 'Compliance templates test failed'
      })
    }
    
    // Test 5: Project Types
    try {
      const { data, error } = await supabase
        .from('project_types')
        .select('*')
        .limit(5)
      
      results.push({
        test: 'Project Types',
        success: !error,
        message: error ? error.message : 'Project types accessible',
        data: data
      })
    } catch (err) {
      results.push({
        test: 'Project Types',
        success: false,
        message: err instanceof Error ? err.message : 'Project types test failed'
      })
    }
    
    const successCount = results.filter(r => r.success).length
    const totalTests = results.length
    
    return NextResponse.json({
      success: true,
      summary: {
        totalTests,
        successfulTests: successCount,
        failedTests: totalTests - successCount,
        successRate: `${Math.round((successCount / totalTests) * 100)}%`
      },
      results
    })
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Feature testing failed'
    }, { status: 500 })
  }
}
