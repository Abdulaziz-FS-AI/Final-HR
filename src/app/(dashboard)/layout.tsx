'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

export default function ProtectedDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if we're certain the user is not authenticated
    // Add a small delay to prevent flash
    if (!loading && !isAuthenticated) {
      console.log('🚫 Not authenticated, redirecting to login')
      const timer = setTimeout(() => {
        router.replace('/auth/login')
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [loading, isAuthenticated, router])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">Loading your dashboard...</h2>
            <p className="text-gray-500">Please wait while we prepare everything</p>
          </div>
        </div>
      </div>
    )
  }

  // Redirect if not authenticated (shouldn't reach here due to useEffect, but safety check)
  if (!isAuthenticated || !user) {
    return null
  }

  // Render dashboard with proper layout
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  )
}