import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // List of required tables
    const requiredTables = [
      'companies',
      'users', 
      'user_profiles',
      'organizations',
      'organization_members',
      'projects',
      'project_types',
      'project_members',
      'project_compliance',
      'compliance_templates',
      'compliance_checklist_items',
      'checklist_completions',
      'user_certificates',
      'certificate_types',
      'certificate_shares',
      'project_required_certificates',
      'compliance_photos',
      'daily_reports',
      'compliance_alerts',
      'invitations',
      'activity_logs'
    ]
    
    const results = []
    
    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          results.push({
            table,
            exists: false,
            error: error.message
          })
        } else {
          results.push({
            table,
            exists: true,
            recordCount: data?.length || 0
          })
        }
      } catch (err) {
        results.push({
          table,
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }
    
    const existingTables = results.filter(r => r.exists)
    const missingTables = results.filter(r => !r.exists)
    
    return NextResponse.json({
      success: true,
      summary: {
        totalTables: requiredTables.length,
        existingTables: existingTables.length,
        missingTables: missingTables.length
      },
      existingTables,
      missingTables,
      allTables: results
    })
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Schema verification failed'
    }, { status: 500 })
  }
}
