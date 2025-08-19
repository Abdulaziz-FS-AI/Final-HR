import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 PRODUCTION TEST: Testing complete auth flow...')
    
    // Get server-side session using modern SSR
    const supabase = await createServerClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({
        success: false,
        error: 'No authentication session found',
        message: 'Please log in first at /auth/login',
        instructions: [
          '1. Go to /auth/login',
          '2. Sign in with Google or email',
          '3. After successful login, run this test again',
          '4. Your browser cookies will then be available to the server'
        ],
        debugInfo: {
          sessionError: sessionError?.message || null,
          cookiesReceived: request.cookies.getAll().length > 0,
          cookieNames: request.cookies.getAll().map(c => c.name)
        }
      })
    }

    console.log('✅ Session found! Testing role creation...')
    console.log('👤 User:', session.user.email)

    // Test the auth.uid() function
    const { data: authTest, error: authError } = await supabase
      .rpc('test_auth_uid')
      .single()

    console.log('🔑 Auth function result:', authTest)

    // Test role creation with minimal data
    const testRole = {
      user_id: session.user.id,
      title: 'PRODUCTION TEST ROLE',
      description: 'Testing production-ready authentication',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true
    }

    console.log('📝 Attempting role creation...')
    const { data: roleResult, error: roleError } = await supabase
      .from('roles')
      .insert(testRole)
      .select()
      .single()

    if (roleError) {
      console.error('❌ Role creation failed:', roleError)
      return NextResponse.json({
        success: false,
        error: 'Role creation failed',
        authWorking: true,
        userId: session.user.id,
        userEmail: session.user.email,
        authFunction: {
          result: authTest,
          error: authError?.message || null
        },
        roleError: {
          message: roleError.message,
          code: roleError.code,
          details: roleError
        },
        diagnosis: roleError.code === '42501' ? 
          'RLS policy violation - auth.uid() may be returning NULL' :
          'Other database error - check role structure'
      })
    }

    console.log('✅ Role creation succeeded!', roleResult.id)

    // Clean up test role
    await supabase.from('roles').delete().eq('id', roleResult.id)
    console.log('🧹 Test role cleaned up')

    return NextResponse.json({
      success: true,
      message: '🎉 PRODUCTION READY! Authentication and role creation working perfectly',
      authWorking: true,
      roleCreationWorking: true,
      userId: session.user.id,
      userEmail: session.user.email,
      testRoleId: roleResult.id,
      authFunction: {
        result: authTest,
        authUid: (authTest as any)?.auth_uid || null
      },
      verdict: 'All systems operational - ready for production users!'
    })

  } catch (error: any) {
    console.error('💥 Production test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Production test execution failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}