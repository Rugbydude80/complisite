# Certificate Management System

## Overview

The Certificate Management System provides a comprehensive solution for managing construction worker certificates in a portable, reusable way. Workers can upload certificates once and use them across multiple projects and employers.

## Key Features

### 🔐 Portable Certificates
- Upload once, use everywhere
- No need to re-upload certificates when switching employers
- Consent-based sharing system

### 📅 Automatic Expiry Tracking
- Real-time expiry monitoring
- Notifications at 90, 60, 30, 14, 7, and 1 day before expiry
- Automatic status updates for expired certificates

### ✅ Verification Workflow
- Manual verification by organization admins
- Support for future API-based verification
- Rejection with detailed reasons

### 📊 Project Readiness
- Check team member certificate compliance
- Identify missing or expiring certificates
- Overall project readiness scoring

### 🔔 Smart Notifications
- Expiry warnings
- Verification status updates
- Rejection notifications

## Database Schema

### Core Tables

#### `certificate_types`
Pre-defined certificate types with standard UK construction certificates:
- ECS Card (Electrical)
- CSCS Card (General)
- First Aid (Health & Safety)
- Asbestos Awareness (Health & Safety)
- Manual Handling (Health & Safety)
- Working at Height (Health & Safety)
- Fire Safety (Health & Safety)
- PAT Testing (Electrical)
- 17th Edition Wiring (Electrical)
- Gas Safe (Plumbing)

#### `user_certificates`
Individual user certificates with:
- Certificate type reference
- Issue and expiry dates
- File attachments
- Verification status
- Rejection reasons

#### `certificate_shares`
Certificate sharing permissions:
- Organization-level sharing
- Project-level sharing
- Consent-based access

#### `project_required_certificates`
Project-specific certificate requirements:
- Mandatory vs optional certificates
- Project compliance tracking

#### `certificate_notifications`
Automated notification system:
- Expiry warnings
- Status change notifications
- Read/unread tracking

## Components

### CertificateUpload
Drag-and-drop certificate upload with:
- File type validation (PDF, images)
- Size limits (10MB)
- Automatic expiry date calculation
- Certificate type selection

### CertificateVerification
Admin interface for:
- Reviewing pending certificates
- Approving/rejecting certificates
- Downloading certificate files
- Adding rejection reasons

### ProjectReadiness
Project compliance dashboard showing:
- Team member certificate status
- Missing certificates
- Expiring certificates
- Overall readiness percentage

### CertificateExpiryDashboard
Organization-wide expiry monitoring:
- Expiry statistics
- Filtered views (all, expiring, expired)
- Download capabilities
- Alert notifications

## API Endpoints

### CertificateService Methods

#### Core Operations
- `createCertificate()` - Upload new certificate
- `getUserCertificates()` - Get user's certificates
- `getOrganizationCertificates()` - Get org certificates
- `verifyCertificate()` - Approve certificate
- `rejectCertificate()` - Reject with reason

#### Sharing
- `shareCertificateWithOrganization()` - Share with org
- `shareCertificateWithProject()` - Share with project

#### Analytics
- `checkProjectReadiness()` - Project compliance check
- `getExpiringCertificates()` - Expiry monitoring
- `getCertificateTypes()` - Available certificate types

## Security Features

### Row Level Security (RLS)
- Users can only manage their own certificates
- Organization members can view shared certificates
- Admins can verify certificates within their organization

### File Storage
- Secure file upload to Supabase Storage
- Signed URLs for file access
- File type and size validation

### Consent Management
- User-controlled certificate sharing
- Granular sharing permissions
- Audit trail for all actions

## Usage Examples

### Uploading a Certificate
```typescript
const certificate = await CertificateService.createCertificate(userId, {
  certificate_type_id: 'ecs-card-id',
  certificate_number: 'ECS123456',
  issuing_body: 'JIB',
  issue_date: '2024-01-01',
  expiry_date: '2027-01-01',
  file: certificateFile
})
```

### Checking Project Readiness
```typescript
const readiness = await CertificateService.checkProjectReadiness(projectId)
// Returns array of team members with their certificate status
```

### Getting Expiring Certificates
```typescript
const expiring = await CertificateService.getExpiringCertificates(orgId, 30)
// Returns certificates expiring within 30 days
```

## Setup Instructions

### 1. Database Setup
Run the SQL commands in `database-production.sql` to create all tables and policies.

### 2. Storage Bucket
Create a `certificates` bucket in Supabase Storage with appropriate RLS policies.

### 3. Dependencies
```bash
npm install react-dropzone date-fns
```

### 4. Environment Variables
Ensure your Supabase configuration is properly set up in your environment.

## Future Enhancements

### API Integration
- Automatic verification with issuing bodies
- Real-time certificate validation
- Blockchain-based certificate verification

### Advanced Analytics
- Certificate trend analysis
- Compliance reporting
- Predictive expiry modeling

### Mobile Support
- Mobile certificate scanning
- Offline certificate storage
- Push notifications

## Troubleshooting

### Common Issues

#### File Upload Failures
- Check file size (max 10MB)
- Verify file type (PDF or images only)
- Ensure storage bucket permissions

#### Certificate Verification
- Verify user has admin role in organization
- Check RLS policies are correctly configured
- Ensure certificate is in 'pending_verification' status

#### Expiry Notifications
- Check cron job is running for automatic expiry checks
- Verify notification preferences are enabled
- Ensure email service is configured

## Support

For technical support or feature requests, please refer to the main project documentation or contact the development team.
