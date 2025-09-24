import { supabase } from '@/lib/supabase'

export interface Project {
  id: string
  name: string
  description?: string
  organization_id: string
  project_type_id?: string
  address?: string
  postcode?: string
  latitude?: number
  longitude?: number
  planned_start_date?: string
  planned_end_date?: string
  actual_start_date?: string
  actual_end_date?: string
  client_name?: string
  client_contact?: string
  contract_value?: number
  compliance_status: 'not_started' | 'in_progress' | 'compliant' | 'non_compliant' | 'requires_attention'
  overall_progress: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'
  created_at: string
  updated_at: string
  project_type?: {
    name: string
    category: string
    bsa_classification: string
    requires_golden_thread: boolean
  }
}

export interface ComplianceTemplate {
  id: string
  name: string
  category: string
  applies_to_hrb: boolean
  is_mandatory: boolean
  regulation_reference?: string
}

export interface ProjectCompliance {
  id: string
  project_id: string
  template_id: string
  status: 'not_started' | 'in_progress' | 'complete' | 'overdue' | 'na'
  progress: number
  due_date?: string
  completed_date?: string
  completed_by?: string
  notes?: string
  template?: ComplianceTemplate
}

export interface ChecklistItem {
  id: string
  template_id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  requires_evidence: boolean
  evidence_type?: 'photo' | 'document' | 'signature' | 'any'
  order_index: number
}

export interface ChecklistCompletion {
  id: string
  project_compliance_id: string
  checklist_item_id: string
  completed: boolean
  completed_by?: string
  completed_at?: string
  evidence_type?: string
  evidence_url?: string
  notes?: string
  latitude?: number
  longitude?: number
  weather_conditions?: string
}

