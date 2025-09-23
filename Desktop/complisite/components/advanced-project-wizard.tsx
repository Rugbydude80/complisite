'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Plus, Users, CheckSquare, MapPin, Calendar, ArrowRight, ArrowLeft, Building2, UserPlus, Save, Upload, Eye, Search, Copy, Trash2, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ProjectService } from '@/lib/project-service'

type TeamMember = {
  id: string
  name: string
  email: string
  role: 'administrator' | 'member' | 'viewer'
  status: 'pending' | 'invited' | 'active'
}

type ChecklistTemplate = {
  id: string
  name: string
  description: string
  category: string
  items: number
  defaultTasks: string[]
  defaultAssignees: string[]
  estimatedDuration: string
  complexity: 'low' | 'medium' | 'high'
}

type ProjectAccess = 'open' | 'limited' | 'private'

type AdvancedProjectWizardProps = {
  onClose: () => void
  onProjectCreated: (projectId: string) => void
}

const checklistTemplates: ChecklistTemplate[] = [
  {
    id: 'safety-compliance',
    name: 'Safety Compliance',
    description: 'Comprehensive safety and compliance checklist with standard tasks',
    category: 'Safety',
    items: 12,
    defaultTasks: [
      'Safety equipment inspection',
      'Emergency procedures review',
      'Hazard identification',
      'Safety training verification',
      'PPE compliance check',
      'Incident reporting setup'
    ],
    defaultAssignees: ['Safety Officer', 'Site Manager'],
    estimatedDuration: '2-3 days',
    complexity: 'medium'
  },
  {
    id: 'fire-safety',
    name: 'Fire Safety & Electrical',
    description: 'Fire safety and electrical compliance checklist',
    category: 'Safety',
    items: 8,
    defaultTasks: [
      'Fire extinguisher inspection',
      'Emergency lighting test',
      'Electrical panel check',
      'Exit route verification',
      'Smoke detector testing',
      'Fire alarm system check'
    ],
    defaultAssignees: ['Fire Safety Officer', 'Electrician'],
    estimatedDuration: '1-2 days',
    complexity: 'high'
  },
  {
    id: 'structural',
    name: 'Structural Integrity',
    description: 'Structural and building integrity checks',
    category: 'Structural',
    items: 15,
    defaultTasks: [
      'Foundation inspection',
      'Load-bearing wall check',
      'Roof structure assessment',
      'Structural steel verification',
      'Concrete quality check',
      'Seismic compliance review'
    ],
    defaultAssignees: ['Structural Engineer', 'Site Inspector'],
    estimatedDuration: '3-5 days',
    complexity: 'high'
  },
  {
    id: 'environmental',
    name: 'Environmental Compliance',
    description: 'Environmental and sustainability checks',
    category: 'Environmental',
    items: 10,
    defaultTasks: [
      'Waste management review',
      'Air quality assessment',
      'Water usage audit',
      'Sustainability metrics',
      'Carbon footprint analysis',
      'Green building certification'
    ],
    defaultAssignees: ['Environmental Officer', 'Compliance Manager'],
    estimatedDuration: '2-4 days',
    complexity: 'medium'
  },
  {
    id: 'accessibility',
    name: 'Accessibility Standards',
    description: 'ADA and accessibility compliance',
    category: 'Compliance',
    items: 7,
    defaultTasks: [
      'ADA ramp inspection',
      'Door width verification',
      'Accessible parking check',
      'Signage compliance',
      'Elevator accessibility',
      'Restroom accessibility'
    ],
    defaultAssignees: ['Accessibility Specialist', 'Compliance Officer'],
    estimatedDuration: '1-2 days',
    complexity: 'low'
  }
]

const roleDescriptions = {
  administrator: 'Full access to all project features and settings',
  member: 'Can view and edit project content, manage tasks',
  viewer: 'Read-only access to project information'
}

const complexityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
}

