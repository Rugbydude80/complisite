'use client'

import { useState } from 'react'
import { X, Expand } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Photo = {
  id: string
  url: string
  uploaded_at: string
}

type PhotoGalleryProps = {
  photos: Photo[]
  onDelete?: (photoId: string) => void
}

export function PhotoGallery({ photos, onDelete }: PhotoGalleryProps) {
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

      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Photo Evidence</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div>
              <img
                src={selectedPhoto.url}
                alt="Evidence"
                className="w-full rounded"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Uploaded {new Date(selectedPhoto.uploaded_at).toLocaleString()}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