export class ProjectService {
  // Create new project with compliance initialization
  static async createProject(projectData: Partial<Project>): Promise<Project> {
    const { data: project, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select(`
        *,
        project_type:project_types(*)
      `)
      .single()

    if (error) throw error

    // Initialize compliance requirements
    await supabase.rpc('initialize_project_compliance', {
      p_project_id: project.id
    })

    // Set up required certificates
    if (project.project_type?.bsa_classification === 'hrb') {
      await this.setRequiredCertificates(project.id, ['CSCS Card', 'First Aid', 'Asbestos Awareness'])
    } else {
      await this.setRequiredCertificates(project.id, ['CSCS Card'])
    }

    return project
  }

  // Get project with compliance data
  static async getProject(projectId: string): Promise<Project & { compliance?: ProjectCompliance[] }> {
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_type:project_types(*),
        compliance:project_compliance(
          *,
          template:compliance_templates(*)
        )
      `)
      .eq('id', projectId)
      .single()

    if (error) throw error
    return project
  }

  // Get project compliance status
  static async getProjectCompliance(projectId: string): Promise<ProjectCompliance[]> {
    const { data, error } = await supabase
      .from('project_compliance')
      .select(`
        *,
        template:compliance_templates(*)
      `)
      .eq('project_id', projectId)
      .order('template.category', { ascending: true })

    if (error) throw error
    return data || []
  }

  // Get checklist items for a compliance category
  static async getChecklistItems(templateId: string): Promise<ChecklistItem[]> {
    const { data, error } = await supabase
      .from('compliance_checklist_items')
      .select('*')
      .eq('template_id', templateId)
      .order('order_index', { ascending: true })

    if (error) throw error
    return data || []
  }

  // Get checklist completions
  static async getChecklistCompletions(projectComplianceId: string): Promise<ChecklistCompletion[]> {
    const { data, error } = await supabase
      .from('checklist_completions')
      .select('*')
      .eq('project_compliance_id', projectComplianceId)

    if (error) throw error
    return data || []
  }

  // Complete checklist item
  static async completeChecklistItem(
    projectComplianceId: string,
    checklistItemId: string,
    completionData: {
      completed: boolean
      completed_by: string
      evidence_url?: string
      notes?: string
      latitude?: number
      longitude?: number
      weather_conditions?: string
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('checklist_completions')
      .upsert({
        project_compliance_id: projectComplianceId,
        checklist_item_id: checklistItemId,
        ...completionData,
        completed_at: completionData.completed ? new Date().toISOString() : null
      })

    if (error) throw error

    // Update compliance progress
    await this.updateComplianceProgress(projectComplianceId)
  }

  // Update compliance progress
  static async updateComplianceProgress(projectComplianceId: string): Promise<void> {
    // Get all checklist items and completions
    const { data: compliance } = await supabase
      .from('project_compliance')
      .select(`
        *,
        template:compliance_templates!inner(id),
        checklist_items:compliance_checklist_items!template_id(id),
        completions:checklist_completions(completed)
      `)
      .eq('id', projectComplianceId)
      .single()

    if (!compliance) return

    const totalItems = compliance.checklist_items?.length || 0
    const completedItems = compliance.completions?.filter((c: any) => c.completed).length || 0
    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

    // Update progress and status
    await supabase
      .from('project_compliance')
      .update({
        progress,
        status: progress === 100 ? 'complete' : progress > 0 ? 'in_progress' : 'not_started',
        completed_date: progress === 100 ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectComplianceId)

    // Update overall project compliance score
    await supabase.rpc('calculate_project_compliance_score', {
      p_project_id: compliance.project_id
    })
  }

  // Upload compliance photo
  static async uploadCompliancePhoto(
    projectId: string,
    file: File,
    metadata: {
      checklist_completion_id?: string
      description?: string
      latitude?: number
      longitude?: number
      weather_conditions?: string
      tags?: string[]
    }
  ): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${projectId}/${Date.now()}.${fileExt}`
    const filePath = `compliance-photos/${fileName}`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // Create thumbnail (in production, use edge function)
    const thumbnailPath = filePath.replace(`.${fileExt}`, `_thumb.${fileExt}`)

    // Save to database
    const { data, error } = await supabase
      .from('compliance_photos')
      .insert({
        project_id: projectId,
        file_path: filePath,
        thumbnail_path: thumbnailPath,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        taken_at: new Date().toISOString(),
        ...metadata
      })
      .select()
      .single()

    if (error) throw error
    return data.id
  }

  // Create daily report
  static async createDailyReport(
    projectId: string,
    reportData: {
      report_date: string
      weather?: string
      temperature_celsius?: number
      site_conditions?: string
      workers_on_site?: number
      work_completed?: string
      issues_raised?: string
      health_safety_observations?: string
      materials_delivered?: string
      visitors?: string[]
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('daily_reports')
      .insert({
        project_id: projectId,
        submitted_by: (await supabase.auth.getUser()).data.user?.id,
        ...reportData
      })

    if (error) throw error
  }

  // Get compliance alerts
  static async getProjectAlerts(projectId: string, resolved: boolean = false): Promise<any[]> {
    const { data, error } = await supabase
      .from('compliance_alerts')
      .select('*')
      .eq('project_id', projectId)
      .eq('resolved', resolved)
      .order('severity', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Create compliance alert
  static async createAlert(
    projectId: string,
    alert: {
      alert_type: 'overdue' | 'expiring_soon' | 'certificate_expiry' | 'inspection_due' | 'incident' | 'non_compliance'
      severity: 'low' | 'medium' | 'high' | 'critical'
      title: string
      description?: string
      due_date?: string
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('compliance_alerts')
      .insert({
        project_id: projectId,
        ...alert
      })

    if (error) throw error
  }

  // Check and create certificate expiry alerts
  static async checkCertificateExpiry(projectId: string): Promise<void> {
    // This would be called by a cron job in production
    const { data: members } = await supabase
      .from('project_members')
      .select(`
        user_id,
        user:user_profiles!user_id(full_name),
        certificates:user_certificates!user_id(
          certificate_type:certificate_types(name),
          expiry_date,
          status
        )
      `)
      .eq('project_id', projectId)

    for (const member of members || []) {
      for (const cert of member.certificates || []) {
        if (cert.status === 'verified' && cert.expiry_date) {
          const daysUntilExpiry = Math.floor(
            (new Date(cert.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )

          if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
            await this.createAlert(projectId, {
              alert_type: 'certificate_expiry',
              severity: daysUntilExpiry <= 7 ? 'high' : 'medium',
              title: `Certificate Expiring: ${cert.certificate_type.name}`,
              description: `${member.user.full_name}'s ${cert.certificate_type.name} expires in ${daysUntilExpiry} days`,
              due_date: cert.expiry_date
            })
          }
        }
      }
    }
  }

  // Set required certificates for project
  private static async setRequiredCertificates(projectId: string, certificateNames: string[]): Promise<void> {
    const { data: certTypes } = await supabase
      .from('certificate_types')
      .select('id')
      .in('name', certificateNames)

    for (const certType of certTypes || []) {
      await supabase
        .from('project_required_certificates')
        .insert({
          project_id: projectId,
          certificate_type_id: certType.id,
          is_mandatory: true
        })
    }
  }

  // Get project statistics
  static async getProjectStats(projectId: string): Promise<{
    compliance_score: number
    total_requirements: number
    completed_requirements: number
    overdue_items: number
    team_size: number
    days_remaining: number
    photos_uploaded: number
    daily_reports: number
  }> {
    const project = await this.getProject(projectId)
    
    const { data: compliance } = await supabase
      .from('project_compliance')
      .select('*')
      .eq('project_id', projectId)

    const { data: members } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)

    const { data: photos } = await supabase
      .from('compliance_photos')
      .select('id')
      .eq('project_id', projectId)

    const { data: reports } = await supabase
      .from('daily_reports')
      .select('id')
      .eq('project_id', projectId)

    const total = compliance?.length || 0
    const completed = compliance?.filter(c => c.status === 'complete').length || 0
    const overdue = compliance?.filter(c => c.status === 'overdue').length || 0

    const daysRemaining = project.planned_end_date
      ? Math.floor((new Date(project.planned_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0

    return {
      compliance_score: project.overall_progress,
      total_requirements: total,
      completed_requirements: completed,
      overdue_items: overdue,
      team_size: members?.length || 0,
      days_remaining: Math.max(0, daysRemaining),
      photos_uploaded: photos?.length || 0,
      daily_reports: reports?.length || 0
    }
  }
}