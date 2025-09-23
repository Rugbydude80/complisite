'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Award,
  Calendar,
  Download,
  Eye,
  FileText,
  RefreshCw,
  Shield,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'
import { CertificateService, type Certificate } from '@/lib/certificate-service'
import { CertificateUpload } from '@/components/certificate-upload'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>({})
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [shareConsent, setShareConsent] = useState(true)

  useEffect(() => {
    loadProfileData()
  }, [])

  const loadProfileData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setUser(user)

    // Load profile
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileData) {
      setProfile(profileData)
      setShareConsent(profileData.share_certificates)
    }

    // Load certificates
    const certs = await CertificateService.getUserCertificates(user.id)
    setCertificates(certs)

    setLoading(false)
  }

  const updateProfile = async () => {
    await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        ...profile,
        share_certificates: shareConsent,
        updated_at: new Date().toISOString()
      })
  }

  const getStatusBadge = (status: string, expiryDate?: string) => {
    const config = {
      verified: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'Verified' },
      pending_verification: { icon: Clock, color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
      expired: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Expired' },
      rejected: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Rejected' },
      suspended: { icon: AlertTriangle, color: 'bg-orange-100 text-orange-700', label: 'Suspended' }
    }

    // Check if expiring soon
    if (status === 'verified' && expiryDate) {
      const daysUntilExpiry = Math.floor(
        (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      if (daysUntilExpiry <= 30) {
        const Icon = AlertTriangle
        return (
          <Badge className="bg-orange-100 text-orange-700">
            <Icon className="w-3 h-3 mr-1" />
            Expiring Soon
          </Badge>
        )
      }
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

  const downloadCertificate = async (certificate: Certificate) => {
    if (!certificate.file_path) return

    const { data } = await supabase.storage
      .from('certificates')
      .createSignedUrl(certificate.file_path, 60)

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    }
  }

  if (loading) {
    return <div>Loading profile...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Profile & Certificates</h1>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="certificates">
            Certificates ({certificates.length})
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback>
                    {profile.full_name?.substring(0, 2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Photo
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={profile.full_name || ''}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="trade">Trade/Profession</Label>
                  <Input
                    id="trade"
                    value={profile.trade || ''}
                    onChange={(e) => setProfile({ ...profile, trade: e.target.value })}
                    placeholder="e.g., Electrician, Plumber"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio || ''}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={4}
                  placeholder="Tell us about your experience..."
                />
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600" />
                        <Label htmlFor="share-consent" className="text-base font-semibold">
                          Certificate Sharing Consent
                        </Label>
                      </div>
                      <p className="text-sm text-gray-600">
                        Allow your certificates to be shared across organizations and projects you join.
                        This means you won't need to re-upload certificates when switching employers.
                      </p>
                    </div>
                    <Switch
                      id="share-consent"
                      checked={shareConsent}
                      onCheckedChange={setShareConsent}
                    />
                  </div>
                </CardContent>
              </Card>

              <Button onClick={updateProfile}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>My Certificates</CardTitle>
              <CertificateUpload userId={user?.id} onSuccess={loadProfileData} />
            </CardHeader>
            <CardContent>
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
                              {getStatusBadge(cert.status, cert.expiry_date)}
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

                            {cert.rejection_reason && (
                              <Alert className="mt-2">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                  Rejection reason: {cert.rejection_reason}
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
                          <Button size="sm" variant="outline">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {certificates.length === 0 && (
                  <div className="text-center py-12">
                    <Award className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">No certificates uploaded yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Upload your first certificate to get started
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Activity tracking coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}