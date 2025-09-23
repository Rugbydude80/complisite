import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('Testing Supabase photo loading...')
    
    // List files in the evidence bucket
    const { data: files, error } = await supabase.storage
      .from('evidence')
      .list('checklist-evidence', {
        limit: 100,
        offset: 0,
      })

    if (error) {
      console.error('Error listing files:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        files: null 
      })
    }

    console.log('Files found:', files)

    // Get public URLs for each file
    const filesWithUrls = files?.map(file => {
      const publicUrl = supabase.storage
        .from('evidence')
        .getPublicUrl(`checklist-evidence/${file.name}`).data.publicUrl
      
      return {
        name: file.name,
        url: publicUrl,
        size: file.metadata?.size,
        created_at: file.created_at
      }
    }) || []

    return NextResponse.json({ 
      success: true, 
      files: filesWithUrls,
      count: filesWithUrls.length
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      files: null 
    })
  }
}
