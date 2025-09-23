'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

type PhotoUploadProps = {
  checklistItemId: string
  onUploadComplete: (url: string) => void
}

export function PhotoUpload({ checklistItemId, onUploadComplete }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to Supabase
    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${checklistItemId}-${Date.now()}.${fileExt}`
      const filePath = `checklist-evidence/${fileName}`

      console.log('Uploading to Supabase storage:', filePath)

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('evidence')
        .upload(filePath, file)

      if (error) {
        console.error('Supabase storage error:', error)
        throw new Error(`Upload failed: ${error.message}`)
      }

      console.log('Upload successful:', data)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('evidence')
        .getPublicUrl(filePath)

      if (!publicUrl) {
        throw new Error('Failed to get public URL for uploaded file')
      }

      console.log('Public URL:', publicUrl)

      // Save to database
      await savePhotoRecord(checklistItemId, publicUrl)
      onUploadComplete(publicUrl)
      
      // Reset after successful upload
      setTimeout(() => {
        setPreview(null)
      }, 2000)
    } catch (error) {
      console.error('Upload error:', error)
      alert(`Failed to upload photo: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
    } finally {
      setUploading(false)
    }
  }

  const savePhotoRecord = async (itemId: string, url: string) => {
    // TODO: Uncomment when photos table is created
    // const { error } = await supabase
    //   .from('photos')
    //   .insert({
    //     checklist_id: itemId, // You'll need to adjust this
    //     item_id: itemId,
    //     url: url,
    //     metadata: {
    //       uploaded_at: new Date().toISOString(),
    //       device: navigator.userAgent
    //     }
    //   })

    // if (error) console.error('Error saving photo record:', error)
    
    // For now, just log the upload
    console.log('Photo uploaded:', { itemId, url })
  }

  const clearPreview = () => {
    setPreview(null)
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
