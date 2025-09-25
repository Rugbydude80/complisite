'use client'

import { useState, useEffect } from 'react'
import { AdminDashboard } from '@/components/dashboards/admin-dashboard'
import { ManagerDashboard } from '@/components/dashboards/manager-dashboard'
import { WorkerDashboard } from '@/components/dashboards/worker-dashboard'
import { createClient } from '@/lib/supabase'

export default function Dashboard() {
  const supabase = createClient()
  const [userRole, setUserRole] = useState<string>('worker')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUserRole()
  }, [])

  const getUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUserRole('worker')
        setLoading(false)
        return
      }

      // Check if user is an organization admin
      try {
        const { data: orgMember } = await supabase
          .from('secure_organization_members')
          .select('role')
          .eq('user_id', user.id)
          .single()

        if (orgMember?.role === 'admin') {
          setUserRole('admin')
        } else if (orgMember?.role === 'member') {
          // Check if they're a project manager
          try {
            const { data: projectRole } = await supabase
              .from('project_members')
              .select('role')
              .eq('user_id', user.id)
              .eq('role', 'admin')
              .limit(1)

            setUserRole(projectRole ? 'manager' : 'worker')
          } catch (error) {
            console.log('Could not check project role, defaulting to worker')
            setUserRole('worker')
          }
        } else {
          setUserRole('worker')
        }
      } catch (error) {
        console.log('Could not check organization role, defaulting to worker')
        setUserRole('worker')
      }
    } catch (error) {
      console.error('Error getting user role:', error)
      setUserRole('worker')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  // Render different dashboard based on role
  switch (userRole) {
    case 'admin':
      return <AdminDashboard />
    case 'manager':
      return <ManagerDashboard />
    default:
      return <WorkerDashboard />
  }
}
