import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test Supabase connection
    const { data, error } = await supabase.storage.listBuckets()
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        buckets: null 
      })
    }

    return NextResponse.json({ 
      success: true, 
      buckets: data,
      message: 'Supabase connection successful' 
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      buckets: null 
    })
  }
}
