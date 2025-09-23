'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Camera, 
  Save, 
  CheckCircle2,
  AlertTriangle,
  FileText,
  MessageSquare
} from "lucide-react"
import { supabase } from '@/lib/supabase'
import { PhotoUpload } from '@/components/photo-upload'
import { SimplePhotoGallery } from '@/components/simple-photo-gallery'

type ChecklistItem = {
  id: string
  description: string
  section: string
  is_completed: boolean
  comments: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  requires_evidence: boolean
  evidence_count: number
  photos?: Photo[]
}

type Photo = {
  id: string
  url: string
  uploaded_at: string
}

type Checklist = {
  id: string
  name: string
  category: string
  project_id: string
  total_items: number
  completed_items: number
}

export default function ChecklistPage() {
  const params = useParams()
  const router = useRouter()
  const [checklist, setChecklist] = useState<Checklist | null>(null)
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (params.id) {
      fetchChecklistData(params.id as string)
    }
  }, [params.id])


  const fetchChecklistData = async (checklistId: string) => {
    try {
      // For now, create mock checklist data since the table might not exist yet
      const mockChecklist: Checklist = {
        id: checklistId,
        name: 'Fire Safety & Electrical Compliance Checklist',
        category: 'Safety Compliance',
        project_id: 'mock-project-id',
        total_items: 5,
        completed_items: 2
      }
      setChecklist(mockChecklist)

      // TODO: Uncomment when checklists table is created
      // const { data: checklistData, error: checklistError } = await supabase
      //   .from('checklists')
      //   .select('*')
      //   .eq('id', checklistId)
      //   .single()

      // if (checklistError) throw checklistError
      // setChecklist(checklistData)

      // For now, generate mock items (replace with real data later)
      const mockItems: ChecklistItem[] = [
        {
          id: '1',
          description: 'Fire exit routes clearly marked and unobstructed',
          section: 'Fire Safety',
          is_completed: true,
          comments: '',
          priority: 'critical',
          requires_evidence: true,
          evidence_count: 0,
          photos: []
        },
        {
          id: '2',
          description: 'Fire extinguishers inspected and within date',
          section: 'Fire Safety',
          is_completed: true,
          comments: 'All extinguishers checked - due for service next month',
          priority: 'high',
          requires_evidence: true,
          evidence_count: 0,
          photos: []
        },
        {
          id: '3',
          description: 'Emergency lighting operational',
          section: 'Fire Safety',
          is_completed: false,
          comments: '',
          priority: 'high',
          requires_evidence: false,
          evidence_count: 0
        },
        {
          id: '4',
          description: 'Electrical installations tested and certified',
          section: 'Electrical Safety',
          is_completed: false,
          comments: '',
          priority: 'critical',
          requires_evidence: true,
          evidence_count: 0
        },
        {
          id: '5',
          description: 'PAT testing completed for all portable equipment',
          section: 'Electrical Safety',
          is_completed: false,
          comments: '',
          priority: 'medium',
          requires_evidence: true,
          evidence_count: 0
        }
      ]
      setItems(mockItems)
      
      // Load photos from Supabase storage after items are set
      await loadPhotosFromSupabase(checklistId)
    } catch (error) {
      console.error('Error fetching checklist:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleItemToggle = (itemId: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, is_completed: !item.is_completed } : item
    ))
  }

  const handleCommentChange = (itemId: string, comment: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, comments: comment } : item
    ))
  }

  const loadPhotosFromSupabase = async (checklistId: string) => {
    try {
      // List files in the evidence bucket
      const { data: files, error } = await supabase.storage
        .from('evidence')
        .list('checklist-evidence', {
          limit: 100,
          offset: 0,
        })

      if (error) {
        console.error('Error loading photos from Supabase:', error)
        return
      }

      // Group photos by checklist item
      const photosByItem: Record<string, Photo[]> = {}
      
      files?.forEach(file => {
        // Files are named like "1-1758646399526.png" where "1" is the item ID
        const fileName = file.name
        const itemId = fileName.split('-')[0]
        
        const { data: { publicUrl } } = supabase.storage
          .from('evidence')
          .getPublicUrl(`checklist-evidence/${fileName}`)

        if (!photosByItem[itemId]) {
          photosByItem[itemId] = []
        }

        photosByItem[itemId].push({
          id: file.id || fileName,
          url: publicUrl,
          uploaded_at: file.created_at || new Date().toISOString()
        })
      })

      // Update items with their photos
      setItems(prev => prev.map(item => ({
        ...item,
        photos: photosByItem[item.id] || [],
        evidence_count: photosByItem[item.id]?.length || 0
      })))

    } catch (error) {
      console.error('Error loading photos:', error)
    }
  }

  const handlePhotoUploadComplete = (itemId: string, photoUrl: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newPhoto = {
          id: Date.now().toString(),
          url: photoUrl,
          uploaded_at: new Date().toISOString()
        }
        
        return {
          ...item,
          photos: [...(item.photos || []), newPhoto],
          evidence_count: (item.photos?.length || 0) + 1
        }
      }
      return item
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    // TODO: Save to database
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate save
    setSaving(false)
  }

  const toggleCommentExpand = (itemId: string) => {
    const newExpanded = new Set(expandedComments)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedComments(newExpanded)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading checklist...</div>
      </div>
    )
  }

  if (!checklist) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Checklist not found</div>
      </div>
    )
  }

  const completedCount = items.filter(item => item.is_completed).length
  const completionPercentage = (completedCount / items.length) * 100

  // Group items by section
  const itemsBySection = items.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = []
    acc[item.section].push(item)
    return acc
  }, {} as Record<string, ChecklistItem[]>)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{checklist.name}</h1>
              <p className="text-muted-foreground">{checklist.category}</p>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                'Saving...'
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Progress
                </>
              )}
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>{completedCount} of {items.length} completed</span>
              <span>{Math.round(completionPercentage)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </div>
      </div>


      {/* Bucket Access Test */}
      <div className="container mx-auto px-4 py-2">
        <div className="bg-blue-50 p-4 rounded-lg text-sm">
          <div className="flex items-center justify-between">
            <div>
              <strong>Bucket Access Test:</strong> Check if Supabase bucket is public
            </div>
            <button 
              onClick={async () => {
                try {
                  const response = await fetch('/api/test-bucket-access')
                  const data = await response.json()
                  console.log('Bucket access test:', data)
                  if (data.success && data.publicUrl) {
                    alert(`✅ Bucket accessible!\n\nTest URL: ${data.publicUrl}\n\nTry opening this URL in a new tab to see if the image loads.`)
                  } else {
                    alert(`❌ Bucket issue: ${data.error || 'Unknown error'}`)
                  }
                } catch (error) {
                  console.error('Bucket test error:', error)
                  alert('Error testing bucket access')
                }
              }}
              className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
            >
              Test Bucket Access
            </button>
          </div>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {Object.entries(itemsBySection).map(([section, sectionItems]) => (
          <div key={section}>
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              {section}
            </h2>
            <div className="space-y-3">
              {sectionItems.map((item) => (
                <Card 
                  key={item.id} 
                  className={item.is_completed ? 'opacity-75' : ''}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Main Item Row */}
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={item.is_completed}
                          onCheckedChange={() => handleItemToggle(item.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <p className={item.is_completed ? 'line-through text-muted-foreground' : ''}>
                              {item.description}
                            </p>
                            <Badge className={`${getPriorityColor(item.priority)} text-white ml-2`}>
                              {item.priority}
                            </Badge>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => toggleCommentExpand(item.id)}
                            >
                              <MessageSquare className="mr-1 h-3 w-3" />
                              {item.comments ? 'Edit Note' : 'Add Note'}
                            </Button>
                          </div>

                          {/* Photo Upload Section */}
                          {item.requires_evidence && (
                            <div className="space-y-2">
                              <PhotoUpload
                                checklistItemId={item.id}
                                onUploadComplete={(url) => handlePhotoUploadComplete(item.id, url)}
                              />
                              {/* Show existing photos */}
                              {item.photos && item.photos.length > 0 && (
                                <SimplePhotoGallery photos={item.photos} />
                              )}
                            </div>
                          )}

                          {/* Comments Section */}
                          {expandedComments.has(item.id) && (
                            <div className="mt-3">
                              <Textarea
                                placeholder="Add notes or comments..."
                                value={item.comments}
                                onChange={(e) => handleCommentChange(item.id, e.target.value)}
                                className="min-h-[80px]"
                              />
                            </div>
                          )}
                          
                          {/* Show existing comment preview */}
                          {item.comments && !expandedComments.has(item.id) && (
                            <p className="text-sm text-muted-foreground italic">
                              Note: {item.comments}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <Button size="lg" className="rounded-full shadow-lg" onClick={handleSave}>
          <Save className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
