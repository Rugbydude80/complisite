'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react'
import { CertificateService, type CertificateType } from '@/lib/certificate-service'
import { useDropzone } from 'react-dropzone'

interface CertificateUploadProps {
  userId: string
  onSuccess?: () => void
}

export function CertificateUpload({ userId, onSuccess }: CertificateUploadProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [certificateTypes, setCertificateTypes] = useState<CertificateType[]>([])
  const [formData, setFormData] = useState({
    certificate_type_id: '',
    certificate_number: '',
    issuing_body: '',
    issue_date: '',
    expiry_date: '',
    file: null as File | null
  })

  // Load certificate types when dialog opens
  const loadCertificateTypes = async () => {
    const types = await CertificateService.getCertificateTypes()
    setCertificateTypes(types)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFormData({ ...formData, file: acceptedFiles[0] })
      }
    }
  })

  const handleSubmit = async () => {
    setError('')
    
    if (!formData.certificate_type_id || !formData.issue_date) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      await CertificateService.createCertificate(userId, formData)
      setOpen(false)
      setFormData({
        certificate_type_id: '',
        certificate_number: '',
        issuing_body: '',
        issue_date: '',
        expiry_date: '',
        file: null
      })
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Failed to upload certificate')
    } finally {
      setLoading(false)
    }
  }

  const selectedType = certificateTypes.find(t => t.id === formData.certificate_type_id)

  // Calculate suggested expiry date based on typical duration
  const calculateExpiryDate = (issueDate: string, months: number) => {
    const date = new Date(issueDate)
    date.setMonth(date.getMonth() + months)
    return date.toISOString().split('T')[0]
  }

  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o)
      if (o) loadCertificateTypes()
    }}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Certificate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Certificate</DialogTitle>
          <DialogDescription>
            Upload a new certificate. It will be available across all your projects once verified.
          </DialogDescription>
        </DialogHeader>

        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            This certificate will be portable across all projects and employers once approved.
            You won't need to upload it again!
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label htmlFor="type">Certificate Type *</Label>
            <Select
              value={formData.certificate_type_id}
              onValueChange={(value) => setFormData({ ...formData, certificate_type_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select certificate type" />
              </SelectTrigger>
              <SelectContent>
                {certificateTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name} ({type.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="number">Certificate Number</Label>
            <Input
              id="number"
              value={formData.certificate_number}
              onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
              placeholder="e.g., ECS123456"
            />
          </div>

          <div>
            <Label htmlFor="issuer">Issuing Body</Label>
            <Select
              value={formData.issuing_body}
              onValueChange={(value) => setFormData({ ...formData, issuing_body: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select or enter issuing body" />
              </SelectTrigger>
              <SelectContent>
                {selectedType?.issuing_bodies?.map((body) => (
                  <SelectItem key={body} value={body}>
                    {body}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="issue_date">Issue Date *</Label>
              <Input
                id="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={(e) => {
                  const issueDate = e.target.value
                  setFormData({ 
                    ...formData, 
                    issue_date: issueDate,
                    expiry_date: selectedType?.typical_duration_months 
                      ? calculateExpiryDate(issueDate, selectedType.typical_duration_months)
                      : formData.expiry_date
                  })
                }}
              />
            </div>

            <div>
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                min={formData.issue_date}
              />
              {selectedType?.typical_duration_months === 999 && (
                <p className="text-xs text-gray-500 mt-1">No expiry</p>
              )}
            </div>
          </div>

          <div>
            <Label>Certificate File</Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition
                ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
            >
              <input {...getInputProps()} />
              {formData.file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div className="text-left">
                    <p className="font-medium">{formData.file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    {isDragActive
                      ? 'Drop the file here'
                      : 'Drag and drop your certificate, or click to browse'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF or images up to 10MB
                  </p>
                </>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Certificate'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
