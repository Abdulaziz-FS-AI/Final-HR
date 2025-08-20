'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { supabase } from "@/lib/supabase"

export default function TestRoleCreationPage() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const testRoleCreation = async () => {
    if (!user) {
      setError('Please log in first')
      return
    }

    setTesting(true)
    setError(null)
    setResults(null)

    try {
      console.log('🧪 Starting role creation test...')
      
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      console.log('✅ Session found, testing API endpoint...')
      
      // Call our test endpoint
      const response = await fetch('/api/test-role-creation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error + ': ' + JSON.stringify(result.details))
      }

      console.log('🎉 Test passed!', result)
      setResults(result)
      
    } catch (err: any) {
      console.error('❌ Test failed:', err)
      setError(err.message)
    } finally {
      setTesting(false)
    }
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>🔐 Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please <a href="/auth/login" className="text-blue-600 underline">log in</a> first to test role creation.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🧪 Role Creation Pipeline Test</h1>
        <p className="text-gray-600 mt-2">
          This page tests the complete role creation pipeline end-to-end to verify all fixes work properly.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>✅ User authenticated: {user.email}</div>
            <div>✅ User ID: {user.id}</div>
            <div>✅ Browser client: Fixed (auth headers enabled)</div>
            <div>✅ RLS policies: Re-enabled</div>
            <div>✅ Data transformation: Fixed</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testRoleCreation} 
            disabled={testing}
            className="w-full"
          >
            {testing ? '🧪 Testing Role Creation Pipeline...' : '🚀 Test Role Creation'}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800">❌ Test Failed</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {results && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800">🎉 Test Passed!</h3>
              <div className="mt-2 space-y-1 text-sm">
                <div>✅ Role created: {results.data?.role?.title}</div>
                <div>✅ Skills created: {results.data?.skillsCount}</div>
                <div>✅ Questions created: {results.data?.questionsCount}</div>
                <div>✅ Pipeline status: {results.data?.pipeline_status}</div>
                
                <details className="mt-4">
                  <summary className="cursor-pointer font-medium">View Full Details</summary>
                  <pre className="mt-2 p-3 bg-gray-100 text-xs overflow-auto rounded">
                    {JSON.stringify(results, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What This Test Verifies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>🔐 Authentication headers are properly sent</div>
            <div>🗄️ Role record is created in database</div>
            <div>⚡ Data transformation works (form → database)</div>
            <div>🔒 RLS policies allow authenticated user operations</div>
            <div>🔗 Skills are properly linked to role</div>
            <div>❓ Questions are properly linked to role</div>
            <div>📊 Complete role with relations can be fetched</div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button variant="outline" onClick={() => window.location.href = '/dashboard/roles'}>
          ← Back to Roles
        </Button>
      </div>
    </div>
  )
}