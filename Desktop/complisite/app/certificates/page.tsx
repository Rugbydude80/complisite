'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Award, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Upload,
  Calendar,
  Download,
  Eye
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { CertificateManagement } from '@/components/certificate-management'

interface Certificate {
  id: string
  name: string
  category: string
  type: string
  issuingOrganization: string
  certificateNumber: string
  status: 'valid' | 'expired' | 'expiring'
  issue_date: string
  expiry_date: string
  file_url?: string
  isRenewable: boolean
  requiresTraining: boolean
  description?: string
}

export default function CertificatesPage() {
  const supabase = createClient()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCertificates()
  }, [])

  const loadCertificates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load certificates from database
      const { data: dbCertificates, error } = await supabase
        .from('user_certificates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading certificates:', error)
        setError('Failed to load certificates. Please check your connection and try again.')
        setCertificates([])
        return
      }

      // Transform database certificates to our interface
      const transformedCertificates: Certificate[] = dbCertificates.map(cert => {
        const metadata = cert.metadata || {}
        const today = new Date()
        const expiryDate = new Date(cert.expiry_date)
        let status: 'valid' | 'expired' | 'expiring' = 'valid'
        
        if (expiryDate < today) {
          status = 'expired'
        } else if (expiryDate <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) {
          status = 'expiring'
        }

        return {
          id: cert.id,
          name: metadata.type || 'Unknown Certificate',
          category: metadata.category || 'Safety Training',
          type: metadata.type || 'Unknown Type',
          issuingOrganization: cert.issuing_body || 'Unknown Organization',
          certificateNumber: cert.certificate_number || 'N/A',
          status,
          issue_date: cert.issue_date,
          expiry_date: cert.expiry_date,
          file_url: cert.file_path,
          isRenewable: metadata.is_renewable ?? true,
          requiresTraining: metadata.requires_training ?? false,
          description: metadata.description
        }
      })

      setCertificates(transformedCertificates)
    } catch (error) {
      console.error('Error loading certificates:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'expiring':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />
      case 'expired':
        return <Clock className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Valid</Badge>
      case 'expiring':
        return <Badge variant="default" className="bg-orange-100 text-orange-800">Expiring Soon</Badge>
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Certificates</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => {
            setError(null)
            setLoading(true)
            loadCertificates()
          }}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Certificates</h1>
        <p className="text-gray-600">Manage your professional certifications and training records</p>
      </div>

      {/* Quick Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload New Certificate
          </Button>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            View Training Schedule
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download All Certificates
          </Button>
        </CardContent>
      </Card>

      {/* Certificate Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valid Certificates</p>
                <p className="text-3xl font-bold text-green-600">
                  {certificates.filter(c => c.status === 'valid').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expiring Soon</p>
                <p className="text-3xl font-bold text-orange-600">
                  {certificates.filter(c => c.status === 'expiring').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expired</p>
                <p className="text-3xl font-bold text-red-600">
                  {certificates.filter(c => c.status === 'expired').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certificate Management */}
      <CertificateManagement 
        certificates={certificates}
        onView={(certificate) => {
          console.log('View certificate:', certificate)
          // Implement view functionality
        }}
        onDownload={(certificate) => {
          console.log('Download certificate:', certificate)
          // Implement download functionality
        }}
        onEdit={(certificate) => {
          console.log('Edit certificate:', certificate)
          // Implement edit functionality
        }}
        onDelete={(certificateId) => {
          console.log('Delete certificate:', certificateId)
          // Implement delete functionality
        }}
      />
    </div>
  )
}
