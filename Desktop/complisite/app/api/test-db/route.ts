import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Test basic connection
    const { data, error } = await supabase
      .from('companies')
      .select('count')
      .limit(1)
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: 'Database connection failed'
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      data: data
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Database test failed'
    }, { status: 500 })
  }
}
