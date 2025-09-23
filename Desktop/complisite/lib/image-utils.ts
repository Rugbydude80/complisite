/**
 * Image optimization utilities for construction compliance photos
 */

export interface ImageCompressionOptions {
  maxWidth: number
  maxHeight: number
  quality: number
  format?: 'jpeg' | 'webp'
}

export interface PhotoMetadata {
  uploaded_by: string
  company_id: string
  project_id: string
  checklist_item_id: string
  gps_location?: {
    latitude: number
    longitude: number
  }
  device: string
  timestamp: string
  original_size: number
  compressed_size: number
}

/**
 * Compress image for construction compliance photos
 * Optimized for mobile capture and evidence storage
 */
export async function compressImage(
  file: File, 
  options: ImageCompressionOptions = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8,
    format: 'jpeg'
  }
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img
      
      if (width > options.maxWidth || height > options.maxHeight) {
        const ratio = Math.min(options.maxWidth / width, options.maxHeight / height)
        width = Math.floor(width * ratio)
        height = Math.floor(height * ratio)
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: `image/${options.format}`,
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            reject(new Error('Failed to compress image'))
          }
        },
        `image/${options.format}`,
        options.quality
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Get current GPS location for evidence photos
 */
export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  if (!navigator.geolocation) {
    return null
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      },
      () => resolve(null),
      { timeout: 5000, enableHighAccuracy: false }
    )
  })
}

/**
 * Generate metadata for construction compliance photos
 */
export async function generatePhotoMetadata(
  checklistItemId: string,
  projectId: string,
  userId: string,
  companyId: string,
  originalFile: File,
  compressedFile: File
): Promise<PhotoMetadata> {
  const location = await getCurrentLocation()
  
  return {
    uploaded_by: userId,
    company_id: companyId,
    project_id: projectId,
    checklist_item_id: checklistItemId,
    gps_location: location || undefined,
    device: navigator.userAgent,
    timestamp: new Date().toISOString(),
    original_size: originalFile.size,
    compressed_size: compressedFile.size
  }
}

/**
 * Validate image file for construction compliance
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Please select an image file' }
  }

  // Check file size (max 50MB for construction photos)
  const maxSize = 50 * 1024 * 1024 // 50MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 50MB' }
  }

  // Check image dimensions (basic validation)
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      if (img.width < 100 || img.height < 100) {
        resolve({ valid: false, error: 'Image too small (minimum 100x100px)' })
      } else if (img.width > 8000 || img.height > 8000) {
        resolve({ valid: false, error: 'Image too large (maximum 8000x8000px)' })
      } else {
        resolve({ valid: true })
      }
    }
    img.onerror = () => resolve({ valid: false, error: 'Invalid image file' })
    img.src = URL.createObjectURL(file)
  }) as any
}
