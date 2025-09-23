'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Download,
  Calendar,
  Award,
  User
} from 'lucide-react'
import { CertificateService, type Certificate } from '@/lib/certificate-service'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

interface CertificateVerificationProps {
  organizationId: string
}

export function CertificateVerification({ organizationId }: CertificateVerificationProps) {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadPendingCertificates()
  }, [organizationId])

  const loadPendingCertificates = async () => {
    try {
      const orgCerts = await CertificateService.getOrganizationCertificates(organizationId)
      setCertificates(orgCerts.filter(c => c.status === 'pending_verification'))
    } catch (error) {
      console.error('Failed to load certificates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (certificateId: string) => {
    setActionLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await CertificateService.verifyCertificate(certificateId, user.id, 'manual')
      await loadPendingCertificates()
      setSelectedCert(null)
    } catch (error) {
      console.error('Failed to verify certificate:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (certificateId: string) => {
    if (!rejectionReason.trim()) return

    setActionLoading(true)
    try {
      await CertificateService.rejectCertificate(certificateId, rejectionReason)
      await loadPendingCertificates()
      setSelectedCert(null)
      setRejectionReason('')
    } catch (error) {
      console.error('Failed to reject certificate:', error)
    } finally {
      setActionLoading(false)
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

  const getStatusBadge = (status: string) => {
    const config = {
      verified: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'Verified' },
      pending_verification: { icon: Clock, color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
      expired: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Expired' },
      rejected: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Rejected' },
      suspended: { icon: AlertTriangle, color: 'bg-orange-100 text-orange-700', label: 'Suspended' }
    }

    const cfg = config[status as keyof typeof config] || config.pending_verification
    const Icon = cfg.icon

    return (
      <Badge className={cfg.color}>
        <Icon className="w-3 h-3 mr-1" />
        {cfg.label}
      </Badge>
    )
  }

  if (loading) {
    return <div>Loading certificates...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Certificate Verification</h2>
        <Badge variant="outline">
          {certificates.length} pending verification
        </Badge>
      </div>

      {certificates.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <p className="text-gray-500">No certificates pending verification</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {certificates.map((cert) => (
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
                        {getStatusBadge(cert.status)}
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
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Certificate Details</DialogTitle>
                          <DialogDescription>
                            Review and verify this certificate
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Certificate Type</Label>
                              <p className="font-medium">{cert.certificate_type?.name}</p>
                            </div>
                            <div>
                              <Label>Category</Label>
                              <p className="text-gray-600">{cert.certificate_type?.category}</p>
                            </div>
                            <div>
                              <Label>Certificate Number</Label>
                              <p className="text-gray-600">{cert.certificate_number || 'Not provided'}</p>
                            </div>
                            <div>
                              <Label>Issuing Body</Label>
                              <p className="text-gray-600">{cert.issuing_body || 'Not provided'}</p>
                            </div>
                            <div>
                              <Label>Issue Date</Label>
                              <p className="text-gray-600">{format(new Date(cert.issue_date), 'dd MMM yyyy')}</p>
                            </div>
                            <div>
                              <Label>Expiry Date</Label>
                              <p className="text-gray-600">
                                {cert.expiry_date ? format(new Date(cert.expiry_date), 'dd MMM yyyy') : 'No expiry'}
                              </p>
                            </div>
                          </div>

                          {cert.file_path && (
                            <div>
                              <Label>Certificate File</Label>
                              <div className="mt-2">
                                <Button
                                  variant="outline"
                                  onClick={() => downloadCertificate(cert)}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download Certificate
                                </Button>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-3 pt-4">
                            <Button
                              onClick={() => handleVerify(cert.id)}
                              disabled={actionLoading}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Verify
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="destructive">
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject Certificate</DialogTitle>
                                  <DialogDescription>
                                    Provide a reason for rejecting this certificate
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="reason">Rejection Reason</Label>
                                    <Textarea
                                      id="reason"
                                      value={rejectionReason}
                                      onChange={(e) => setRejectionReason(e.target.value)}
                                      placeholder="e.g., Certificate appears to be expired, unclear image quality..."
                                      rows={4}
                                    />
                                  </div>
                                  <div className="flex justify-end gap-3">
                                    <Button
                                      variant="outline"
                                      onClick={() => setRejectionReason('')}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleReject(cert.id)}
                                      disabled={!rejectionReason.trim() || actionLoading}
                                    >
                                      Reject Certificate
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
