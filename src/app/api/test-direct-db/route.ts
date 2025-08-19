import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 DIRECT DB TEST: Testing database operations with service role...')
    
    // Use service role key for direct database access (bypass RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Test data that matches the exact structure from the logs
    const testRoleData = {
      user_id: '12345678-1234-1234-1234-123456789012', // Fake UUID for testing
      title: 'DIRECT DB TEST ROLE',
      description: 'Testing direct database insertion to verify DB operations work independently of auth',
      responsibilities: 'Test responsibilities for direct database testing',
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

    console.log('📝 Attempting direct database insertion...')

    // Test role insertion
    const { data: roleResult, error: roleError } = await supabase
      .from('roles')
      .insert(testRoleData)
      .select()
      .single()

    if (roleError) {
      console.error('❌ Direct DB insertion failed:', roleError)
      return NextResponse.json({
        success: false,
        error: 'Direct database insertion failed',
        details: roleError,
        testData: testRoleData
      })
    }

    console.log('✅ Role inserted directly:', roleResult.id)

    // Test skill insertion
    const testSkill = {
      role_id: roleResult.id,
      skill_name: 'Direct DB Test Skill',
      skill_category: 'Testing',
      weight: 8,
      is_required: true
    }

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
        details: skillError
      })
    }

    console.log('✅ Skill inserted directly:', skillResult.id)

    // Test question insertion
    const testQuestion = {
      role_id: roleResult.id,
      question_text: 'How would you approach direct database testing?',
      category: 'Testing',
      weight: 7
    }

    const { data: questionResult, error: questionError } = await supabase
      .from('role_questions')
      .insert(testQuestion)
      .select()
      .single()

    if (questionError) {
      console.error('❌ Question insertion failed:', questionError)
      // Cleanup
      await supabase.from('role_skills').delete().eq('id', skillResult.id)
      await supabase.from('roles').delete().eq('id', roleResult.id)
      return NextResponse.json({
        success: false,
        error: 'Question insertion failed',
        details: questionError
      })
    }

    console.log('✅ Question inserted directly:', questionResult.id)

    // Cleanup test data
    await supabase.from('role_questions').delete().eq('id', questionResult.id)
    await supabase.from('role_skills').delete().eq('id', skillResult.id)
    await supabase.from('roles').delete().eq('id', roleResult.id)
    console.log('🧹 Test data cleaned up')

    return NextResponse.json({
      success: true,
      message: 'Direct database operations working perfectly',
      results: {
        roleCreated: roleResult.id,
        skillCreated: skillResult.id,
        questionCreated: questionResult.id,
        cleanup: 'COMPLETED'
      },
      conclusion: 'Database operations work fine - issue is with authentication/session handling'
    })

  } catch (error: any) {
    console.error('💥 Direct DB test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Direct database test failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}