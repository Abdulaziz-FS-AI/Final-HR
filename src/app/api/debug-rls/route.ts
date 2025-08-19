import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-browser'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debugging RLS auth issue...')
    
    // Get current session 
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      return NextResponse.json({
        success: false,
        error: 'Session error',
        details: sessionError
      })
    }
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No session found'
      })
    }
    
    console.log('✅ Session found:', {
      userId: session.user.id,
      email: session.user.email,
      tokenPreview: session.access_token.substring(0, 50) + '...'
    })
    
    // Try to insert a test role using the authenticated client
    console.log('🧪 Testing role insertion with current session...')
    
    const testRole = {
      user_id: session.user.id,
      title: 'DEBUG: RLS Test Role',
      description: 'Testing RLS authentication context',
      responsibilities: 'Debug RLS issues',
      education_requirements: {
        enabled: false,
        requirement: '',
        nice_to_have: ''
      },
      experience_requirements: {
        enabled: false, 
        requirement: '',
        nice_to_have: '',
        minimum_years: 0
      },
      bonus_config: {
        preferredEducation: { enabled: false },
        preferredCompanies: { enabled: false },
        relatedProjects: { enabled: false },
        valuableCertifications: { enabled: false }
      },
      penalty_config: {
        jobStabilityCheck: { enabled: false },
        employmentGapCheck: { enabled: false }
      }
    }
    
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .insert(testRole)
      .select()
      .single()
    
    if (roleError) {
      console.error('❌ Role insertion failed:', roleError)
      
      // Let's also try to check what auth.uid() returns in a direct query
      const { data: authCheck, error: authCheckError } = await supabase.rpc('get_current_user_id')
      
      return NextResponse.json({
        success: false,
        error: 'Role insertion failed',
        roleError,
        sessionUserId: session.user.id,
        authCheckResult: authCheck,
        authCheckError,
        possibleCause: 'auth.uid() returning NULL in RLS context'
      })
    }
    
    console.log('✅ Role inserted successfully:', role.id)
    
    return NextResponse.json({
      success: true,
      message: 'RLS working properly!',
      roleId: role.id,
      sessionUserId: session.user.id
    })
    
  } catch (error: any) {
    console.error('💥 Debug failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Debug execution failed',
      details: error.message
    }, { status: 500 })
  }
}