'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertTriangle,
  Calendar,
  Download,
  Award,
  User,
  Clock,
  CheckCircle
} from 'lucide-react'
import { CertificateService, type Certificate } from '@/lib/certificate-service'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

interface CertificateExpiryDashboardProps {
  organizationId: string
}

export function CertificateExpiryDashboard({ organizationId }: CertificateExpiryDashboardProps) {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [daysAhead, setDaysAhead] = useState(90)
  const [filter, setFilter] = useState<'all' | 'expiring' | 'expired'>('all')

  useEffect(() => {
    loadExpiringCertificates()
  }, [organizationId, daysAhead])

  const loadExpiringCertificates = async () => {
    try {
      const expiringCerts = await CertificateService.getExpiringCertificates(organizationId, daysAhead)
      setCertificates(expiringCerts)
    } catch (error) {
      console.error('Failed to load expiring certificates:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadCertificate = async (certificate: Certificate) => {
    if (!certificate.file_path) return

    const { data } = await supabase.storage
      .from('certificates')
      .createSignedUrl(certificate.file_path, 60)

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    }
  }

  const getExpiryStatus = (expiryDate: string) => {
    const daysUntilExpiry = Math.floor(
      (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', label: 'Expired', color: 'text-red-600' }
    } else if (daysUntilExpiry <= 7) {
      return { status: 'critical', label: `${daysUntilExpiry} days`, color: 'text-red-600' }
    } else if (daysUntilExpiry <= 30) {
      return { status: 'warning', label: `${daysUntilExpiry} days`, color: 'text-orange-600' }
    } else {
      return { status: 'ok', label: `${daysUntilExpiry} days`, color: 'text-green-600' }
    }
  }

  const getFilteredCertificates = () => {
    if (filter === 'expired') {
      return certificates.filter(cert => {
        if (!cert.expiry_date) return false
        return new Date(cert.expiry_date) < new Date()
      })
    } else if (filter === 'expiring') {
      return certificates.filter(cert => {
        if (!cert.expiry_date) return false
        const daysUntilExpiry = Math.floor(
          (new Date(cert.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
      })
    }
    return certificates
  }

  const getExpiryStats = () => {
    const now = new Date()
    const expired = certificates.filter(cert => 
      cert.expiry_date && new Date(cert.expiry_date) < now
    ).length
    const expiringSoon = certificates.filter(cert => {
      if (!cert.expiry_date) return false
      const daysUntilExpiry = Math.floor(
        (new Date(cert.expiry_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
    }).length
    const valid = certificates.filter(cert => {
      if (!cert.expiry_date) return true
      const daysUntilExpiry = Math.floor(
        (new Date(cert.expiry_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysUntilExpiry > 30
    }).length

    return { expired, expiringSoon, valid, total: certificates.length }
  }

  if (loading) {
    return <div>Loading certificate expiry data...</div>
  }

  const filteredCertificates = getFilteredCertificates()
  const stats = getExpiryStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Certificate Expiry Dashboard</h2>
        <div className="flex items-center gap-4">
          <Select value={daysAhead.toString()} onValueChange={(value) => setDaysAhead(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="60">60 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
              <SelectItem value="180">180 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Valid</p>
                <p className="text-2xl font-bold text-green-600">{stats.valid}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All ({stats.total})
        </Button>
        <Button
          variant={filter === 'expiring' ? 'default' : 'outline'}
          onClick={() => setFilter('expiring')}
        >
          Expiring Soon ({stats.expiringSoon})
        </Button>
        <Button
          variant={filter === 'expired' ? 'default' : 'outline'}
          onClick={() => setFilter('expired')}
        >
          Expired ({stats.expired})
        </Button>
      </div>

      {/* Certificates List */}
      <div className="grid gap-4">
        {filteredCertificates.map((cert) => {
          const expiryStatus = cert.expiry_date ? getExpiryStatus(cert.expiry_date) : null
          
          return (
            <Card key={cert.id} className="border">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Award className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">
                          {cert.certificate_type?.name}
                        </h3>
                        {expiryStatus && (
                          <Badge 
                            className={
                              expiryStatus.status === 'expired' 
                                ? 'bg-red-100 text-red-700'
                                : expiryStatus.status === 'critical'
                                ? 'bg-red-100 text-red-700'
                                : expiryStatus.status === 'warning'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-green-100 text-green-700'
                            }
                          >
                            {expiryStatus.label}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>{cert.user?.full_name || 'Unknown User'}</span>
                      </div>
                      
                      {cert.certificate_number && (
                        <p className="text-sm text-gray-600">
                          Certificate Number: {cert.certificate_number}
                        </p>
                      )}
                      
                      {cert.issuing_body && (
                        <p className="text-sm text-gray-600">
                          Issued by: {cert.issuing_body}
                        </p>
                      )}
                      
                      <div className="flex gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Issued: {format(new Date(cert.issue_date), 'dd MMM yyyy')}
                        </div>
                        {cert.expiry_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Expires: {format(new Date(cert.expiry_date), 'dd MMM yyyy')}
                          </div>
                        )}
                      </div>

                      {expiryStatus?.status === 'expired' && (
                        <Alert className="mt-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            This certificate has expired and needs to be renewed.
                          </AlertDescription>
                        </Alert>
                      )}

                      {expiryStatus?.status === 'critical' && (
                        <Alert className="mt-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            This certificate expires very soon and needs immediate attention.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {cert.file_path && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadCertificate(cert)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredCertificates.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Award className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">
                {filter === 'all' 
                  ? 'No certificates found'
                  : filter === 'expiring'
                  ? 'No certificates expiring soon'
                  : 'No expired certificates'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
