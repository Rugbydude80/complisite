'use client'

import { useState } from 'react'
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, pdf } from '@react-pdf/renderer'
import { Button } from '@/components/ui/button'
import { FileDown, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 20,
    borderBottom: '2pt solid #0070f3',
    paddingBottom: 10
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0070f3'
  },
  subtitle: {
    fontSize: 14,
    marginTop: 5,
    color: '#666'
  },
  section: {
    marginTop: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottom: '1pt solid #eee'
  },
  label: {
    fontWeight: 'bold',
    width: '40%'
  },
  value: {
    width: '60%'
  },
  checklistItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottom: '1pt solid #f0f0f0'
  },
  checkbox: {
    width: 15,
    height: 15,
    marginRight: 10,
    border: '1pt solid #333'
  },
  checkedBox: {
    backgroundColor: '#0070f3'
  },
  itemText: {
    flex: 1
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#666'
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10
  },
  photoContainer: {
    width: '30%',
    margin: 5,
    padding: 5,
    border: '1pt solid #ddd'
  },
  photoLabel: {
    fontSize: 10,
    marginTop: 5,
    textAlign: 'center'
  },
  summary: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f9f9f9'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5
  },
  badge: {
    padding: '3pt 8pt',
    borderRadius: 3,
    fontSize: 10,
    fontWeight: 'bold'
  },
  criticalBadge: {
    backgroundColor: '#ff4444',
    color: 'white'
  },
  highBadge: {
    backgroundColor: '#ff8800',
    color: 'white'
  },
  mediumBadge: {
    backgroundColor: '#ffcc00',
    color: 'black'
  },
  lowBadge: {
    backgroundColor: '#00cc66',
    color: 'white'
  }
})

// PDF Document Component
const ComplianceReportPDF = ({ project, checklist, items, photos }: any) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Compliance Report</Text>
        <Text style={styles.subtitle}>{project.name}</Text>
      </View>

      {/* Project Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Project Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Project Name:</Text>
          <Text style={styles.value}>{project.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>{project.address}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status:</Text>
          <Text style={styles.value}>{project.status}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Compliance Score:</Text>
          <Text style={styles.value}>{project.compliance_score}%</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Report Date:</Text>
          <Text style={styles.value}>{format(new Date(), 'dd/MM/yyyy')}</Text>
        </View>
      </View>

      {/* Checklist Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Checklist: {checklist.name}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Category:</Text>
          <Text style={styles.value}>{checklist.category}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Completed Items:</Text>
          <Text style={styles.value}>{checklist.completed_items} of {checklist.total_items}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Completion Rate:</Text>
          <Text style={styles.value}>
            {Math.round((checklist.completed_items / checklist.total_items) * 100)}%
          </Text>
        </View>
      </View>

      {/* Checklist Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Checklist Items</Text>
        {items.map((item: any, index: number) => (
          <View key={index} style={styles.checklistItem}>
            <View style={[styles.checkbox, item.is_completed && styles.checkedBox]} />
            <View style={styles.itemText}>
              <Text>{item.description}</Text>
              {item.priority && (
                <View style={{ marginTop: 5 }}>
                  <View style={[
                    styles.badge,
                    item.priority === 'critical' && styles.criticalBadge,
                    item.priority === 'high' && styles.highBadge,
                    item.priority === 'medium' && styles.mediumBadge,
                    item.priority === 'low' && styles.lowBadge
                  ]}>
                    <Text>{item.priority.toUpperCase()}</Text>
                  </View>
                </View>
              )}
              {item.comments && (
                <Text style={{ fontSize: 10, color: '#666', marginTop: 5 }}>
                  Note: {item.comments}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Summary Statistics */}
      <View style={styles.summary}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.summaryRow}>
          <Text>Total Items:</Text>
          <Text>{items.length}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>Completed:</Text>
          <Text>{items.filter((i: any) => i.is_completed).length}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>Pending:</Text>
          <Text>{items.filter((i: any) => !i.is_completed).length}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>Evidence Photos:</Text>
          <Text>{photos?.length || 0}</Text>
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        Generated by CompliSite on {format(new Date(), 'dd/MM/yyyy HH:mm')} | Page 1
      </Text>
    </Page>

    {/* Additional page for photos if they exist */}
    {photos && photos.length > 0 && (
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Evidence Photos</Text>
          <Text style={styles.subtitle}>{project.name} - {checklist.name}</Text>
        </View>
        
        <View style={styles.photoGrid}>
          {photos.map((photo: any, index: number) => (
            <View key={index} style={styles.photoContainer}>
              <Text style={styles.photoLabel}>Photo {index + 1}</Text>
              <Text style={{ fontSize: 8, marginTop: 2 }}>
                {format(new Date(photo.uploaded_at), 'dd/MM/yyyy HH:mm')}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Generated by CompliSite on {format(new Date(), 'dd/MM/yyyy HH:mm')} | Page 2
        </Text>
      </Page>
    )}
  </Document>
)

// Main Report Generator Component
export function ReportGenerator({ project, checklist, items, photos }: any) {
  const [generating, setGenerating] = useState(false)

  const generateAndDownload = async () => {
    setGenerating(true)
    
    try {
      const doc = <ComplianceReportPDF 
        project={project} 
        checklist={checklist} 
        items={items} 
        photos={photos} 
      />
      
      const asPdf = pdf(doc)
      const blob = await asPdf.toBlob()
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${project.name}_${checklist.name}_${format(new Date(), 'yyyy-MM-dd')}.pdf`
      link.click()
      
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Button 
      onClick={generateAndDownload}
      disabled={generating}
      className="w-full"
    >
      {generating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating Report...
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-4 w-4" />
          Download Compliance Report
        </>
      )}
    </Button>
  )
}
