"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [signupData, setSignupData] = useState({
    companyName: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    acceptTerms: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Prevent hydration issues with browser extensions
  useEffect(() => {
    setMounted(true)
  }, [])

  const validateSignup = () => {
    const newErrors: Record<string, string> = {}

    if (!signupData.companyName) {
      newErrors.companyName = "Company name is required"
    }

    if (!signupData.fullName) {
      newErrors.fullName = "Full name is required"
    }

    if (!signupData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(signupData.email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (!signupData.password) {
      newErrors.password = "Password is required"
    } else if (signupData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    if (!signupData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (signupData.password !== signupData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (!signupData.role) {
      newErrors.role = "Please select a role"
    }

    if (!signupData.acceptTerms) {
      newErrors.acceptTerms = "You must accept the terms and conditions"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateSignup()) return

    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsLoading(false)
  }

  const handleGoogleAuth = async () => {
    setIsLoading(true)
    // Simulate Google OAuth
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl text-center text-card-foreground">Create Account</CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Join CompliSite to manage your construction compliance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignup} className="space-y-4" suppressHydrationWarning={true}>
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input
              id="company-name"
              placeholder="Enter your company name"
              value={signupData.companyName}
              onChange={(e) => setSignupData((prev) => ({ ...prev, companyName: e.target.value }))}
              className={errors.companyName ? "border-destructive" : ""}
              suppressHydrationWarning={true}
            />
            {errors.companyName && <p className="text-sm text-destructive">{errors.companyName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="full-name">Full Name</Label>
            <Input
              id="full-name"
              placeholder="Enter your full name"
              value={signupData.fullName}
              onChange={(e) => setSignupData((prev) => ({ ...prev, fullName: e.target.value }))}
              className={errors.fullName ? "border-destructive" : ""}
              suppressHydrationWarning={true}
            />
            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={signupData.email}
              onChange={(e) => setSignupData((prev) => ({ ...prev, email: e.target.value }))}
              className={errors.email ? "border-destructive" : ""}
              suppressHydrationWarning={true}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={signupData.password}
              onChange={(e) => setSignupData((prev) => ({ ...prev, password: e.target.value }))}
              className={errors.password ? "border-destructive" : ""}
              suppressHydrationWarning={true}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm your password"
              value={signupData.confirmPassword}
              onChange={(e) => setSignupData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              className={errors.confirmPassword ? "border-destructive" : ""}
              suppressHydrationWarning={true}
            />
            {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={signupData.role}
              onValueChange={(value) => setSignupData((prev) => ({ ...prev, role: value }))}
            >
              <SelectTrigger className={errors.role ? "border-destructive" : ""}>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="worker">Worker</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="accept-terms"
              checked={signupData.acceptTerms}
              onCheckedChange={(checked) => setSignupData((prev) => ({ ...prev, acceptTerms: checked as boolean }))}
            />
            <Label htmlFor="accept-terms" className="text-sm">
              I accept the{" "}
              <Button variant="link" className="px-0 h-auto text-primary hover:text-primary/80">
                Terms and Conditions
              </Button>
            </Label>
          </div>
          {errors.acceptTerms && <p className="text-sm text-destructive">{errors.acceptTerms}</p>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full mt-4 bg-transparent"
          onClick={handleGoogleAuth}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          Google
        </Button>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
