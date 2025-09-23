'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Users,
  Award,
  Calendar
} from 'lucide-react'
import { CertificateService } from '@/lib/certificate-service'
import { format } from 'date-fns'

interface ProjectReadinessProps {
  projectId: string
}

interface ReadinessData {
  userId: string
  userName: string
  requiredCertificates: any[]
  userCertificates: any[]
  readiness: 'ready' | 'expiring_soon' | 'expired' | 'missing'
}

export function ProjectReadiness({ projectId }: ProjectReadinessProps) {
  const [readinessData, setReadinessData] = useState<ReadinessData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjectReadiness()
  }, [projectId])

  const loadProjectReadiness = async () => {
    try {
      const data = await CertificateService.checkProjectReadiness(projectId)
      setReadinessData(data)
    } catch (error) {
      console.error('Failed to load project readiness:', error)
    } finally {
      setLoading(false)
    }
  }

  const getReadinessBadge = (readiness: string) => {
    const config = {
      ready: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'Ready' },
      expiring_soon: { icon: AlertTriangle, color: 'bg-orange-100 text-orange-700', label: 'Expiring Soon' },
      expired: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Expired' },
      missing: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Missing Certificates' }
    }

    const cfg = config[readiness as keyof typeof config] || config.missing
    const Icon = cfg.icon

    return (
      <Badge className={cfg.color}>
        <Icon className="w-3 h-3 mr-1" />
        {cfg.label}
      </Badge>
    )
  }

  const getCertificateStatus = (cert: any) => {
    if (!cert) return { status: 'missing', label: 'Missing' }
    
    if (cert.status === 'expired') return { status: 'expired', label: 'Expired' }
    if (cert.status === 'verified') {
      if (cert.expiry_date) {
        const daysUntilExpiry = Math.floor(
          (new Date(cert.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
        if (daysUntilExpiry <= 30) {
          return { status: 'expiring', label: `Expires in ${daysUntilExpiry} days` }
        }
      }
      return { status: 'valid', label: 'Valid' }
    }
    
    return { status: 'pending', label: 'Pending Verification' }
  }

  const calculateOverallReadiness = () => {
    if (readinessData.length === 0) return 0
    
    const readyCount = readinessData.filter(r => r.readiness === 'ready').length
    return Math.round((readyCount / readinessData.length) * 100)
  }

  if (loading) {
    return <div>Loading project readiness...</div>
  }

  const overallReadiness = calculateOverallReadiness()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Project Readiness</h2>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Overall Readiness</p>
            <p className="text-2xl font-bold">{overallReadiness}%</p>
          </div>
          <div className="w-32">
            <Progress value={overallReadiness} className="h-2" />
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {readinessData.map((member) => (
          <Card key={member.userId} className="border">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{member.userName}</h3>
                      {getReadinessBadge(member.readiness)}
                    </div>
                    
                    <div className="space-y-2">
                      {member.requiredCertificates.map((req) => {
                        const userCert = member.userCertificates.find(
                          c => c.certificate_type_id === req.certificate_type.id
                        )
                        const certStatus = getCertificateStatus(userCert)
                        
                        return (
                          <div key={req.certificate_type.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-gray-600" />
                              <span className="font-medium">{req.certificate_type.name}</span>
                              {req.is_mandatory && (
                                <Badge variant="outline" className="text-xs">
                                  Required
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">{certStatus.label}</span>
                              {certStatus.status === 'valid' && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                              {certStatus.status === 'expired' && (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              {certStatus.status === 'expiring' && (
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                              )}
                              {certStatus.status === 'missing' && (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              {certStatus.status === 'pending' && (
                                <Clock className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {readinessData.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No team members assigned to this project</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
