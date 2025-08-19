import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing FIXED role creation pipeline...')
    
    // Create a fresh supabase client
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
    
    // Test role creation with CORRECT structure (no education/experience in main table)
    const testRoleData = {
      user_id: user.id,
      title: 'TEST: Senior Full Stack Developer',
      description: 'Test role to verify the fixed pipeline works correctly',
      responsibilities: 'Lead development, mentor team, architecture decisions',
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
      // NOTE: NO education_requirements or experience_requirements here!
    }
    
    console.log('🚀 Creating role in main table...')
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
    
    // Test education requirements in SEPARATE table
    const testEducation = [
      {
        role_id: role.id,
        requirement: 'Bachelor degree in Computer Science or related field',
        is_required: true,
        display_order: 1
      },
      {
        role_id: role.id,
        requirement: 'Master degree preferred',
        is_required: false,
        display_order: 2
      }
    ]
    
    console.log('🎓 Creating education requirements in separate table...')
    const { data: education, error: educationError } = await supabase
      .from('role_education_requirements')
      .insert(testEducation)
      .select()
    
    if (educationError) {
      console.error('❌ Education requirements creation failed:', educationError)
      // Cleanup role
      await supabase.from('roles').delete().eq('id', role.id)
      return NextResponse.json({
        success: false,
        error: 'Education requirements creation failed',
        details: educationError
      })
    }
    
    console.log('✅ Education requirements created:', education.length)
    
    // Test experience requirements in SEPARATE table
    const testExperience = [
      {
        role_id: role.id,
        requirement: '5+ years of full stack development experience',
        minimum_years: 5,
        is_required: true,
        display_order: 1
      },
      {
        role_id: role.id,
        requirement: 'Experience with React and Node.js',
        minimum_years: 3,
        is_required: true,
        display_order: 2
      }
    ]
    
    console.log('💼 Creating experience requirements in separate table...')
    const { data: experience, error: experienceError } = await supabase
      .from('role_experience_requirements')
      .insert(testExperience)
      .select()
    
    if (experienceError) {
      console.error('❌ Experience requirements creation failed:', experienceError)
      // Cleanup
      await supabase.from('role_education_requirements').delete().eq('role_id', role.id)
      await supabase.from('roles').delete().eq('id', role.id)
      return NextResponse.json({
        success: false,
        error: 'Experience requirements creation failed',
        details: experienceError
      })
    }
    
    console.log('✅ Experience requirements created:', experience.length)
    
    // Test skills creation
    const testSkills = [
      {
        role_id: role.id,
        skill_name: 'React.js',
        skill_category: 'Frontend',
        weight: 10,
        is_required: true
      },
      {
        role_id: role.id,
        skill_name: 'Node.js',
        skill_category: 'Backend',
        weight: 9,
        is_required: true
      },
      {
        role_id: role.id,
        skill_name: 'TypeScript',
        skill_category: 'Languages',
        weight: 8,
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
      // Cleanup
      await supabase.from('role_experience_requirements').delete().eq('role_id', role.id)
      await supabase.from('role_education_requirements').delete().eq('role_id', role.id)
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
        question_text: 'Has led a development team of 5+ people?',
        question_category: 'Leadership',
        weight: 7
      },
      {
        role_id: role.id,
        question_text: 'Experience with microservices architecture?',
        question_category: 'Technical',
        weight: 8
      }
    ]
    
    console.log('🚀 Creating questions...')
    const { data: questions, error: questionsError } = await supabase
      .from('role_questions')
      .insert(testQuestions)
      .select()
    
    if (questionsError) {
      console.error('❌ Questions creation failed:', questionsError)
      // Cleanup
      await supabase.from('role_skills').delete().eq('role_id', role.id)
      await supabase.from('role_experience_requirements').delete().eq('role_id', role.id)
      await supabase.from('role_education_requirements').delete().eq('role_id', role.id)
      await supabase.from('roles').delete().eq('id', role.id)
      return NextResponse.json({
        success: false,
        error: 'Questions creation failed',
        details: questionsError
      })
    }
    
    console.log('✅ Questions created successfully:', questions.length)
    
    // Verify complete role with all relations
    const { data: completeRole, error: fetchError } = await supabase
      .from('roles')
      .select(`
        *,
        skills:role_skills(*),
        questions:role_questions(*),
        education_requirements:role_education_requirements(*),
        experience_requirements:role_experience_requirements(*)
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
    
    console.log('🎉 COMPLETE SUCCESS! Fixed role creation pipeline working perfectly')
    
    return NextResponse.json({
      success: true,
      message: '🎉 Role creation pipeline FIXED and working!',
      data: {
        role: completeRole,
        stats: {
          educationRequirements: education.length,
          experienceRequirements: experience.length,
          skills: skills.length,
          questions: questions.length
        },
        pipeline_status: 'FULLY_FUNCTIONAL_WITH_FIXES'
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