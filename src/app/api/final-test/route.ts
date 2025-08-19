import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-browser'

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 FINAL TEST: All possible fixes applied')
    
    // Get session with all enhancements
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({
        success: false,
        error: 'Authentication failed',
        details: sessionError
      })
    }
    
    console.log('✅ Session validated:', {
      userId: session.user.id,
      email: session.user.email,
      tokenValid: !!session.access_token,
      expiresAt: new Date(session.expires_at! * 1000).toISOString()
    })
    
    // Test with minimal role data
    const minimalRole = {
      user_id: session.user.id,
      title: 'FINAL FIX TEST',
      description: 'Testing all applied fixes for RLS auth issue'
    }
    
    console.log('📝 Testing role creation with data:', minimalRole)
    
    // Try both methods
    let result: any
    let method = ''
    
    try {
      // Method 1: Standard Supabase client
      console.log('🧪 Method 1: Standard Supabase client...')
      result = await supabase
        .from('roles')
        .insert(minimalRole)
        .select()
        .single()
      
      if (result.error) throw result.error
      method = 'Standard Supabase Client'
      
    } catch (error1) {
      console.log('❌ Method 1 failed:', error1)
      
      try {
        // Method 2: Manual fetch with explicit headers
        console.log('🧪 Method 2: Manual fetch with auth headers...')
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/roles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(minimalRole)
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw errorData
        }
        
        const data = await response.json()
        result = { data: Array.isArray(data) ? data[0] : data, error: null }
        method = 'Manual Fetch with Auth Headers'
        
      } catch (error2) {
        console.error('❌ Method 2 also failed:', error2)
        return NextResponse.json({
          success: false,
          error: 'Both methods failed',
          method1Error: error1,
          method2Error: error2,
          sessionInfo: {
            userId: session.user.id,
            tokenPresent: !!session.access_token
          }
        })
      }
    }
    
    console.log('🎉 SUCCESS! Role created with:', method)
    
    return NextResponse.json({
      success: true,
      message: `Role creation successful using: ${method}`,
      roleId: result.data.id,
      roleTitle: result.data.title,
      method: method,
      sessionUserId: session.user.id
    })
    
  } catch (error: any) {
    console.error('💥 Final test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Final test execution failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}