import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing role creation with fixed browser client...')
    
    // Create a fresh supabase client (using the fixed version)
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Get auth header from request
    const authHeader = request.headers.get('authorization')
    console.log('Auth header present:', !!authHeader)
    
    // Test session
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') || ''
    )
    
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication failed',
        details: userError?.message
      })
    }
    
    console.log('✅ User authenticated:', user.id)
    
    // Test role creation with minimal data
    const testRoleData = {
      user_id: user.id,
      title: 'TEST: Full Stack Developer',
      description: 'Test role created to verify the complete pipeline works perfectly',
      responsibilities: 'Test responsibilities',
      education_requirements: {
        enabled: true,
        requirement: 'Bachelor degree in Computer Science',
        nice_to_have: 'Master degree preferred'
      },
      experience_requirements: {
        enabled: true,
        requirement: '3+ years experience',
        nice_to_have: 'Startup experience',
        minimum_years: 3
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
    
    console.log('🚀 Creating role...')
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .insert(testRoleData)
      .select()
      .single()
    
    if (roleError) {
      console.error('❌ Role creation failed:', roleError)
      return NextResponse.json({
        success: false,
        error: 'Role creation failed',
        details: roleError
      })
    }
    
    console.log('✅ Role created successfully:', role.id)
    
    // Test skills creation
    const testSkills = [
      {
        role_id: role.id,
        skill_name: 'React.js',
        skill_category: 'Frontend',
        weight: 8,
        is_required: true
      },
      {
        role_id: role.id,
        skill_name: 'Node.js',
        skill_category: 'Backend',
        weight: 7,
        is_required: false
      }
    ]
    
    console.log('🚀 Creating skills...')
    const { data: skills, error: skillsError } = await supabase
      .from('role_skills')
      .insert(testSkills)
      .select()
    
    if (skillsError) {
      console.error('❌ Skills creation failed:', skillsError)
      // Cleanup role
      await supabase.from('roles').delete().eq('id', role.id)
      return NextResponse.json({
        success: false,
        error: 'Skills creation failed',
        details: skillsError
      })
    }
    
    console.log('✅ Skills created successfully:', skills.length)
    
    // Test questions creation  
    const testQuestions = [
      {
        role_id: role.id,
        question_text: 'Has experience with React hooks?',
        question_category: 'Technical',
        weight: 6
      },
      {
        role_id: role.id,
        question_text: 'Can work in a fast-paced startup environment?',
        question_category: 'Cultural Fit',
        weight: 5
      }
    ]
    
    console.log('🚀 Creating questions...')
    const { data: questions, error: questionsError } = await supabase
      .from('role_questions')
      .insert(testQuestions)
      .select()
    
    if (questionsError) {
      console.error('❌ Questions creation failed:', questionsError)
      // Cleanup role and skills
      await supabase.from('role_skills').delete().eq('role_id', role.id)
      await supabase.from('roles').delete().eq('id', role.id)
      return NextResponse.json({
        success: false,
        error: 'Questions creation failed',
        details: questionsError
      })
    }
    
    console.log('✅ Questions created successfully:', questions.length)
    
    // Verify complete role with relations
    const { data: completeRole, error: fetchError } = await supabase
      .from('roles')
      .select(`
        *,
        skills:role_skills(*),
        questions:role_questions(*)
      `)
      .eq('id', role.id)
      .single()
    
    if (fetchError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch complete role',
        details: fetchError
      })
    }
    
    console.log('🎉 COMPLETE SUCCESS! Role creation pipeline working perfectly')
    
    return NextResponse.json({
      success: true,
      message: '🎉 Role creation pipeline works perfectly!',
      data: {
        role: completeRole,
        skillsCount: skills.length,
        questionsCount: questions.length,
        pipeline_status: 'FULLY_FUNCTIONAL'
      }
    })
    
  } catch (error: any) {
    console.error('💥 Test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Test execution failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}