import { NextRequest, NextResponse } from 'next/server'
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    console.log('🚨 EMERGENCY CREATE: Bypassing RLS for role creation...')
    
    // Step 1: Verify user authentication first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        details: sessionError
      })
    }

    // Step 2: Get the request data
    const body = await request.json()
    const { roleData } = body

    if (!roleData) {
      return NextResponse.json({
        success: false,
        error: 'Role data is required'
      })
    }

    console.log('👤 Authenticated user:', session.user.email)
    console.log('📝 Role data received:', roleData)

    // Step 3: Use service role to bypass RLS completely
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!serviceRoleKey) {
      console.error('❌ Service role key not configured')
      return NextResponse.json({
        success: false,
        error: 'Service configuration error'
      })
    }

    // Step 4: Create service role client
    const { createClient } = require('@supabase/supabase-js')
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Step 5: Prepare role data with validated user_id
    const roleInsertData = {
      user_id: session.user.id, // Use the authenticated user's ID
      title: roleData.title?.trim() || 'Untitled Role',
      description: roleData.description?.trim() || 'No description',
      responsibilities: roleData.responsibilities?.trim() || null,
      education_requirements: roleData.education_requirements || {
        enabled: false,
        requirement: '',
        nice_to_have: ''
      },
      experience_requirements: roleData.experience_requirements || {
        enabled: false,
        requirement: '',
        nice_to_have: '',
        minimum_years: 0
      },
      bonus_config: roleData.bonus_config || null,
      penalty_config: roleData.penalty_config || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true
    }

    console.log('🔧 Final role data for service insertion:', roleInsertData)

    // Step 6: Insert using service role (bypasses RLS)
    const { data: roleResult, error: roleError } = await serviceClient
      .from('roles')
      .insert(roleInsertData)
      .select()
      .single()

    if (roleError) {
      console.error('❌ Service role insertion failed:', roleError)
      return NextResponse.json({
        success: false,
        error: 'Role creation failed via service role',
        details: roleError
      })
    }

    console.log('✅ Role created via service role:', roleResult.id)

    // Step 7: Handle skills if provided
    let skillsResult = null
    if (roleData.skills && roleData.skills.length > 0) {
      console.log('🎯 Creating skills...')
      const skillsData = roleData.skills.map((skill: any) => ({
        role_id: roleResult.id,
        skill_name: skill.skill_name?.trim() || 'Unnamed Skill',
        skill_category: skill.skill_category?.trim() || null,
        weight: skill.weight || 1,
        is_required: skill.is_required || false,
      }))

      const { data: skills, error: skillsError } = await serviceClient
        .from('role_skills')
        .insert(skillsData)
        .select()

      if (skillsError) {
        console.error('⚠️ Skills creation failed:', skillsError)
        // Don't fail the whole operation, just log it
      } else {
        skillsResult = skills
        console.log('✅ Skills created:', skills.length)
      }
    }

    // Step 8: Handle questions if provided
    let questionsResult = null
    if (roleData.questions && roleData.questions.length > 0) {
      console.log('❓ Creating questions...')
      const questionsData = roleData.questions.map((question: any) => ({
        role_id: roleResult.id,
        question_text: question.question_text?.trim() || 'No question text',
        question_category: question.category?.trim() || null,
        weight: question.weight || 1,
      }))

      const { data: questions, error: questionsError } = await serviceClient
        .from('role_questions')
        .insert(questionsData)
        .select()

      if (questionsError) {
        console.error('⚠️ Questions creation failed:', questionsError)
        // Don't fail the whole operation, just log it
      } else {
        questionsResult = questions
        console.log('✅ Questions created:', questions.length)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Role created successfully using service role (RLS bypass)',
      role: roleResult,
      skills: skillsResult,
      questions: questionsResult,
      method: 'SERVICE_ROLE_BYPASS',
      userId: session.user.id,
      userEmail: session.user.email
    })

  } catch (error: any) {
    console.error('💥 Emergency create failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Emergency creation failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}