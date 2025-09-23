'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Photo = {
  id: string
  url: string
  uploaded_at: string
}

type SimplePhotoGalleryProps = {
  photos: Photo[]
  onDelete?: (photoId: string) => void
}

export function SimplePhotoGallery({ photos, onDelete }: SimplePhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  if (photos.length === 0) {
    return null
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2 mt-3">
        {photos.map((photo) => (
          <div key={photo.id} className="relative group">
            <img
              src={photo.url}
              alt="Evidence"
              className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-90"
              onClick={() => setSelectedPhoto(photo)}
              onError={(e) => {
                console.error('Failed to load image:', photo.url)
                e.currentTarget.style.display = 'none'
              }}
            />
            {onDelete && (
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(photo.id)
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Simple Modal without Radix UI */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Photo Evidence</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPhoto(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <img
                src={selectedPhoto.url}
                alt="Evidence"
                className="w-full rounded"
                onError={(e) => {
                  console.error('Failed to load modal image:', selectedPhoto.url)
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2YjcyODAiPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4='
                }}
              />
              <p className="text-sm text-gray-500 mt-2">
                Uploaded {new Date(selectedPhoto.uploaded_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
