'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Upload, 
  FileText, 
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Predefined certificate categories and types
const CERTIFICATE_CATEGORIES = {
  'Safety Training': [
    'OSHA 10-Hour Construction Safety',
    'OSHA 30-Hour Construction Safety',
    'OSHA 40-Hour HAZWOPER',
    'OSHA 8-Hour HAZWOPER Refresher',
    'Confined Space Entry',
    'Fall Protection',
    'Scaffolding Safety',
    'Electrical Safety',
    'Lockout/Tagout',
    'Personal Protective Equipment (PPE)'
  ],
  'Medical Certifications': [
    'First Aid CPR/AED',
    'Basic Life Support (BLS)',
    'Advanced Cardiac Life Support (ACLS)',
    'Pediatric Advanced Life Support (PALS)',
    'Bloodborne Pathogens',
    'Medical Examiner Certificate (DOT)'
  ],
  'Equipment Certifications': [
    'Forklift Operator License',
    'Crane Operator Certification',
    'Aerial Lift Certification',
    'Heavy Equipment Operator',
    'Welding Certification',
    'Rigging and Signal Person',
    'Hoisting License'
  ],
  'Trade Certifications': [
    'Journeyman Electrician',
    'Master Electrician',
    'Plumber License',
    'HVAC Certification',
    'Welder Certification',
    'Carpenter Certification',
    'Ironworker Certification',
    'Concrete Finisher'
  ],
  'Environmental Certifications': [
    'Asbestos Awareness',
    'Lead Paint Certification',
    'Mold Remediation',
    'Hazardous Materials Handling',
    'Environmental Compliance'
  ],
  'Management Certifications': [
    'Project Management Professional (PMP)',
    'Construction Management',
    'Safety Management',
    'Quality Management',
    'Environmental Management'
  ]
}

const ISSUING_ORGANIZATIONS = [
  'OSHA (Occupational Safety and Health Administration)',
  'American Red Cross',
  'American Heart Association',
  'National Safety Council',
  'Associated General Contractors (AGC)',
  'Construction Industry Institute',
  'International Association of Bridge, Structural, Ornamental and Reinforcing Iron Workers',
  'International Brotherhood of Electrical Workers (IBEW)',
  'United Association of Journeymen and Apprentices',
  'International Union of Operating Engineers',
  'Laborers International Union of North America',
  'Other'
]

interface CertificateFormData {
  category: string
  type: string
  issuingOrganization: string
  certificateNumber: string
  issueDate: string
  expiryDate: string
  description: string
  file: File | null
  isRenewable: boolean
  requiresTraining: boolean
}

export default function CertificateUploadPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<CertificateFormData>({
    category: '',
    type: '',
    issuingOrganization: '',
    certificateNumber: '',
    issueDate: '',
    expiryDate: '',
    description: '',
    file: null,
    isRenewable: true,
    requiresTraining: false
  })
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof CertificateFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, file }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.category) newErrors.category = 'Category is required'
    if (!formData.type) newErrors.type = 'Certificate type is required'
    if (!formData.issuingOrganization) newErrors.issuingOrganization = 'Issuing organization is required'
    if (!formData.certificateNumber) newErrors.certificateNumber = 'Certificate number is required'
    if (!formData.issueDate) newErrors.issueDate = 'Issue date is required'
    if (!formData.expiryDate) newErrors.expiryDate = 'Expiry date is required'
    if (!formData.file) newErrors.file = 'Certificate file is required'

    // Validate dates
    if (formData.issueDate && formData.expiryDate) {
      const issueDate = new Date(formData.issueDate)
      const expiryDate = new Date(formData.expiryDate)
      if (expiryDate <= issueDate) {
        newErrors.expiryDate = 'Expiry date must be after issue date'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please log in to upload certificates')
        return
      }

      // Upload file to Supabase storage first
      let filePath = null
      if (formData.file) {
        const fileExt = formData.file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('certificates')
          .upload(fileName, formData.file)
        
        if (uploadError) throw uploadError
        filePath = uploadData.path
      }

      // Insert certificate record
      const { error } = await supabase
        .from('user_certificates')
        .insert({
          user_id: user.id,
          certificate_number: formData.certificateNumber,
          issuing_body: formData.issuingOrganization,
          issue_date: formData.issueDate,
          expiry_date: formData.expiryDate,
          file_path: filePath,
          file_size: formData.file?.size,
          file_type: formData.file?.type,
          status: 'pending_verification',
          verification_method: 'manual',
          metadata: {
            category: formData.category,
            type: formData.type,
            description: formData.description,
            is_renewable: formData.isRenewable,
            requires_training: formData.requiresTraining
          }
        })

      if (error) throw error
      
      // Redirect to certificates page
      router.push('/certificates')
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to upload certificate. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const getCertificateTypes = () => {
    return formData.category ? CERTIFICATE_CATEGORIES[formData.category as keyof typeof CERTIFICATE_CATEGORIES] || [] : []
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/certificates">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Certificates
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold">Upload New Certificate</h1>
        <p className="text-gray-600">Add your professional certifications and training records</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Certificate Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Certificate Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(CERTIFICATE_CATEGORIES).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
              </div>

              <div>
                <Label htmlFor="type">Certificate Type *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => handleInputChange('type', value)}
                  disabled={!formData.category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select certificate type" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCertificateTypes().map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="issuingOrganization">Issuing Organization *</Label>
              <Select value={formData.issuingOrganization} onValueChange={(value) => handleInputChange('issuingOrganization', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select issuing organization" />
                </SelectTrigger>
                <SelectContent>
                  {ISSUING_ORGANIZATIONS.map((org) => (
                    <SelectItem key={org} value={org}>
                      {org}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.issuingOrganization && <p className="text-red-500 text-sm mt-1">{errors.issuingOrganization}</p>}
            </div>

            <div>
              <Label htmlFor="certificateNumber">Certificate Number *</Label>
              <Input
                id="certificateNumber"
                value={formData.certificateNumber}
                onChange={(e) => handleInputChange('certificateNumber', e.target.value)}
                placeholder="Enter certificate number"
              />
              {errors.certificateNumber && <p className="text-red-500 text-sm mt-1">{errors.certificateNumber}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="issueDate">Issue Date *</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => handleInputChange('issueDate', e.target.value)}
                />
                {errors.issueDate && <p className="text-red-500 text-sm mt-1">{errors.issueDate}</p>}
              </div>

              <div>
                <Label htmlFor="expiryDate">Expiry Date *</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                />
                {errors.expiryDate && <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRenewable"
                  checked={formData.isRenewable}
                  onCheckedChange={(checked) => handleInputChange('isRenewable', checked as boolean)}
                />
                <Label htmlFor="isRenewable">This certificate is renewable</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiresTraining"
                  checked={formData.requiresTraining}
                  onCheckedChange={(checked) => handleInputChange('requiresTraining', checked as boolean)}
                />
                <Label htmlFor="requiresTraining">Requires ongoing training</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Certificate File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file">Upload Certificate *</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileChange}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)
              </p>
              {errors.file && <p className="text-red-500 text-sm mt-1">{errors.file}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Add any additional notes about this certificate..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={uploading}>
            {uploading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Certificate
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
