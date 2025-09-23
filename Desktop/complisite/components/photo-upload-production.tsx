'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, X, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { compressImage, generatePhotoMetadata, validateImageFile } from '@/lib/image-utils'

type PhotoUploadProps = {
  checklistItemId: string
  projectId: string
  userId: string
  companyId: string
  onUploadComplete: (url: string) => void
}

export function PhotoUploadProduction({ 
  checklistItemId, 
  projectId,
  userId,
  companyId,
  onUploadComplete 
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Validate file
    const validation = await validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload with optimization
    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setUploading(true)
    setError(null)

    try {
      // Step 1: Compress image for construction compliance
      console.log('Compressing image for construction compliance...')
      const compressedFile = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8,
        format: 'jpeg'
      })

      console.log(`Image compressed: ${file.size} → ${compressedFile.size} bytes`)

      // Step 2: Generate metadata for audit trail
      const metadata = await generatePhotoMetadata(
        checklistItemId,
        projectId,
        userId,
        companyId,
        file,
        compressedFile
      )

      // Step 3: Create unique filename with timestamp
      const fileExt = compressedFile.name.split('.').pop()
      const timestamp = Date.now()
      const fileName = `${checklistItemId}-${timestamp}.${fileExt}`
      const filePath = `checklist-evidence/${fileName}`

      console.log('Uploading to Supabase storage:', filePath)

      // Step 4: Upload to Supabase with metadata
      const { data, error } = await supabase.storage
        .from('evidence')
        .upload(filePath, compressedFile, {
          metadata,
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Supabase storage error:', error)
        throw new Error(`Upload failed: ${error.message}`)
      }

      console.log('Upload successful:', data)

      // Step 5: Create signed URL for secure access
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('evidence')
        .createSignedUrl(filePath, 3600) // 1 hour expiry

      if (signedUrlError) {
        console.error('Error creating signed URL:', signedUrlError)
        throw new Error('Failed to create secure access URL')
      }

      const secureUrl = signedUrlData?.signedUrl
      if (!secureUrl) {
        throw new Error('Failed to get secure URL')
      }

      console.log('Secure URL created:', secureUrl)

      // Step 6: Save to database for audit trail
      await savePhotoRecord(checklistItemId, secureUrl, metadata)
      
      onUploadComplete(secureUrl)
      
      // Reset after successful upload
      setTimeout(() => {
        setPreview(null)
      }, 2000)

    } catch (error) {
      console.error('Upload error:', error)
      setError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const savePhotoRecord = async (itemId: string, url: string, metadata: any) => {
    try {
      // Save to database for audit trail and compliance tracking
      const { error } = await supabase
        .from('evidence_photos')
        .insert({
          checklist_item_id: itemId,
          project_id: metadata.project_id,
          uploaded_by: metadata.uploaded_by,
          company_id: metadata.company_id,
          url: url,
          metadata: metadata,
          uploaded_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error saving photo record:', error)
        // Don't throw error here - upload was successful
      } else {
        console.log('Photo record saved to database')
      }
    } catch (error) {
      console.error('Database error:', error)
    }
  }

  const clearPreview = () => {
    setPreview(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-md text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {preview ? (
        <Card className="relative p-2">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-48 object-cover rounded"
          />
          {uploading ? (
            <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
              <span className="ml-2 text-white">Uploading...</span>
            </div>
          ) : (
            <Button
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2"
              onClick={clearPreview}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </Card>
      ) : (
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1"
          >
            <Camera className="mr-2 h-4 w-4" />
            Take Photo
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </div>
      )}
    </div>
  )
}
