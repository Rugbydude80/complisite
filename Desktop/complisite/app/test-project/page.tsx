'use client'

import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestProjectPage() {
  const router = useRouter()

  const testProjectId = '550e8400-e29b-41d4-a716-446655440001' // Downtown Office Complex

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Test Project Detail Navigation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>This page tests the project detail navigation functionality.</p>
          <div className="space-y-2">
            <Button 
              onClick={() => router.push(`/projects/${testProjectId}`)}
              className="w-full"
            >
              Test Project Detail Page (Downtown Office Complex)
            </Button>
            <Button 
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            <p><strong>Note:</strong> Make sure you've run the database setup SQL in Supabase first.</p>
            <p>Expected behavior: Clicking the button should navigate to the project detail page with real data.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
