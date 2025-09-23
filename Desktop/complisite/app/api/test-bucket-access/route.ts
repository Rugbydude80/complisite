import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test if we can access bucket info
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      return NextResponse.json({ 
        success: false, 
        error: bucketsError.message 
      })
    }

    const evidenceBucket = buckets?.find(bucket => bucket.name === 'evidence')
    
    if (!evidenceBucket) {
      return NextResponse.json({ 
        success: false, 
        error: 'Evidence bucket not found' 
      })
    }

    // Test if we can list files in the bucket
    const { data: files, error: filesError } = await supabase.storage
      .from('evidence')
      .list('checklist-evidence', { limit: 1 })

    if (filesError) {
      return NextResponse.json({ 
        success: false, 
        error: `Cannot access bucket files: ${filesError.message}`,
        bucket: evidenceBucket
      })
    }

    // Test if we can get a public URL
    if (files && files.length > 0) {
      const testFile = files[0]
      const { data: { publicUrl } } = supabase.storage
        .from('evidence')
        .getPublicUrl(`checklist-evidence/${testFile.name}`)

      return NextResponse.json({ 
        success: true, 
        bucket: evidenceBucket,
        testFile: testFile.name,
        publicUrl: publicUrl,
        message: 'Bucket is accessible. Check if the URL loads in browser.'
      })
    }

    return NextResponse.json({ 
      success: true, 
      bucket: evidenceBucket,
      message: 'Bucket exists but no files found'
    })

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
