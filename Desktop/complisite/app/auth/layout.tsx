import type React from "react"
import { Building2 } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">CompliSite</h1>
          </div>
          <p className="text-muted-foreground text-sm">Construction Compliance Made Simple</p>
        </div>
        {children}
      </div>
    </div>
  )
}
