'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

export function SupabaseTest() {
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setStatus('Testing Supabase connection...')

    try {
      // Test storage buckets
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      
      if (bucketsError) {
        setStatus(`Error listing buckets: ${bucketsError.message}`)
        return
      }

      setStatus(`✅ Connection successful! Found ${buckets?.length || 0} buckets.`)
      
      // Test if evidence bucket exists
      const evidenceBucket = buckets?.find(bucket => bucket.name === 'evidence')
      if (evidenceBucket) {
        setStatus(prev => prev + ' Evidence bucket found!')
      } else {
        setStatus(prev => prev + ' ⚠️ Evidence bucket not found - you may need to create it.')
      }

    } catch (error) {
      setStatus(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Supabase Connection Test</h3>
      <Button onClick={testConnection} disabled={loading}>
        {loading ? 'Testing...' : 'Test Connection'}
      </Button>
      {status && (
        <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
          {status}
        </div>
      )}
    </div>
  )
}
