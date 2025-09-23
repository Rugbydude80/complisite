'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/header'
import { supabase } from '@/lib/supabase'
import { User, Mail, Phone, Briefcase, FileText, Camera } from 'lucide-react'

interface UserProfile {
  user_id: string
  full_name: string
  email: string
  phone?: string
  trade?: string
  bio?: string
  avatar_url?: string
  share_certificates: boolean
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    trade: '',
    bio: '',
    share_certificates: true
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user profile
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (profileData) {
        setProfile(profileData)
        setFormData({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          trade: profileData.trade || '',
          bio: profileData.bio || '',
          share_certificates: profileData.share_certificates
        })
      } else {
        // Create initial profile
        const newProfile = {
          user_id: user.id,
          email: user.email || '',
          full_name: '',
          share_certificates: true
        }
        setProfile(newProfile)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          email: user.email,
          ...formData,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      await loadProfile()
      setEditMode(false)
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Error saving profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        trade: profile.trade || '',
        bio: profile.bio || '',
        share_certificates: profile.share_certificates
      })
    }
    setEditMode(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6">
          <div>Loading profile...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Profile</h1>
          {!editMode && (
            <Button onClick={() => setEditMode(true)}>
              Edit Profile
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="text-lg">
                      {profile?.full_name?.substring(0, 2).toUpperCase() || '??'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-xl">
                  {profile?.full_name || 'No name set'}
                </CardTitle>
                <p className="text-muted-foreground">{profile?.email}</p>
                {profile?.trade && (
                  <Badge variant="secondary" className="mt-2">
                    <Briefcase className="w-3 h-3 mr-1" />
                    {profile.trade}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profile?.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{profile?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {profile?.share_certificates ? 'Certificates shared' : 'Certificates private'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    {editMode ? (
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <p className="mt-1 text-sm">{profile?.full_name || 'Not set'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    {editMode ? (
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <p className="mt-1 text-sm">{profile?.phone || 'Not set'}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="trade">Trade/Profession</Label>
                  {editMode ? (
                    <Input
                      id="trade"
                      value={formData.trade}
                      onChange={(e) => setFormData({ ...formData, trade: e.target.value })}
                      placeholder="e.g., Electrician, Plumber, General Contractor"
                    />
                  ) : (
                    <p className="mt-1 text-sm">{profile?.trade || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  {editMode ? (
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us about yourself and your experience..."
                      rows={4}
                    />
                  ) : (
                    <p className="mt-1 text-sm whitespace-pre-wrap">
                      {profile?.bio || 'No bio provided'}
                    </p>
                  )}
                </div>

                {editMode && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="share_certificates"
                      checked={formData.share_certificates}
                      onChange={(e) => setFormData({ ...formData, share_certificates: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="share_certificates">
                      Share my certificates with team members
                    </Label>
                  </div>
                )}

                {editMode && (
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
