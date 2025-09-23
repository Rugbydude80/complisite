import { supabase } from './supabase'

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

export async function getStats(): Promise<Stats> {
  // Get total projects
  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
  
  // Get active checklists
  const { count: checklistCount } = await supabase
    .from('checklists')
    .select('*', { count: 'exact', head: true })
  
  // Get average compliance
  const { data: projects } = await supabase
    .from('projects')
    .select('compliance_score')
  
  const avgCompliance = projects
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
    totalProjects: projectCount || 0,
    activeChecklists: checklistCount || 0,
    averageCompliance: avgCompliance,
    pendingItems: pendingItems
  }
}
