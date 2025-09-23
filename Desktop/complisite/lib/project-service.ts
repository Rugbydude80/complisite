import { supabase } from './supabase'

export type Project = {
  id: string
  name: string
  address: string
  status: string
  compliance_score: number
  created_at: string
  updated_at: string
}

export type TeamMember = {
  id: string
  name: string
  email: string
  role: string
  company_id: string
}

export type Checklist = {
  id: string
  name: string
  project_id: string
  category: string
  total_items: number
  completed_items: number
  created_at: string
}

export class ProjectService {
  // Create a new project
  static async createProject(projectData: {
    name: string
    address: string
    description?: string
    status: string
  }): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: projectData.name,
        address: projectData.address,
        status: projectData.status,
        compliance_score: 0
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create project: ${error.message}`)
    }

    return data
  }

  // Add team members to a project
  static async addTeamMembers(projectId: string, members: Omit<TeamMember, 'id' | 'company_id'>[]): Promise<void> {
    if (members.length === 0) return

    const { error } = await supabase
      .from('users')
      .insert(members.map(member => ({
        email: member.email,
        full_name: member.name,
        role: member.role,
        company_id: 'default-company' // This should come from auth context
      })))

    if (error) {
      console.warn('Failed to create team members:', error)
      // Don't throw error as this is not critical for project creation
    }
  }

  // Create checklists for a project
  static async createChecklists(projectId: string, checklistTemplates: {
    id: string
    name: string
    category: string
    items: number
    defaultTasks?: string[]
    defaultAssignees?: string[]
  }[]): Promise<void> {
    if (checklistTemplates.length === 0) return

    for (const template of checklistTemplates) {
      // Create the main checklist
      const { data: checklist, error: checklistError } = await supabase
        .from('checklists')
        .insert({
          name: template.name,
          project_id: projectId,
          category: template.category,
          total_items: template.items,
          completed_items: 0
        })
        .select()
        .single()

      if (checklistError) {
        console.warn(`Failed to create checklist ${template.name}:`, checklistError)
        continue
      }

      // Create checklist items from default tasks
      if (template.defaultTasks && template.defaultTasks.length > 0) {
        const checklistItems = template.defaultTasks.map((task, index) => ({
          id: `${checklist.id}-${index + 1}`,
          checklist_id: checklist.id,
          description: task,
          section: template.category,
          is_completed: false,
          priority: index < 3 ? 'high' : 'medium',
          requires_evidence: true,
          evidence_count: 0
        }))

        const { error: itemsError } = await supabase
          .from('checklist_items')
          .insert(checklistItems)

        if (itemsError) {
          console.warn(`Failed to create checklist items for ${template.name}:`, itemsError)
        }
      }
    }
  }

  // Get all projects
  static async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching projects:', error)
      return []
    }
    
    return data || []
  }

  // Get project by ID
  static async getProject(projectId: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) {
      console.error('Error fetching project:', error)
      return null
    }

    return data
  }

  // Get project checklists
  static async getProjectChecklists(projectId: string): Promise<Checklist[]> {
    const { data, error } = await supabase
      .from('checklists')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching checklists:', error)
      return []
    }

    return data || []
  }

  // Update project status
  static async updateProjectStatus(projectId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .update({ status })
      .eq('id', projectId)

    if (error) {
      throw new Error(`Failed to update project status: ${error.message}`)
    }
  }

  // Update project compliance score
  static async updateComplianceScore(projectId: string, score: number): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .update({ compliance_score: score })
      .eq('id', projectId)

    if (error) {
      throw new Error(`Failed to update compliance score: ${error.message}`)
    }
  }
}
