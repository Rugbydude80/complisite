import { supabase } from '@/lib/supabase'

export interface UploadResult {
  path: string
  url: string
  metadata?: any
}

export interface EvidenceMetadata {
  latitude?: number
  longitude?: number
  description?: string
  checklist_item_id?: string
  weather_conditions?: string
}

export class StorageHelper {
  // Upload certificate
  static async uploadCertificate(
    userId: string,
    file: File
  ): Promise<UploadResult> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${file.name}`
    const filePath = `${userId}/${fileName}`

    const { data, error } = await supabase.storage
      .from('certificates')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('certificates')
      .getPublicUrl(filePath)

    return { path: filePath, url: publicUrl }
  }

  // Upload project file
  static async uploadProjectFile(
    projectId: string,
    file: File,
    category: 'compliance' | 'photos' | 'documents' = 'documents'
  ): Promise<UploadResult> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${file.name}`
    const filePath = `${projectId}/${category}/${fileName}`

    const { data, error } = await supabase.storage
      .from('project-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('project-files')
      .getPublicUrl(filePath)

    return { path: filePath, url: publicUrl }
  }

  // Upload evidence with metadata
  static async uploadEvidence(
    projectId: string,
    file: File,
    metadata: EvidenceMetadata
  ): Promise<UploadResult> {
    const date = new Date()
    const dateFolder = `${date.getFullYear()}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`
    const fileName = `${Date.now()}_${file.name}`
    const filePath = `${projectId}/${dateFolder}/${fileName}`

    const { data, error } = await supabase.storage
      .from('evidence')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Store metadata in database
    const { data: photoRecord, error: dbError } = await supabase
      .from('compliance_photos')
      .insert({
        project_id: projectId,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        description: metadata.description,
        latitude: metadata.latitude,
        longitude: metadata.longitude,
        weather_conditions: metadata.weather_conditions,
        uploaded_by: user.id,
        taken_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) throw dbError

    const { data: { publicUrl } } = supabase.storage
      .from('evidence')
      .getPublicUrl(filePath)

    return { 
      path: filePath, 
      url: publicUrl,
      metadata: photoRecord
    }
  }

  // Get signed URL for private file
  static async getSignedUrl(
    bucket: 'certificates' | 'project-files' | 'evidence',
    path: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) throw error
    return data.signedUrl
  }

  // Delete file
  static async deleteFile(
    bucket: 'certificates' | 'project-files' | 'evidence',
    path: string
  ): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) throw error
  }

  // List files in a folder
  static async listFiles(
    bucket: 'certificates' | 'project-files' | 'evidence',
    folder: string,
    options: {
      limit?: number
      offset?: number
      sortBy?: { column: string; order: 'asc' | 'desc' }
    } = {}
  ): Promise<any[]> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit: options.limit || 100,
        offset: options.offset || 0,
        sortBy: options.sortBy || { column: 'created_at', order: 'desc' }
      })

    if (error) throw error
    return data || []
  }

  // Get file metadata
  static async getFileMetadata(
    bucket: 'certificates' | 'project-files' | 'evidence',
    path: string
  ): Promise<any> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .getMetadata(path)

    if (error) throw error
    return data
  }

  // Update file metadata
  static async updateFileMetadata(
    bucket: 'certificates' | 'project-files' | 'evidence',
    path: string,
    metadata: Record<string, any>
  ): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .update(path, null, {
        metadata
      })

    if (error) throw error
  }

  // Copy file to another location
  static async copyFile(
    bucket: 'certificates' | 'project-files' | 'evidence',
    fromPath: string,
    toPath: string
  ): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .copy(fromPath, toPath)

    if (error) throw error
  }

  // Move file to another location
  static async moveFile(
    bucket: 'certificates' | 'project-files' | 'evidence',
    fromPath: string,
    toPath: string
  ): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .move(fromPath, toPath)

    if (error) throw error
  }

  // Get storage usage statistics
  static async getStorageStats(): Promise<{
    certificates: { count: number; size: number }
    projectFiles: { count: number; size: number }
    evidence: { count: number; size: number }
  }> {
    const buckets = ['certificates', 'project-files', 'evidence']
    const stats = {
      certificates: { count: 0, size: 0 },
      projectFiles: { count: 0, size: 0 },
      evidence: { count: 0, size: 0 }
    }

    for (const bucket of buckets) {
      const { data, error } = await supabase.storage
        .from(bucket as any)
        .list('', { limit: 1000 })

      if (!error && data) {
        const count = data.length
        const size = data.reduce((total, file) => total + (file.metadata?.size || 0), 0)
        
        if (bucket === 'certificates') {
          stats.certificates = { count, size }
        } else if (bucket === 'project-files') {
          stats.projectFiles = { count, size }
        } else if (bucket === 'evidence') {
          stats.evidence = { count, size }
        }
      }
    }

    return stats
  }

  // Clean up orphaned files (files not referenced in database)
  static async cleanupOrphanedFiles(): Promise<{
    deleted: number
    errors: string[]
  }> {
    const deleted = 0
    const errors: string[] = []

    // This would need to be implemented based on your specific needs
    // Example: Delete certificate files not referenced in user_certificates table
    
    return { deleted, errors }
  }
}
