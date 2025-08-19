'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-browser'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AuthDebug() {
  const { user } = useAuth()
  const [supabaseUser, setSupabaseUser] = useState<any>(null)
  const [dbProfile, setDbProfile] = useState<any>(null)

  useEffect(() => {
    const getDebugInfo = async () => {
      // Get Supabase auth user
      const { data: { user: sbUser } } = await supabase.auth.getUser()
      setSupabaseUser(sbUser)

      // Get database profile if user exists
      if (sbUser) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', sbUser.id)
          .single()
        setDbProfile(profile)
      }
    }
    getDebugInfo()
  }, [])

  if (!user && !supabaseUser) {
    return (
      <Card className="max-w-4xl mx-auto mt-8 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">🔍 Auth Debug - No User</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-700">Please sign in to see debug information</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-6xl mx-auto mt-8 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-800">🔍 Auth Debug Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Auth Context User */}
        <div>
          <h3 className="font-semibold text-blue-800 mb-2">Auth Context User (what dashboard sees):</h3>
          <pre className="bg-white p-3 rounded text-xs overflow-auto border">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        {/* Supabase Auth User */}
        <div>
          <h3 className="font-semibold text-blue-800 mb-2">Supabase Auth User (raw metadata):</h3>
          <pre className="bg-white p-3 rounded text-xs overflow-auto border">
            {JSON.stringify(supabaseUser ? {
              id: supabaseUser.id,
              email: supabaseUser.email,
              user_metadata: supabaseUser.user_metadata,
              app_metadata: supabaseUser.app_metadata
            } : null, null, 2)}
          </pre>
        </div>

        {/* Database Profile */}
        <div>
          <h3 className="font-semibold text-blue-800 mb-2">Database Profile (users table):</h3>
          <pre className="bg-white p-3 rounded text-xs overflow-auto border">
            {JSON.stringify(dbProfile, null, 2)}
          </pre>
        </div>

        {/* Analysis */}
        <div className="p-4 bg-yellow-100 border border-yellow-300 rounded">
          <h4 className="font-semibold text-yellow-800 mb-2">Analysis:</h4>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>✅ Auth Context User: {user ? 'Present' : 'Missing'}</li>
            <li>✅ Supabase Auth: {supabaseUser ? 'Present' : 'Missing'}</li>
            <li>✅ Database Profile: {dbProfile ? 'Present' : 'Missing'}</li>
            {supabaseUser && (
              <>
                <li>📧 Email: {supabaseUser.email}</li>
                <li>👤 Display Name: {supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || 'Not provided'}</li>
                <li>🏷️ First Name Field: {supabaseUser.user_metadata?.given_name || supabaseUser.user_metadata?.first_name || 'Not found'}</li>
                <li>🏷️ Last Name Field: {supabaseUser.user_metadata?.family_name || supabaseUser.user_metadata?.last_name || 'Not found'}</li>
              </>
            )}
          </ul>
        </div>

      </CardContent>
    </Card>
  )
}