import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AddProjectButton() {
  return (
    <div className="fixed bottom-6 right-6">
      <Button size="lg" className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-shadow">
        <Plus className="h-6 w-6" />
        <span className="sr-only">Add new project</span>
      </Button>
    </div>
  )
}
