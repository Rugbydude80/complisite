import { supabase } from './supabase'
import { ProjectService } from './project-service'

export type Project = {
  id: string
  name: string
  address: string
  status: string
  compliance_score: number
  updated_at: string
}

export type Stats = {
  totalProjects: number
  activeChecklists: number
  averageCompliance: number
  pendingItems: number
}

export async function getProjects(): Promise<Project[]> {
  return await ProjectService.getProjects()
}

export async function getStats(): Promise<Stats> {
  try {
    const projects = await ProjectService.getProjects()
    
    // Get active checklists
    const { count: checklistCount } = await supabase
      .from('project_compliance')
      .select('*', { count: 'exact', head: true })
    
    // Get average compliance
    const avgCompliance = projects.length > 0
      ? Math.round(projects.reduce((acc, p) => acc + p.overall_progress, 0) / projects.length)
      : 0
    
    // Get pending items (compliance items not complete)
    const { data: compliance } = await supabase
      .from('project_compliance')
      .select('status')
    
    const pendingItems = compliance
      ? compliance.filter(c => c.status !== 'complete').length
      : 0
    
    return {
      totalProjects: projects.length,
      activeChecklists: checklistCount || 0,
      averageCompliance: avgCompliance,
      pendingItems: pendingItems
    }
  } catch (error) {
    console.error('Error getting stats:', error)
    throw new Error('Failed to load statistics. Please check your connection and try again.')
  }
}
