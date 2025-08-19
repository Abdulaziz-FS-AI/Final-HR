'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-browser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugPage() {
  const [envCheck, setEnvCheck] = useState<any>({})
  const [connectionTest, setConnectionTest] = useState<any>({})
  const [apiTest, setApiTest] = useState<any>({})
  
  useEffect(() => {
    // Check environment variables
    const envStatus = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }
    setEnvCheck(envStatus)
    
    // Test Supabase connection
    async function testConnection() {
      try {
        const { data: authUser } = await supabase.auth.getUser()
        console.log('Auth user:', authUser)
        
        const { data, error } = await supabase
          .from('users')
          .select('id, email, first_name')
          .limit(5)
          
        setConnectionTest({
          success: !error,
          error: error?.message || null,
          data: data || [],
          authUser: authUser.user,
        })
      } catch (err: any) {
        setConnectionTest({
          success: false,
          error: err.message,
          data: [],
          authUser: null,
        })
      }
    }
    
    testConnection()
    
    // Test API endpoint
    async function testAPI() {
      try {
        const response = await fetch('/api/debug-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        const result = await response.json()
        setApiTest(result)
      } catch (err: any) {
        setApiTest({ error: err.message })
      }
    }
    
    testAPI()
  }, [])
  
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Debug Information</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>Supabase URL: {envCheck.hasUrl ? '✅ Present' : '❌ Missing'}</div>
            <div>Supabase Key: {envCheck.hasKey ? '✅ Present' : '❌ Missing'}</div>
            {envCheck.supabaseUrl && (
              <div className="text-xs text-gray-600">URL: {envCheck.supabaseUrl}</div>
            )}
            {envCheck.supabaseKey && (
              <div className="text-xs text-gray-600">Key: {envCheck.supabaseKey?.substring(0, 50)}...</div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Connection Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>Connection: {connectionTest.success ? '✅ Success' : '❌ Failed'}</div>
            {connectionTest.error && (
              <div className="text-red-600">Error: {connectionTest.error}</div>
            )}
            <div>Auth User: {connectionTest.authUser ? '✅ Signed in' : '❌ Not signed in'}</div>
            <div>Users table: {connectionTest.data?.length > 0 ? `✅ ${connectionTest.data.length} records` : '❌ No data'}</div>
            
            {connectionTest.data?.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer">View Data</summary>
                <pre className="mt-2 p-2 bg-gray-100 text-xs overflow-auto">
                  {JSON.stringify(connectionTest.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>API Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>Status: {apiTest.success ? '✅ Success' : '❌ Failed'}</div>
            {apiTest.error && (
              <div className="text-red-600">Error: {apiTest.error}</div>
            )}
            {apiTest.debug && (
              <div className="space-y-1">
                <div>Auth Header: {apiTest.debug.hasAuthHeader ? '✅ Present' : '❌ Missing'}</div>
                <div>API Key Header: {apiTest.debug.hasApiKeyHeader ? '✅ Present' : '❌ Missing'}</div>
                <div>User: {apiTest.debug.user ? '✅ Authenticated' : '❌ Not authenticated'}</div>
                <div>DB Query: {apiTest.debug.dbError ? '❌ Failed' : '✅ Success'}</div>
                {apiTest.debug.authError && (
                  <div className="text-red-600">Auth Error: {apiTest.debug.authError}</div>
                )}
                {apiTest.debug.dbError && (
                  <div className="text-red-600">DB Error: {apiTest.debug.dbError}</div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}