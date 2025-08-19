import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 REAL CREATION TEST: Mimicking frontend role creation...')
    
    const supabase = await createServerClient()
    
    // Check session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('Session check:', {
      hasSession: !!session,
      error: sessionError?.message,
      userId: session?.user?.id
    })

    if (!session) {
      return NextResponse.json({
        success: false,
        step: 'authentication',
        error: 'No session found - user needs to be logged in',
        details: {
          sessionError: sessionError?.message,
          solution: 'User must log in through the browser first'
        }
      })
    }

    // Import the actual validation and transformation functions
    const { validateRoleForm } = await import('@/utils/form-validation')
    const { transformRoleFormData } = await import('@/utils/role-data-transformer')

    // Test with realistic form data
    const testFormData = {
      title: 'Frontend Developer',
      description: 'We are looking for a skilled Frontend Developer to join our team and help build amazing user interfaces.',
      responsibilities: 'Develop responsive web applications, collaborate with design team, optimize performance.',
      education_requirements: [{
        requirement: 'Bachelor\'s degree in Computer Science or related field'
      }],
      experience_requirements: [{
        requirement: '2+ years of frontend development experience'
      }],
      skills: [
        {
          skill_name: 'React',
          skill_category: 'Frontend Frameworks',
          weight: 9,
          is_required: true
        },
        {
          skill_name: 'TypeScript',
          skill_category: 'Programming Languages',
          weight: 8,
          is_required: true
        }
      ],
      questions: [
        {
          question_text: 'Describe your experience with React and modern frontend development.',
          category: 'Technical',
          weight: 8
        }
      ],
      bonus_config: {} as any,
      penalty_config: {} as any
    }

    console.log('📝 Validating form data...')
    const validation = validateRoleForm(testFormData)
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        step: 'validation',
        error: 'Form validation failed',
        details: validation.errors
      })
    }

    console.log('🔄 Transforming data...')
    const transformedData = transformRoleFormData(testFormData, session.user.id)

    console.log('💾 Creating role in database...')
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .insert(transformedData.roleData)
      .select()
      .single()

    if (roleError) {
      console.error('❌ Role creation failed:', roleError)
      return NextResponse.json({
        success: false,
        step: 'role_creation',
        error: 'Role creation failed',
        details: roleError
      })
    }

    console.log('🎯 Creating skills...')
    let skillResults: any[] = []
    if (transformedData.skillsData.length > 0) {
      const skillsWithRoleId = transformedData.skillsData.map(skill => ({
        ...skill,
        role_id: role.id
      }))
      
      const { data: skills, error: skillsError } = await supabase
        .from('role_skills')
        .insert(skillsWithRoleId)
        .select()

      if (skillsError) {
        console.error('❌ Skills creation failed:', skillsError)
        // Cleanup role
        await supabase.from('roles').delete().eq('id', role.id)
        return NextResponse.json({
          success: false,
          step: 'skills_creation',
          error: 'Skills creation failed',
          details: skillsError
        })
      }
      skillResults = skills || []
    }

    console.log('❓ Creating questions...')
    let questionResults: any[] = []
    if (transformedData.questionsData.length > 0) {
      const questionsWithRoleId = transformedData.questionsData.map(question => ({
        ...question,
        role_id: role.id
      }))
      
      const { data: questions, error: questionsError } = await supabase
        .from('role_questions')
        .insert(questionsWithRoleId)
        .select()

      if (questionsError) {
        console.error('❌ Questions creation failed:', questionsError)
        // Cleanup
        await supabase.from('role_skills').delete().eq('role_id', role.id)
        await supabase.from('roles').delete().eq('id', role.id)
        return NextResponse.json({
          success: false,
          step: 'questions_creation',
          error: 'Questions creation failed',
          details: questionsError
        })
      }
      questionResults = questions || []
    }

    console.log('🎉 SUCCESS! Complete role creation finished')

    return NextResponse.json({
      success: true,
      message: '🎉 ROLE CREATION WORKS PERFECTLY!',
      role: {
        id: role.id,
        title: role.title,
        created_at: role.created_at
      },
      skills: skillResults.map(s => ({ id: s.id, name: s.skill_name })),
      questions: questionResults.map(q => ({ id: q.id, text: q.question_text })),
      user: {
        id: session.user.id,
        email: session.user.email
      }
    })

  } catch (error: any) {
    console.error('💥 Real creation test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Test execution failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}