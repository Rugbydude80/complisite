'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'

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

interface CertificateManagementProps {
  certificates: Certificate[]
  onEdit?: (certificate: Certificate) => void
  onDelete?: (certificateId: string) => void
  onView?: (certificate: Certificate) => void
  onDownload?: (certificate: Certificate) => void
}

export function CertificateManagement({ 
  certificates, 
  onEdit, 
  onDelete, 
  onView, 
  onDownload 
}: CertificateManagementProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('expiry_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Get unique categories
  const categories = Array.from(new Set(certificates.map(c => c.category)))

  // Filter and sort certificates
  const filteredCertificates = certificates
    .filter(cert => {
      const matchesSearch = cert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cert.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cert.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || cert.category === categoryFilter
      const matchesStatus = statusFilter === 'all' || cert.status === statusFilter
      
      return matchesSearch && matchesCategory && matchesStatus
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'category':
          comparison = a.category.localeCompare(b.category)
          break
        case 'expiry_date':
          comparison = new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
          break
        case 'issue_date':
          comparison = new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime()
          break
        case 'status':
          const statusOrder = { 'expired': 0, 'expiring': 1, 'valid': 2 }
          comparison = statusOrder[a.status] - statusOrder[b.status]
          break
        default:
          comparison = 0
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

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

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filter & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search certificates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="expiry_date">Expiry Date</SelectItem>
                  <SelectItem value="issue_date">Issue Date</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredCertificates.length} of {certificates.length} certificates
        </p>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-green-600">
            Valid: {certificates.filter(c => c.status === 'valid').length}
          </Badge>
          <Badge variant="outline" className="text-orange-600">
            Expiring: {certificates.filter(c => c.status === 'expiring').length}
          </Badge>
          <Badge variant="outline" className="text-red-600">
            Expired: {certificates.filter(c => c.status === 'expired').length}
          </Badge>
        </div>
      </div>

      {/* Certificates List */}
      <div className="space-y-4">
        {filteredCertificates.map((certificate) => {
          const daysUntilExpiry = getDaysUntilExpiry(certificate.expiry_date)
          
          return (
            <Card key={certificate.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {getStatusIcon(certificate.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{certificate.name}</h3>
                        {getStatusBadge(certificate.status)}
                        {certificate.isRenewable && (
                          <Badge variant="outline" className="text-green-600">Renewable</Badge>
                        )}
                        {certificate.requiresTraining && (
                          <Badge variant="outline" className="text-blue-600">Training Required</Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Category:</span> {certificate.category}
                        </div>
                        <div>
                          <span className="font-medium">Type:</span> {certificate.type}
                        </div>
                        <div>
                          <span className="font-medium">Issued by:</span> {certificate.issuingOrganization}
                        </div>
                        <div>
                          <span className="font-medium">Certificate #:</span> {certificate.certificateNumber}
                        </div>
                        <div>
                          <span className="font-medium">Issued:</span> {new Date(certificate.issue_date).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Expires:</span> {new Date(certificate.expiry_date).toLocaleDateString()}
                          {certificate.status === 'expiring' && (
                            <span className="text-orange-600 ml-1">({daysUntilExpiry} days)</span>
                          )}
                        </div>
                      </div>
                      
                      {certificate.description && (
                        <p className="text-sm text-gray-600 mb-3">{certificate.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {onView && (
                      <Button variant="ghost" size="sm" onClick={() => onView(certificate)} title="View Certificate">
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {onDownload && (
                      <Button variant="ghost" size="sm" onClick={() => onDownload(certificate)} title="Download Certificate">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {onEdit && (
                      <Button variant="ghost" size="sm" onClick={() => onEdit(certificate)} title="Edit Certificate">
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button variant="ghost" size="sm" onClick={() => onDelete(certificate.id)} title="Delete Certificate" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
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
          <CardContent className="text-center py-8">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No certificates found matching your criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
