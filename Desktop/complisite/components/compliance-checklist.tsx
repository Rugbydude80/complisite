'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Camera,
  CheckCircle,
  Clock,
  FileText,
  MapPin,
  AlertTriangle
} from 'lucide-react'
import { ProjectService } from '@/lib/project-service'

interface ComplianceChecklistProps {
  projectId: string
  compliance: any[]
  onUpdate: () => void
}

export function ComplianceChecklist({ 
  projectId, 
  compliance, 
  onUpdate 
}: ComplianceChecklistProps) {
  const [checklistItems, setChecklistItems] = useState<{ [key: string]: any[] }>({})
  const [completions, setCompletions] = useState<{ [key: string]: any[] }>({})
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({})

  const loadChecklistItems = async (templateId: string, complianceId: string) => {
    if (checklistItems[templateId]) return

    setLoading({ ...loading, [templateId]: true })

    try {
      const [items, comps] = await Promise.all([
        ProjectService.getChecklistItems(templateId),
        ProjectService.getChecklistCompletions(complianceId)
      ])

      setChecklistItems({ ...checklistItems, [templateId]: items })
      setCompletions({ ...completions, [complianceId]: comps })
    } catch (error) {
      console.error('Error loading checklist:', error)
    } finally {
      setLoading({ ...loading, [templateId]: false })
    }
  }

  const toggleChecklistItem = async (
    complianceId: string,
    itemId: string,
    completed: boolean
  ) => {
    try {
      const user = await getCurrentUser() // Implement this function
      
      await ProjectService.completeChecklistItem(complianceId, itemId, {
        completed,
        completed_by: user.id,
        completed_at: completed ? new Date().toISOString() : null
      })

      // Update local state
      const compCompletions = completions[complianceId] || []
      const existing = compCompletions.find(c => c.checklist_item_id === itemId)
      
      if (existing) {
        existing.completed = completed
      } else {
        compCompletions.push({
          checklist_item_id: itemId,
          completed,
          completed_at: new Date().toISOString()
        })
      }

      setCompletions({ 
        ...completions, 
        [complianceId]: [...compCompletions] 
      })

      onUpdate()
    } catch (error) {
      console.error('Error updating checklist:', error)
    }
  }

  const getStatusBadge = (status: string, progress: number) => {
    if (status === 'complete') {
      return <Badge className="bg-green-100 text-green-700">Complete</Badge>
    }
    if (status === 'overdue') {
      return <Badge className="bg-red-100 text-red-700">Overdue</Badge>
    }
    if (progress > 0) {
      return <Badge className="bg-blue-100 text-blue-700">In Progress</Badge>
    }
    return <Badge className="bg-gray-100 text-gray-700">Not Started</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700'
    }
    return (
      <Badge className={colors[priority as keyof typeof colors] || colors.medium}>
        {priority}
      </Badge>
    )
  }

  // Group compliance by category
  const groupedCompliance = compliance.reduce((acc, item) => {
    const category = item.template?.category || 'Other'
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {} as { [key: string]: any[] })

  return (
    <div className="space-y-6">
      {Object.entries(groupedCompliance).map(([category, items]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{category}</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {items.map((comp) => {
                const items = checklistItems[comp.template_id] || []
                const comps = completions[comp.id] || []
                const completedCount = comps.filter(c => c.completed).length

                return (
                  <AccordionItem key={comp.id} value={comp.id}>
                    <AccordionTrigger
                      onClick={() => loadChecklistItems(comp.template_id, comp.id)}
                      className="hover:no-underline"
                    >
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{comp.template?.name}</span>
                          {getStatusBadge(comp.status, comp.progress)}
                          {comp.template?.is_mandatory && (
                            <Badge variant="outline">Mandatory</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-500">
                            {completedCount}/{items.length}
                          </span>
                          <Progress 
                            value={comp.progress} 
                            className="w-24 h-2"
                          />
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {loading[comp.template_id] ? (
                        <div className="text-center py-4">Loading checklist...</div>
                      ) : (
                        <div className="space-y-4 pt-4">
                          {items.map((item) => {
                            const completion = comps.find(
                              c => c.checklist_item_id === item.id
                            )
                            const isCompleted = completion?.completed || false

                            return (
                              <div 
                                key={item.id} 
                                className={`p-4 rounded-lg border ${
                                  isCompleted ? 'bg-green-50 border-green-200' : 'bg-white'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <Checkbox
                                    checked={isCompleted}
                                    onCheckedChange={(checked) => 
                                      toggleChecklistItem(comp.id, item.id, checked as boolean)
                                    }
                                  />
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <p className="font-medium">{item.title}</p>
                                        {item.description && (
                                          <p className="text-sm text-gray-600 mt-1">
                                            {item.description}
                                          </p>
                                        )}
                                      </div>
                                      {getPriorityBadge(item.priority)}
                                    </div>

                                    {item.requires_evidence && (
                                      <div className="flex items-center gap-2 mt-2">
                                        {item.evidence_type === 'photo' && (
                                          <Button size="sm" variant="outline">
                                            <Camera className="h-4 w-4 mr-2" />
                                            Add Photo
                                          </Button>
                                        )}
                                        {item.evidence_type === 'document' && (
                                          <Button size="sm" variant="outline">
                                            <FileText className="h-4 w-4 mr-2" />
                                            Add Document
                                          </Button>
                                        )}
                                        {item.evidence_type === 'signature' && (
                                          <Button size="sm" variant="outline">
                                            Sign
                                          </Button>
                                        )}
                                      </div>
                                    )}

                                    {completion?.notes && (
                                      <div className="mt-2 p-2 bg-gray-50 rounded">
                                        <p className="text-sm">{completion.notes}</p>
                                      </div>
                                    )}

                                    {completion?.completed_at && (
                                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                                        <span className="flex items-center gap-1">
                                          <CheckCircle className="h-3 w-3" />
                                          Completed {new Date(completion.completed_at).toLocaleDateString()}
                                        </span>
                                        {completion.latitude && (
                                          <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            Location recorded
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}

                          {comp.notes && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm font-medium text-blue-900">Notes:</p>
                              <p className="text-sm text-blue-800 mt-1">{comp.notes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Helper function to get current user
async function getCurrentUser() {
  const { supabase } = await import('@/lib/supabase')
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
