'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from "@/lib/supabase"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Processing OAuth callback...')
        
        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('❌ OAuth callback error:', error)
          router.replace('/auth/login?error=oauth_failed')
          return
        }

        if (data.session) {
          console.log('✅ OAuth successful, redirecting to dashboard')
          // Redirect to dashboard - the auth context will handle the rest
          router.replace('/dashboard')
        } else {
          console.log('❌ No session found in callback')
          router.replace('/auth/login?error=no_session')
        }

      } catch (error) {
        console.error('❌ Callback processing error:', error)
        router.replace('/auth/login?error=callback_failed')
      }
    }

    // Small delay to ensure URL processing
    const timer = setTimeout(handleAuthCallback, 100)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Completing sign in...</h2>
          <p className="text-gray-600 mt-2">Please wait while we set up your account</p>
        </div>
      </div>
    </div>
  )
}