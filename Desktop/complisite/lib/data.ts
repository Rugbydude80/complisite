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
  const projects = await ProjectService.getProjects()
  
  // Get active checklists
  const { count: checklistCount } = await supabase
    .from('checklists')
    .select('*', { count: 'exact', head: true })
  
  // Get average compliance
  const avgCompliance = projects.length > 0
    ? Math.round(projects.reduce((acc, p) => acc + p.compliance_score, 0) / projects.length)
    : 0
  
  // Get pending items (checklists not 100% complete)
  const { data: checklists } = await supabase
    .from('checklists')
    .select('total_items, completed_items')
  
  const pendingItems = checklists
    ? checklists.reduce((acc, c) => acc + (c.total_items - c.completed_items), 0)
    : 0
  
  return {
    totalProjects: projects.length,
    activeChecklists: checklistCount || 0,
    averageCompliance: avgCompliance,
    pendingItems: pendingItems
  }
}
