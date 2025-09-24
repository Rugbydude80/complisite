'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Settings, 
  User, 
  Bell,
  Shield,
  Database,
  Mail,
  Phone,
  Save,
  Eye,
  EyeOff
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface UserSettings {
  full_name: string
  email: string
  phone: string
  trade: string
  bio: string
  avatar_url: string
  share_certificates: boolean
  email_notifications: boolean
  sms_notifications: boolean
  weekly_reports: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    full_name: '',
    email: '',
    phone: '',
    trade: '',
    bio: '',
    avatar_url: '',
    share_certificates: true,
    email_notifications: true,
    sms_notifications: false,
    weekly_reports: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    loadUserSettings()
  }, [])

  const loadUserSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load user profile data
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profile) {
        setSettings({
          full_name: profile.full_name || '',
          email: user.email || '',
          phone: profile.phone || '',
          trade: profile.trade || '',
          bio: profile.bio || '',
          avatar_url: profile.avatar_url || '',
          share_certificates: profile.share_certificates ?? true,
          email_notifications: true, // Default values
          sms_notifications: false,
          weekly_reports: true
        })
      }
    } catch (error) {
      console.error('Error loading user settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Update user profile
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          full_name: settings.full_name,
          phone: settings.phone,
          trade: settings.trade,
          bio: settings.bio,
          avatar_url: settings.avatar_url,
          share_certificates: settings.share_certificates,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      // Show success message
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof UserSettings, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={settings.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="trade">Trade/Profession</Label>
                  <Input
                    id="trade"
                    value={settings.trade}
                    onChange={(e) => handleInputChange('trade', e.target.value)}
                    placeholder="e.g., Electrician, Carpenter"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={settings.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="avatar_url">Avatar URL</Label>
                <Input
                  id="avatar_url"
                  value={settings.avatar_url}
                  onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email_notifications"
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => handleInputChange('email_notifications', checked as boolean)}
                />
                <Label htmlFor="email_notifications">Email Notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sms_notifications"
                  checked={settings.sms_notifications}
                  onCheckedChange={(checked) => handleInputChange('sms_notifications', checked as boolean)}
                />
                <Label htmlFor="sms_notifications">SMS Notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="weekly_reports"
                  checked={settings.weekly_reports}
                  onCheckedChange={(checked) => handleInputChange('weekly_reports', checked as boolean)}
                />
                <Label htmlFor="weekly_reports">Weekly Reports</Label>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Privacy Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="share_certificates"
                  checked={settings.share_certificates}
                  onCheckedChange={(checked) => handleInputChange('share_certificates', checked as boolean)}
                />
                <Label htmlFor="share_certificates">Share Certificates with Team</Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Save Button */}
          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Change Email
              </Button>
              <Button variant="outline" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button variant="outline" className="w-full text-red-600 hover:text-red-700">
                Delete Account
              </Button>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Version:</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span>Today</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account Type:</span>
                <span>Standard</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
