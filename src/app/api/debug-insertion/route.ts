import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Testing database insertion step by step...')
    
    const supabase = await createServerClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No session found',
        step: 'authentication'
      })
    }

    console.log('✅ Session found:', session.user.email)

    // Test the exact data structure that would be inserted
    const testRoleData = {
      user_id: session.user.id,
      title: 'DEBUG TEST ROLE',
      description: 'Testing database insertion with exact data structure from logs',
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true
    }

    console.log('📝 Attempting to insert role data:', testRoleData)

    // Test database insertion
    const { data: roleResult, error: roleError } = await supabase
      .from('roles')
      .insert(testRoleData)
      .select()
      .single()

    if (roleError) {
      console.error('❌ Database insertion failed:', roleError)
      return NextResponse.json({
        success: false,
        error: 'Database insertion failed',
        step: 'role_insertion',
        details: roleError,
        testData: testRoleData
      })
    }

    console.log('✅ Role inserted successfully:', roleResult.id)

    // Test skills insertion (with 1 skill like in the logs)
    const testSkill = {
      role_id: roleResult.id,
      skill_name: 'Test Skill',
      skill_category: 'Technical',
      weight: 5,
      is_required: true
    }

    console.log('🎯 Testing skill insertion...')
    const { data: skillResult, error: skillError } = await supabase
      .from('role_skills')
      .insert(testSkill)
      .select()
      .single()

    if (skillError) {
      console.error('❌ Skill insertion failed:', skillError)
      // Cleanup role
      await supabase.from('roles').delete().eq('id', roleResult.id)
      return NextResponse.json({
        success: false,
        error: 'Skill insertion failed',
        step: 'skill_insertion',
        details: skillError,
        testData: testSkill
      })
    }

    console.log('✅ Skill inserted successfully:', skillResult.id)

    // Cleanup
    await supabase.from('role_skills').delete().eq('id', skillResult.id)
    await supabase.from('roles').delete().eq('id', roleResult.id)
    console.log('🧹 Test data cleaned up')

    return NextResponse.json({
      success: true,
      message: 'All database operations working correctly',
      steps: {
        authentication: 'PASSED',
        role_insertion: 'PASSED',
        skill_insertion: 'PASSED',
        cleanup: 'PASSED'
      },
      userId: session.user.id,
      userEmail: session.user.email
    })

  } catch (error: any) {
    console.error('💥 Debug test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Debug test execution failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}