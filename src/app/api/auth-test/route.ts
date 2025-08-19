import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 AUTH TEST: Analyzing server-side authentication...')
    
    // Create server client that can read cookies
    const supabase = await createServerClient()
    
    // Get session from server-side
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('📊 Server Session Analysis:', {
      hasSession: !!session,
      sessionError: sessionError,
      userId: session?.user?.id,
      email: session?.user?.email,
      tokenLength: session?.access_token?.length,
      tokenExpiry: session?.expires_at ? new Date(session.expires_at * 1000) : null,
    })

    if (sessionError || !session) {
      return NextResponse.json({
        success: false,
        error: 'No valid session found on server',
        details: sessionError,
        cookies: request.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value }))
      })
    }

    // Test auth.uid() function we created
    console.log('🧪 Testing auth.uid() function...')
    const { data: authTest, error: authError } = await supabase
      .rpc('test_auth_uid')
      .single()

    console.log('🔑 Auth function result:', authTest)

    // Test actual role insertion with detailed logging
    const testRole = {
      user_id: session.user.id,
      title: 'AUTH TEST ROLE',
      description: 'Testing server-side authentication'
    }

    console.log('📝 Testing role insertion...')
    const { data: roleResult, error: roleError } = await supabase
      .from('roles')
      .insert(testRole)
      .select()
      .single()

    let insertionResult
    if (roleError) {
      console.error('❌ Role insertion failed:', roleError)
      insertionResult = {
        success: false,
        error: roleError.message,
        code: roleError.code,
        details: roleError
      }
    } else {
      console.log('✅ Role insertion succeeded:', roleResult.id)
      insertionResult = {
        success: true,
        roleId: roleResult.id,
        role: roleResult
      }
      
      // Clean up immediately
      await supabase.from('roles').delete().eq('id', roleResult.id)
      console.log('🧹 Test role cleaned up')
    }

    return NextResponse.json({
      success: true,
      sessionValid: true,
      userId: session.user.id,
      userEmail: session.user.email,
      authFunction: {
        success: !authError,
        result: authTest,
        error: authError?.message || null
      },
      roleInsertion: insertionResult,
      tokenInfo: {
        hasToken: !!session.access_token,
        tokenExpiry: new Date(session.expires_at! * 1000),
        isExpired: session.expires_at! * 1000 <= Date.now()
      }
    })

  } catch (error: any) {
    console.error('💥 Auth test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Auth test execution failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}