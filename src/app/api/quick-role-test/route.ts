import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 QUICK ROLE TEST: Testing with real user session...')
    
    const supabase = await createServerClient()
    
    // Get current session/user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'You need to be logged in',
        message: 'Please log in at http://localhost:3001/auth/login first',
        sessionError: sessionError?.message
      })
    }

    console.log('✅ User found:', session.user.email)

    // Create a simple test role with minimal data
    const simpleRoleData = {
      user_id: session.user.id,
      title: 'Quick Test Role',
      description: 'Simple test role to verify database insertion works',
      responsibilities: null,
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
        enabled: false,
        items: []
      },
      penalty_config: {
        enabled: false,
        items: []
      },
      is_active: true
    }

    console.log('📝 Creating role with real user ID:', session.user.id)

    // Insert the role
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .insert(simpleRoleData)
      .select()
      .single()

    if (roleError) {
      console.error('❌ Role creation failed:', roleError)
      return NextResponse.json({
        success: false,
        error: 'Role creation failed',
        details: roleError,
        userData: { id: session.user.id, email: session.user.email }
      })
    }

    console.log('🎉 SUCCESS! Role created:', role.id)

    // Add one simple skill
    const { data: skill, error: skillError } = await supabase
      .from('role_skills')
      .insert({
        role_id: role.id,
        skill_name: 'Test Skill',
        skill_category: 'Testing',
        weight: 5,
        is_required: true
      })
      .select()
      .single()

    if (skillError) {
      console.error('⚠️ Skill creation failed, but role was created:', skillError)
    } else {
      console.log('✅ Skill also created:', skill.id)
    }

    return NextResponse.json({
      success: true,
      message: '🎉 ROLE CREATION WORKS!',
      role: {
        id: role.id,
        title: role.title,
        created: role.created_at
      },
      skill: skill ? { id: skill.id, name: skill.skill_name } : null,
      user: {
        id: session.user.id,
        email: session.user.email
      }
    })

  } catch (error: any) {
    console.error('💥 Test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Test execution failed',
      details: error.message
    }, { status: 500 })
  }
}