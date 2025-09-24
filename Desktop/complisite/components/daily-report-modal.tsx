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
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, FileText, Loader2, AlertCircle } from 'lucide-react'
import { ProjectService } from '@/lib/project-service'

interface DailyReportModalProps {
  projectId: string
  onSuccess?: () => void
}

export function DailyReportModal({ projectId, onSuccess }: DailyReportModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    report_date: new Date().toISOString().split('T')[0],
    weather: '',
    temperature_celsius: '',
    site_conditions: '',
    workers_on_site: '',
    work_completed: '',
    issues_raised: '',
    health_safety_observations: '',
    materials_delivered: '',
    visitors: [] as string[]
  })
  const [visitorInput, setVisitorInput] = useState('')

  const handleSubmit = async () => {
    setError('')
    
    if (!formData.report_date) {
      setError('Please select a report date')
      return
    }

    setLoading(true)

    try {
      await ProjectService.createDailyReport(projectId, {
        ...formData,
        temperature_celsius: formData.temperature_celsius ? parseInt(formData.temperature_celsius) : undefined,
        workers_on_site: formData.workers_on_site ? parseInt(formData.workers_on_site) : undefined,
        visitors: formData.visitors
      })
      
      setOpen(false)
      setFormData({
        report_date: new Date().toISOString().split('T')[0],
        weather: '',
        temperature_celsius: '',
        site_conditions: '',
        workers_on_site: '',
        work_completed: '',
        issues_raised: '',
        health_safety_observations: '',
        materials_delivered: '',
        visitors: []
      })
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Failed to submit daily report')
    } finally {
      setLoading(false)
    }
  }

  const addVisitor = () => {
    if (visitorInput.trim()) {
      setFormData({
        ...formData,
        visitors: [...formData.visitors, visitorInput.trim()]
      })
      setVisitorInput('')
    }
  }

  const removeVisitor = (index: number) => {
    setFormData({
      ...formData,
      visitors: formData.visitors.filter((_, i) => i !== index)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <FileText className="mr-2 h-4 w-4" />
          Submit Daily Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Daily Site Report</DialogTitle>
          <DialogDescription>
            Submit your daily site report with work progress, safety observations, and site conditions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="report_date">Report Date *</Label>
              <Input
                id="report_date"
                type="date"
                value={formData.report_date}
                onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="weather">Weather Conditions</Label>
              <Select
                value={formData.weather}
                onValueChange={(value) => setFormData({ ...formData, weather: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select weather" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sunny">Sunny</SelectItem>
                  <SelectItem value="cloudy">Cloudy</SelectItem>
                  <SelectItem value="overcast">Overcast</SelectItem>
                  <SelectItem value="rainy">Rainy</SelectItem>
                  <SelectItem value="windy">Windy</SelectItem>
                  <SelectItem value="foggy">Foggy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="temperature">Temperature (°C)</Label>
              <Input
                id="temperature"
                type="number"
                value={formData.temperature_celsius}
                onChange={(e) => setFormData({ ...formData, temperature_celsius: e.target.value })}
                placeholder="e.g., 15"
              />
            </div>
            <div>
              <Label htmlFor="workers">Workers on Site</Label>
              <Input
                id="workers"
                type="number"
                value={formData.workers_on_site}
                onChange={(e) => setFormData({ ...formData, workers_on_site: e.target.value })}
                placeholder="e.g., 8"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="site_conditions">Site Conditions</Label>
            <Textarea
              id="site_conditions"
              value={formData.site_conditions}
              onChange={(e) => setFormData({ ...formData, site_conditions: e.target.value })}
              placeholder="Describe current site conditions, access, safety measures, etc."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="work_completed">Work Completed Today</Label>
            <Textarea
              id="work_completed"
              value={formData.work_completed}
              onChange={(e) => setFormData({ ...formData, work_completed: e.target.value })}
              placeholder="Detail what work was completed, progress made, milestones achieved..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="issues_raised">Issues Raised</Label>
            <Textarea
              id="issues_raised"
              value={formData.issues_raised}
              onChange={(e) => setFormData({ ...formData, issues_raised: e.target.value })}
              placeholder="Any issues, delays, problems encountered, or concerns..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="health_safety">Health & Safety Observations</Label>
            <Textarea
              id="health_safety"
              value={formData.health_safety_observations}
              onChange={(e) => setFormData({ ...formData, health_safety_observations: e.target.value })}
              placeholder="Safety incidents, near misses, observations, compliance issues..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="materials">Materials Delivered</Label>
            <Textarea
              id="materials"
              value={formData.materials_delivered}
              onChange={(e) => setFormData({ ...formData, materials_delivered: e.target.value })}
              placeholder="List materials, equipment, or supplies delivered to site..."
              rows={2}
            />
          </div>

          <div>
            <Label>Visitors to Site</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={visitorInput}
                  onChange={(e) => setVisitorInput(e.target.value)}
                  placeholder="Enter visitor name"
                  onKeyPress={(e) => e.key === 'Enter' && addVisitor()}
                />
                <Button type="button" onClick={addVisitor} variant="outline">
                  Add
                </Button>
              </div>
              {formData.visitors.length > 0 && (
                <div className="space-y-1">
                  {formData.visitors.map((visitor, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                      <span className="text-sm">{visitor}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeVisitor(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
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
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
