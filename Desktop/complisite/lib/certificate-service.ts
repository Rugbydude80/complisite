import { supabase } from '@/lib/supabase'

export interface Certificate {
  id: string
  user_id: string
  certificate_type_id: string
  certificate_number?: string
  issuing_body?: string
  issue_date: string
  expiry_date?: string
  file_path?: string
  file_size?: number
  file_type?: string
  status: 'pending_verification' | 'verified' | 'expired' | 'suspended' | 'rejected'
  verification_method?: 'manual' | 'api' | 'auto'
  verified_by?: string
  verified_at?: string
  rejection_reason?: string
  metadata?: any
  created_at: string
  updated_at: string
  certificate_type?: {
    name: string
    category: string
    is_mandatory: boolean
  }
}

export interface CertificateType {
  id: string
  name: string
  category: string
  issuing_bodies: string[]
  typical_duration_months: number
  is_mandatory: boolean
}

export class CertificateService {
  // Upload certificate file to storage
  static async uploadCertificateFile(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`
    const filePath = `certificates/${fileName}`

    const { data, error } = await supabase.storage
      .from('certificates')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error
    return filePath
  }

  // Create new certificate
  static async createCertificate(
    userId: string,
    certificateData: {
      certificate_type_id: string
      certificate_number?: string
      issuing_body?: string
      issue_date: string
      expiry_date?: string
      file?: File
    }
  ): Promise<Certificate> {
    let file_path = undefined
    let file_size = undefined
    let file_type = undefined

    // Upload file if provided
    if (certificateData.file) {
      file_path = await this.uploadCertificateFile(certificateData.file, userId)
      file_size = certificateData.file.size
      file_type = certificateData.file.type
    }

    const { data, error } = await supabase
      .from('user_certificates')
      .insert({
        user_id: userId,
        certificate_type_id: certificateData.certificate_type_id,
        certificate_number: certificateData.certificate_number,
        issuing_body: certificateData.issuing_body,
        issue_date: certificateData.issue_date,
        expiry_date: certificateData.expiry_date,
        file_path,
        file_size,
        file_type,
        status: 'pending_verification'
      })
      .select(`
        *,
        certificate_type:certificate_types(*)
      `)
      .single()

    if (error) throw error

    // Log activity
    await supabase.rpc('log_activity', {
      p_org_id: await this.getUserOrganizationId(userId),
      p_action_type: 'certificate_uploaded',
      p_description: `Certificate uploaded: ${data.certificate_type?.name}`,
      p_metadata: { certificate_id: data.id }
    })

    return data
  }

  // Get user certificates
  static async getUserCertificates(userId: string): Promise<Certificate[]> {
    const { data, error } = await supabase
      .from('user_certificates')
      .select(`
        *,
        certificate_type:certificate_types(*)
      `)
      .eq('user_id', userId)
      .order('expiry_date', { ascending: true })

    if (error) throw error
    return data || []
  }

  // Get organization certificates
  static async getOrganizationCertificates(organizationId: string): Promise<Certificate[]> {
    const { data, error } = await supabase
      .from('user_certificates')
      .select(`
        *,
        certificate_type:certificate_types(*),
        user:user_profiles!user_id(full_name, email)
      `)
      .in('user_id', 
        await supabase
          .from('organization_members')
          .select('user_id')
          .eq('organization_id', organizationId)
          .then(res => res.data?.map(m => m.user_id) || [])
      )
      .order('expiry_date', { ascending: true })

    if (error) throw error
    return data || []
  }

  // Verify certificate
  static async verifyCertificate(
    certificateId: string,
    verifiedBy: string,
    method: 'manual' | 'api' | 'auto' = 'manual'
  ): Promise<void> {
    const { error } = await supabase
      .from('user_certificates')
      .update({
        status: 'verified',
        verification_method: method,
        verified_by: verifiedBy,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', certificateId)

    if (error) throw error
  }

  // Reject certificate
  static async rejectCertificate(
    certificateId: string,
    reason: string
  ): Promise<void> {
    const { error } = await supabase
      .from('user_certificates')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', certificateId)

    if (error) throw error
  }

  // Share certificate with organization
  static async shareCertificateWithOrganization(
    certificateId: string,
    organizationId: string,
    sharedBy: string
  ): Promise<void> {
    const { error } = await supabase
      .from('certificate_shares')
      .insert({
        certificate_id: certificateId,
        shared_with_org_id: organizationId,
        shared_by: sharedBy
      })

    if (error) throw error
  }

  // Share certificate with project
  static async shareCertificateWithProject(
    certificateId: string,
    projectId: string,
    sharedBy: string
  ): Promise<void> {
    const { error } = await supabase
      .from('certificate_shares')
      .insert({
        certificate_id: certificateId,
        shared_with_project_id: projectId,
        shared_by: sharedBy
      })

    if (error) throw error
  }

  // Get certificate types
  static async getCertificateTypes(): Promise<CertificateType[]> {
    const { data, error } = await supabase
      .from('certificate_types')
      .select('*')
      .order('category', { ascending: true })

    if (error) throw error
    return data || []
  }

  // Check project readiness
  static async checkProjectReadiness(projectId: string): Promise<{
    userId: string
    userName: string
    requiredCertificates: any[]
    userCertificates: any[]
    readiness: 'ready' | 'expiring_soon' | 'expired' | 'missing'
  }[]> {
    // Get project members
    const { data: members } = await supabase
      .from('project_members')
      .select(`
        user_id,
        user:user_profiles!user_id(full_name)
      `)
      .eq('project_id', projectId)

    // Get required certificates for project
    const { data: required } = await supabase
      .from('project_required_certificates')
      .select(`
        certificate_type:certificate_types(*)
      `)
      .eq('project_id', projectId)

    const readinessData = []

    for (const member of members || []) {
      // Get user certificates
      const { data: certs } = await supabase
        .from('user_certificates')
        .select(`
          *,
          certificate_type:certificate_types(*)
        `)
        .eq('user_id', member.user_id)
        .in('certificate_type_id', required?.map(r => r.certificate_type.id) || [])

      // Calculate readiness
      let readiness: 'ready' | 'expiring_soon' | 'expired' | 'missing' = 'ready'
      
      for (const req of required || []) {
        const userCert = certs?.find(c => c.certificate_type_id === req.certificate_type.id)
        
        if (!userCert) {
          readiness = 'missing'
          break
        }
        
        if (userCert.status === 'expired') {
          readiness = 'expired'
          break
        }
        
        if (userCert.expiry_date) {
          const daysUntilExpiry = Math.floor(
            (new Date(userCert.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
          
          if (daysUntilExpiry < 30 && readiness === 'ready') {
            readiness = 'expiring_soon'
          }
        }
      }

      readinessData.push({
        userId: member.user_id,
        userName: member.user?.full_name || 'Unknown',
        requiredCertificates: required || [],
        userCertificates: certs || [],
        readiness
      })
    }

    return readinessData
  }

  // Get expiring certificates
  static async getExpiringCertificates(
    organizationId: string,
    daysAhead: number = 90
  ): Promise<Certificate[]> {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + daysAhead)

    const { data, error } = await supabase
      .from('user_certificates')
      .select(`
        *,
        certificate_type:certificate_types(*),
        user:user_profiles!user_id(full_name, email)
      `)
      .gte('expiry_date', new Date().toISOString())
      .lte('expiry_date', futureDate.toISOString())
      .eq('status', 'verified')
      .in('user_id',
        await supabase
          .from('organization_members')
          .select('user_id')
          .eq('organization_id', organizationId)
          .then(res => res.data?.map(m => m.user_id) || [])
      )
      .order('expiry_date', { ascending: true })

    if (error) throw error
    return data || []
  }

  // Helper to get user's organization
  private static async getUserOrganizationId(userId: string): Promise<string | null> {
    const { data } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userId)
      .single()

    return data?.organization_id || null
  }
}
