import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 AUTH DEBUG: Checking authentication state...')
    
    const supabase = await createServerClient()
    
    // Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('Session check:', {
      hasSession: !!session,
      error: sessionError?.message,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email
      } : null
    })

    // Check user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('User check:', {
      hasUser: !!user,
      error: userError?.message,
      userId: user?.id,
      userEmail: user?.email
    })

    return NextResponse.json({
      session: {
        exists: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        error: sessionError?.message
      },
      user: {
        exists: !!user,
        userId: user?.id,
        email: user?.email,
        error: userError?.message
      },
      cookies: request.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value }))
    })

  } catch (error: any) {
    console.error('💥 Auth debug failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Auth debug failed',
      details: error.message
    }, { status: 500 })
  }
}