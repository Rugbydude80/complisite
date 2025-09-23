'use client'

import { useState } from 'react'
import { X, Plus, Users, CheckSquare, MapPin, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ProjectService } from '@/lib/project-service'

type TeamMember = {
  id: string
  name: string
  email: string
  role: string
}

type ChecklistTemplate = {
  id: string
  name: string
  description: string
  category: string
  items: number
}

type NewProjectFormProps = {
  onClose: () => void
  onProjectCreated: (projectId: string) => void
}

const checklistTemplates: ChecklistTemplate[] = [
  {
    id: 'safety-compliance',
    name: 'Safety Compliance',
    description: 'General safety and compliance checklist',
    category: 'Safety',
    items: 12
  },
  {
    id: 'fire-safety',
    name: 'Fire Safety & Electrical',
    description: 'Fire safety and electrical compliance checklist',
    category: 'Safety',
    items: 8
  },
  {
    id: 'structural',
    name: 'Structural Integrity',
    description: 'Structural and building integrity checks',
    category: 'Structural',
    items: 15
  },
  {
    id: 'environmental',
    name: 'Environmental Compliance',
    description: 'Environmental and sustainability checks',
    category: 'Environmental',
    items: 10
  },
  {
    id: 'accessibility',
    name: 'Accessibility Standards',
    description: 'ADA and accessibility compliance',
    category: 'Compliance',
    items: 7
  }
]

export function NewProjectForm({ onClose, onProjectCreated }: NewProjectFormProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // Form data
  const [projectData, setProjectData] = useState({
    name: '',
    address: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'planning'
  })
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedChecklists, setSelectedChecklists] = useState<string[]>([])
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'inspector' })

  const handleInputChange = (field: string, value: string) => {
    setProjectData(prev => ({ ...prev, [field]: value }))
  }

  const addTeamMember = () => {
    if (newMember.name && newMember.email) {
      const member: TeamMember = {
        id: Date.now().toString(),
        name: newMember.name,
        email: newMember.email,
        role: newMember.role
      }
      setTeamMembers(prev => [...prev, member])
      setNewMember({ name: '', email: '', role: 'inspector' })
    }
  }

  const removeTeamMember = (id: string) => {
    setTeamMembers(prev => prev.filter(member => member.id !== id))
  }

  const toggleChecklist = (checklistId: string) => {
    setSelectedChecklists(prev => 
      prev.includes(checklistId) 
        ? prev.filter(id => id !== checklistId)
        : [...prev, checklistId]
    )
  }

  const createProject = async () => {
    setLoading(true)
    try {
      // 1. Create the project
      const project = await ProjectService.createProject({
        name: projectData.name,
        address: projectData.address,
        description: projectData.description,
        status: projectData.status
      })

      // 2. Add team members
      if (teamMembers.length > 0) {
        await ProjectService.addTeamMembers(project.id, teamMembers)
      }

      // 3. Create selected checklists
      const selectedTemplates = checklistTemplates.filter(template => 
        selectedChecklists.includes(template.id)
      )
      
      if (selectedTemplates.length > 0) {
        await ProjectService.createChecklists(project.id, selectedTemplates)
      }

      onProjectCreated(project.id)
      onClose()
    } catch (error) {
      console.error('Error creating project:', error)
      alert(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => setStep(prev => Math.min(prev + 1, 3))
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Create New Project</CardTitle>
            <CardDescription>
              Step {step} of 3: {step === 1 ? 'Project Details' : step === 2 ? 'Team Members' : 'Checklists'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Project Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    placeholder="Downtown Office Complex"
                    value={projectData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={projectData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Project Address *</Label>
                <div className="flex">
                  <MapPin className="h-4 w-4 mt-3 mr-2 text-muted-foreground" />
                  <Input
                    id="address"
                    placeholder="123 Main Street, City, State 12345"
                    value={projectData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the project..."
                  rows={3}
                  value={projectData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <div className="flex">
                    <Calendar className="h-4 w-4 mt-3 mr-2 text-muted-foreground" />
                    <Input
                      id="startDate"
                      type="date"
                      value={projectData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <div className="flex">
                    <Calendar className="h-4 w-4 mt-3 mr-2 text-muted-foreground" />
                    <Input
                      id="endDate"
                      type="date"
                      value={projectData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Team Members */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Add Team Members</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Full Name"
                    value={newMember.name}
                    onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                  />
                  <Select value={newMember.role} onValueChange={(value) => setNewMember(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inspector">Inspector</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={addTeamMember} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {teamMembers.length > 0 && (
                <div className="space-y-2">
                  <Label>Team Members ({teamMembers.length})</Label>
                  <div className="space-y-2">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">{member.role}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTeamMember(member.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Checklists */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Checklist Templates</Label>
                <p className="text-sm text-muted-foreground">
                  Choose which compliance checklists to include in this project
                </p>
              </div>

              <div className="grid gap-3">
                {checklistTemplates.map((template) => (
                  <div key={template.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={template.id}
                      checked={selectedChecklists.includes(template.id)}
                      onCheckedChange={() => toggleChecklist(template.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={template.id} className="font-medium">
                          {template.name}
                        </Label>
                        <Badge variant="outline">{template.items} items</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.description}
                      </p>
                      <Badge variant="secondary" className="mt-2">
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {selectedChecklists.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <CheckSquare className="h-4 w-4 inline mr-1" />
                    {selectedChecklists.length} checklist{selectedChecklists.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={prevStep} disabled={step === 1}>
              Previous
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {step < 3 ? (
                <Button onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button onClick={createProject} disabled={loading || !projectData.name || !projectData.address}>
                  {loading ? 'Creating...' : 'Create Project'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
