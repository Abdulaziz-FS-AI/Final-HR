import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-browser'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 DEEP DEBUG: Starting comprehensive auth analysis...')
    
    // Test 1: Browser client session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('📊 Session Analysis:', {
      hasSession: !!session,
      sessionError: sessionError,
      userId: session?.user?.id,
      email: session?.user?.email,
      tokenLength: session?.access_token?.length,
      tokenExpiry: session?.expires_at ? new Date(session.expires_at * 1000) : null,
      role: session?.user?.role,
      appMetadata: session?.user?.app_metadata,
      userMetadata: session?.user?.user_metadata
    })

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No session found',
        details: sessionError
      })
    }

    // Test 2: Token validation by creating a fresh client with the session token
    const testClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          }
        }
      }
    )

    // Test 3: Direct SQL query to test auth.uid() with our token
    console.log('🧪 Testing auth.uid() with current token...')
    
    const authTestResult = await testClient
      .rpc('test_auth_uid')
      .single()

    console.log('🔑 Auth test result:', authTestResult)

    // Test 4: Try role insertion with different approaches
    const testRole = {
      user_id: session.user.id,
      title: 'DEEP DEBUG TEST',
      description: 'Testing deepest auth issues'
    }

    console.log('📝 Testing role insertion with enhanced debugging...')

    // Method A: Standard client
    let methodAResult: any
    try {
      methodAResult = await supabase
        .from('roles')
        .insert(testRole)
        .select()
        .single()
      console.log('✅ Method A (standard) succeeded:', methodAResult.data?.id)
    } catch (errorA) {
      console.log('❌ Method A failed:', errorA)
      methodAResult = { error: errorA }
    }

    // Method B: Fresh client with explicit auth
    let methodBResult: any
    try {
      methodBResult = await testClient
        .from('roles')
        .insert(testRole)
        .select()
        .single()
      console.log('✅ Method B (fresh client) succeeded:', methodBResult.data?.id)
    } catch (errorB) {
      console.log('❌ Method B failed:', errorB)
      methodBResult = { error: errorB }
    }

    // Method C: Raw fetch with maximum explicit headers
    let methodCResult: any
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Prefer': 'return=representation',
          'X-Client-Info': 'deep-debug-test',
          'User-Agent': 'deep-debug-test-agent'
        },
        body: JSON.stringify(testRole)
      })

      if (response.ok) {
        methodCResult = await response.json()
        console.log('✅ Method C (raw fetch) succeeded:', methodCResult[0]?.id)
      } else {
        const errorData = await response.json()
        console.log('❌ Method C failed with status:', response.status, errorData)
        methodCResult = { error: errorData, status: response.status }
      }
    } catch (errorC) {
      console.log('❌ Method C fetch failed:', errorC)
      methodCResult = { error: (errorC as any).message }
    }

    // Clean up test data
    if (methodAResult.data?.id) {
      await supabase.from('roles').delete().eq('id', methodAResult.data.id)
    }
    if (methodBResult.data?.id) {
      await testClient.from('roles').delete().eq('id', methodBResult.data.id)
    }
    if (methodCResult[0]?.id) {
      await supabase.from('roles').delete().eq('id', methodCResult[0].id)
    }

    return NextResponse.json({
      success: true,
      deepAnalysis: {
        sessionValid: !!session,
        userId: session.user.id,
        tokenValid: !!session.access_token,
        authTestResult: authTestResult,
        methods: {
          standardClient: {
            success: !methodAResult.error,
            error: methodAResult.error?.message || null,
            details: methodAResult.error
          },
          freshClient: {
            success: !methodBResult.error,
            error: methodBResult.error?.message || null,
            details: methodBResult.error
          },
          rawFetch: {
            success: !methodCResult.error,
            status: methodCResult.status || 'success',
            error: methodCResult.error?.message || methodCResult.error || null,
            details: methodCResult.error
          }
        }
      }
    })

  } catch (error: any) {
    console.error('💥 Deep debug failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Deep debug execution failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}