export function AdvancedProjectWizard({ onClose, onProjectCreated }: AdvancedProjectWizardProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [draftSaved, setDraftSaved] = useState(false)
  const [templatePreview, setTemplatePreview] = useState<ChecklistTemplate | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [bulkImportMode, setBulkImportMode] = useState(false)
  const [bulkImportText, setBulkImportText] = useState('')
  
  // Form data
  const [projectData, setProjectData] = useState({
    name: '',
    address: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'planning',
    access: 'limited' as ProjectAccess
  })
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'member' as const })

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (projectData.name || projectData.address || teamMembers.length > 0) {
        saveDraft()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [projectData, teamMembers])

  const saveDraft = () => {
    const draft = {
      projectData,
      teamMembers,
      selectedTemplate,
      step
    }
    localStorage.setItem('project-wizard-draft', JSON.stringify(draft))
    setDraftSaved(true)
    setTimeout(() => setDraftSaved(false), 2000)
  }

  const loadDraft = () => {
    const draft = localStorage.getItem('project-wizard-draft')
    if (draft) {
      const parsed = JSON.parse(draft)
      setProjectData(parsed.projectData || projectData)
      setTeamMembers(parsed.teamMembers || [])
      setSelectedTemplate(parsed.selectedTemplate || '')
      setStep(parsed.step || 1)
    }
  }

  const clearDraft = () => {
    localStorage.removeItem('project-wizard-draft')
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!projectData.name.trim()) {
      newErrors.name = 'Project name is required'
    } else if (projectData.name.trim().length < 3) {
      newErrors.name = 'Project name must be at least 3 characters'
    }
    
    if (!projectData.address.trim()) {
      newErrors.address = 'Project address is required'
    }
    
    if (projectData.startDate && projectData.endDate && projectData.startDate > projectData.endDate) {
      newErrors.endDate = 'End date must be after start date'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!selectedTemplate) {
      newErrors.template = 'Please select a checklist template'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setProjectData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addTeamMember = () => {
    if (!newMember.name.trim() || !newMember.email.trim()) {
      setErrors({ member: 'Name and email are required' })
      return
    }
    
    if (!newMember.email.includes('@')) {
      setErrors({ member: 'Please enter a valid email address' })
      return
    }
    
    // Check for duplicate email
    if (teamMembers.some(member => member.email.toLowerCase() === newMember.email.toLowerCase())) {
      setErrors({ member: 'This email is already added' })
      return
    }
    
    const member: TeamMember = {
      id: Date.now().toString(),
      name: newMember.name.trim(),
      email: newMember.email.trim(),
      role: newMember.role,
      status: 'pending'
    }
    
    setTeamMembers(prev => [...prev, member])
    setNewMember({ name: '', email: '', role: 'member' })
    setErrors(prev => ({ ...prev, member: '' }))
  }

  const removeTeamMember = (id: string) => {
    setTeamMembers(prev => prev.filter(member => member.id !== id))
  }

  const handleBulkImport = () => {
    const lines = bulkImportText.split('\n').filter(line => line.trim())
    const newMembers: TeamMember[] = []
    
    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim())
      if (parts.length >= 2) {
        const [name, email, role = 'member'] = parts
        if (name && email && email.includes('@')) {
          newMembers.push({
            id: Date.now().toString() + Math.random(),
            name,
            email,
            role: role as any,
            status: 'pending'
          })
        }
      }
    }
    
    if (newMembers.length > 0) {
      setTeamMembers(prev => [...prev, ...newMembers])
      setBulkImportText('')
      setBulkImportMode(false)
    }
  }

  const nextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      createProject()
    }
  }

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1))
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

      // 3. Create checklist from template
      const template = checklistTemplates.find(t => t.id === selectedTemplate)
      if (template) {
        await ProjectService.createChecklists(project.id, [template])
      }

      // Clear draft on successful creation
      clearDraft()
      onProjectCreated(project.id)
      onClose()
    } catch (error) {
      console.error('Error creating project:', error)
      alert(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = checklistTemplates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const steps = [
    {
      number: 1,
      title: 'Project Details',
      description: 'Basic project information and settings',
      icon: Building2
    },
    {
      number: 2,
      title: 'Team & Checklist',
      description: 'Add team members and select checklist template',
      icon: UserPlus
    }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Create New Project</CardTitle>
              <CardDescription>
                Set up your project with team members and initial checklists
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {draftSaved && (
                <div className="flex items-center text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Draft saved
                </div>
              )}
              <Button variant="outline" size="sm" onClick={saveDraft}>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Progress Stepper */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              {steps.map((stepItem, index) => {
                const isActive = step === stepItem.number
                const isCompleted = step > stepItem.number
                const Icon = stepItem.icon
                
                return (
                  <div key={stepItem.number} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      isActive 
                        ? 'border-primary bg-primary text-primary-foreground' 
                        : isCompleted 
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-muted-foreground text-muted-foreground'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${
                        isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'
                      }`}>
                        {stepItem.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stepItem.description}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-16 h-0.5 mx-4 ${
                        isCompleted ? 'bg-green-500' : 'bg-muted-foreground'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
            <Progress value={(step / steps.length) * 100} className="mt-4" />
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Step 1: Project Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Project Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="Downtown Office Complex"
                      value={projectData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium">Status</Label>
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
                  <Label htmlFor="address" className="text-sm font-medium">
                    Project Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex">
                    <MapPin className="h-4 w-4 mt-3 mr-2 text-muted-foreground" />
                    <Input
                      id="address"
                      placeholder="123 Main Street, City, State 12345"
                      value={projectData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className={errors.address ? 'border-red-500' : ''}
                    />
                  </div>
                  {errors.address && (
                    <p className="text-sm text-red-500">{errors.address}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the project..."
                    rows={3}
                    value={projectData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-sm font-medium">Start Date</Label>
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
                    <Label htmlFor="endDate" className="text-sm font-medium">End Date</Label>
                    <div className="flex">
                      <Calendar className="h-4 w-4 mt-3 mr-2 text-muted-foreground" />
                      <Input
                        id="endDate"
                        type="date"
                        value={projectData.endDate}
                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                        className={errors.endDate ? 'border-red-500' : ''}
                      />
                    </div>
                    {errors.endDate && (
                      <p className="text-sm text-red-500">{errors.endDate}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="access" className="text-sm font-medium">Project Access</Label>
                  <Select value={projectData.access} onValueChange={(value) => handleInputChange('access', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">
                        <div>
                          <div className="font-medium">Open</div>
                          <div className="text-sm text-muted-foreground">All team members can view and edit</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="limited">
                        <div>
                          <div className="font-medium">Limited</div>
                          <div className="text-sm text-muted-foreground">Restricted access based on roles</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div>
                          <div className="font-medium">Private</div>
                          <div className="text-sm text-muted-foreground">Only invited members can access</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Team & Checklist */}
          {step === 2 && (
            <Tabs defaultValue="team" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="team">Team Members</TabsTrigger>
                <TabsTrigger value="templates">Checklist Templates</TabsTrigger>
              </TabsList>
              
              <TabsContent value="team" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <h3 className="text-lg font-semibold">Team Members</h3>
                      <Badge variant="secondary">{teamMembers.length} added</Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBulkImportMode(!bulkImportMode)}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {bulkImportMode ? 'Cancel' : 'Bulk Import'}
                    </Button>
                  </div>
                  
                  {bulkImportMode && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p>Enter team members in CSV format: Name, Email, Role</p>
                          <p className="text-sm text-muted-foreground">
                            Example: John Doe, john@company.com, member
                          </p>
                          <Textarea
                            placeholder="John Doe, john@company.com, member&#10;Jane Smith, jane@company.com, administrator"
                            rows={4}
                            value={bulkImportText}
                            onChange={(e) => setBulkImportText(e.target.value)}
                          />
                          <div className="flex space-x-2">
                            <Button onClick={handleBulkImport} size="sm">
                              Import Members
                            </Button>
                            <Button variant="outline" onClick={() => setBulkImportMode(false)} size="sm">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-3">
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
                      <Select value={newMember.role} onValueChange={(value) => setNewMember(prev => ({ ...prev, role: value as any }))}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="administrator">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={addTeamMember} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {errors.member && (
                      <p className="text-sm text-red-500">{errors.member}</p>
                    )}

                    {teamMembers.length > 0 && (
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
                              <Badge variant="outline">{member.role}</Badge>
                              <Badge variant="secondary" className="text-xs">
                                {member.status}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTeamMember(member.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="templates" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckSquare className="h-5 w-5" />
                      <h3 className="text-lg font-semibold">Checklist Template</h3>
                      <span className="text-red-500">*</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTemplatePreview(null)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {templatePreview ? 'Hide Preview' : 'Show Preview'}
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Search Templates</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-3">
                    {filteredTemplates.map((template) => (
                      <div key={template.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50">
                        <Checkbox
                          id={template.id}
                          checked={selectedTemplate === template.id}
                          onCheckedChange={() => setSelectedTemplate(template.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={template.id} className="font-medium cursor-pointer">
                              {template.name}
                            </Label>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{template.items} items</Badge>
                              <Badge className={complexityColors[template.complexity]}>
                                {template.complexity}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.description}
                          </p>
                          <div className="mt-2 flex items-center space-x-4 text-xs text-muted-foreground">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {template.estimatedDuration}
                            </span>
                            <span>
                              <strong>Assignees:</strong> {template.defaultAssignees.join(', ')}
                            </span>
                          </div>
                          <div className="mt-2">
                            <Badge variant="secondary">{template.category}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {errors.template && (
                    <p className="text-sm text-red-500">{errors.template}</p>
                  )}
                  
                  {templatePreview && selectedTemplate && (
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {checklistTemplates.find(t => t.id === selectedTemplate)?.name} Preview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium">Default Tasks:</h4>
                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                              {checklistTemplates.find(t => t.id === selectedTemplate)?.defaultTasks.map((task, index) => (
                                <li key={index}>{task}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium">Default Assignees:</h4>
                            <p className="text-sm text-muted-foreground">
                              {checklistTemplates.find(t => t.id === selectedTemplate)?.defaultAssignees.join(', ')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t">
            <Button variant="outline" onClick={prevStep} disabled={step === 1}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={nextStep} 
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  'Creating...'
                ) : step < 2 ? (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  'Create Project'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
