'use client'

import { useState } from 'react'
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdvancedProjectWizard } from "@/components/advanced-project-wizard"

export function AddProjectButton() {
  const [showForm, setShowForm] = useState(false)

  const handleProjectCreated = (projectId: string) => {
    // Refresh the page to show the new project
    window.location.reload()
  }

  return (
    <>
      <div className="fixed bottom-6 right-6">
        <Button 
          size="lg" 
          className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-shadow"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">Add new project</span>
        </Button>
      </div>

      {showForm && (
        <AdvancedProjectWizard 
          onClose={() => setShowForm(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}
    </>
  )
}
