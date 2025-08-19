import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { RoleFormData } from '@/types'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 COMPREHENSIVE SCENARIO TESTING: Testing all dynamic form scenarios...')
    
    const supabase = await createServerClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Please log in first to run tests',
        loginUrl: 'http://localhost:3001/auth/login'
      })
    }

    const testResults: any[] = []
    let passedTests = 0
    let failedTests = 0

    // ===== TEST SCENARIO 1: MINIMAL ROLE (Only required fields) =====
    console.log('🧪 Test 1: Minimal role (only title + description)')
    try {
      const minimalRole: RoleFormData = {
        title: 'Test Minimal Role',
        description: 'This is a minimal role with only required fields for testing purposes.',
        responsibilities: '', // Optional, empty
        education_requirements: [],
        experience_requirements: [],
        skills: [], // Empty array - optional
        questions: [], // Empty array - optional
        bonus_config: {} as any, // Will be ignored
        penalty_config: {} as any // Will be ignored
      }

      const result = await testRoleCreation(supabase, minimalRole, session.user.id)
      testResults.push({ scenario: 'Minimal Role', success: true, roleId: result.roleId })
      passedTests++
      console.log('✅ Test 1 PASSED')
    } catch (error: any) {
      testResults.push({ scenario: 'Minimal Role', success: false, error: error.message })
      failedTests++
      console.log('❌ Test 1 FAILED:', error.message)
    }

    // ===== TEST SCENARIO 2: EDUCATION ONLY =====
    console.log('🧪 Test 2: Role with education requirements only')
    try {
      const educationRole: RoleFormData = {
        title: 'Test Education Role',
        description: 'Role testing education requirements functionality with dynamic toggle behavior.',
        responsibilities: 'Handle education-related tasks and requirements validation.',
        education_requirements: [{
          requirement: 'Bachelor\'s degree in Computer Science, Engineering, or related field. Strong academic background preferred.'
        }],
        experience_requirements: [],
        skills: [],
        questions: [],
        bonus_config: {} as any,
        penalty_config: {} as any
      }

      const result = await testRoleCreation(supabase, educationRole, session.user.id)
      testResults.push({ scenario: 'Education Only', success: true, roleId: result.roleId })
      passedTests++
      console.log('✅ Test 2 PASSED')
    } catch (error: any) {
      testResults.push({ scenario: 'Education Only', success: false, error: error.message })
      failedTests++
      console.log('❌ Test 2 FAILED:', error.message)
    }

    // ===== TEST SCENARIO 3: EXPERIENCE ONLY =====
    console.log('🧪 Test 3: Role with experience requirements only')
    try {
      const experienceRole: RoleFormData = {
        title: 'Test Experience Role',
        description: 'Role testing experience requirements functionality with proper dynamic handling.',
        responsibilities: 'Manage experience validation and requirements processing.',
        education_requirements: [],
        experience_requirements: [{
          requirement: '3+ years of professional software development experience. Experience with full-stack development preferred.'
        }],
        skills: [],
        questions: [],
        bonus_config: {} as any,
        penalty_config: {} as any
      }

      const result = await testRoleCreation(supabase, experienceRole, session.user.id)
      testResults.push({ scenario: 'Experience Only', success: true, roleId: result.roleId })
      passedTests++
      console.log('✅ Test 3 PASSED')
    } catch (error: any) {
      testResults.push({ scenario: 'Experience Only', success: false, error: error.message })
      failedTests++
      console.log('❌ Test 3 FAILED:', error.message)
    }

    // ===== TEST SCENARIO 4: SKILLS ONLY =====
    console.log('🧪 Test 4: Role with skills only')
    try {
      const skillsRole: RoleFormData = {
        title: 'Test Skills Role',
        description: 'Role testing dynamic skills array handling with various weights and categories.',
        responsibilities: 'Validate skills processing and weight calculations.',
        education_requirements: [],
        experience_requirements: [],
        skills: [
          {
            skill_name: 'JavaScript',
            skill_category: 'Programming Languages',
            weight: 10,
            is_required: true
          },
          {
            skill_name: 'Node.js',
            skill_category: 'Backend Technologies',
            weight: 8,
            is_required: true
          },
          {
            skill_name: 'Docker',
            skill_category: 'DevOps',
            weight: 5,
            is_required: false
          }
        ],
        questions: [],
        bonus_config: {} as any,
        penalty_config: {} as any
      }

      const result = await testRoleCreation(supabase, skillsRole, session.user.id)
      testResults.push({ scenario: 'Skills Only', success: true, roleId: result.roleId, skillsCount: 3 })
      passedTests++
      console.log('✅ Test 4 PASSED')
    } catch (error: any) {
      testResults.push({ scenario: 'Skills Only', success: false, error: error.message })
      failedTests++
      console.log('❌ Test 4 FAILED:', error.message)
    }

    // ===== TEST SCENARIO 5: QUESTIONS ONLY =====
    console.log('🧪 Test 5: Role with questions only')
    try {
      const questionsRole: RoleFormData = {
        title: 'Test Questions Role',
        description: 'Role testing dynamic questions array handling with proper categorization and weights.',
        responsibilities: '',
        education_requirements: [],
        experience_requirements: [],
        skills: [],
        questions: [
          {
            question_text: 'Describe your approach to solving complex technical problems.',
            category: 'Problem Solving',
            weight: 9
          },
          {
            question_text: 'How do you stay updated with new technologies?',
            category: 'Learning',
            weight: 6
          }
        ],
        bonus_config: {} as any,
        penalty_config: {} as any
      }

      const result = await testRoleCreation(supabase, questionsRole, session.user.id)
      testResults.push({ scenario: 'Questions Only', success: true, roleId: result.roleId, questionsCount: 2 })
      passedTests++
      console.log('✅ Test 5 PASSED')
    } catch (error: any) {
      testResults.push({ scenario: 'Questions Only', success: false, error: error.message })
      failedTests++
      console.log('❌ Test 5 FAILED:', error.message)
    }

    // ===== TEST SCENARIO 6: COMPLETE ROLE (All features enabled) =====
    console.log('🧪 Test 6: Complete role with all features')
    try {
      const completeRole: RoleFormData = {
        title: 'Test Complete Senior Full Stack Developer',
        description: 'Comprehensive role testing all dynamic features including education, experience, skills, and custom questions with proper validation and data transformation.',
        responsibilities: 'Lead development team, architect solutions, mentor junior developers, and ensure code quality standards across all projects.',
        education_requirements: [{
          requirement: 'Bachelor\'s or Master\'s degree in Computer Science, Software Engineering, or equivalent practical experience.'
        }],
        experience_requirements: [{
          requirement: '5+ years of full-stack development experience with modern web technologies and at least 2 years in a senior role.'
        }],
        skills: [
          {
            skill_name: 'React.js',
            skill_category: 'Frontend Frameworks',
            weight: 10,
            is_required: true
          },
          {
            skill_name: 'Next.js',
            skill_category: 'Frontend Frameworks',
            weight: 9,
            is_required: true
          },
          {
            skill_name: 'TypeScript',
            skill_category: 'Programming Languages',
            weight: 10,
            is_required: true
          },
          {
            skill_name: 'PostgreSQL',
            skill_category: 'Databases',
            weight: 8,
            is_required: true
          },
          {
            skill_name: 'AWS',
            skill_category: 'Cloud Platforms',
            weight: 7,
            is_required: false
          }
        ],
        questions: [
          {
            question_text: 'Describe a complex system architecture you designed and implemented.',
            category: 'System Design',
            weight: 10
          },
          {
            question_text: 'How do you approach code reviews and mentoring junior developers?',
            category: 'Leadership',
            weight: 8
          },
          {
            question_text: 'Explain your testing strategy for a full-stack application.',
            category: 'Quality Assurance',
            weight: 7
          }
        ],
        bonus_config: {} as any,
        penalty_config: {} as any
      }

      const result = await testRoleCreation(supabase, completeRole, session.user.id)
      testResults.push({ 
        scenario: 'Complete Role', 
        success: true, 
        roleId: result.roleId,
        skillsCount: 5,
        questionsCount: 3,
        complexity: 'HIGH'
      })
      passedTests++
      console.log('✅ Test 6 PASSED')
    } catch (error: any) {
      testResults.push({ scenario: 'Complete Role', success: false, error: error.message })
      failedTests++
      console.log('❌ Test 6 FAILED:', error.message)
    }

    // Clean up all test roles
    console.log('🧹 Cleaning up test roles...')
    for (const result of testResults) {
      if (result.success && result.roleId) {
        await supabase.from('role_skills').delete().eq('role_id', result.roleId)
        await supabase.from('role_questions').delete().eq('role_id', result.roleId)
        await supabase.from('roles').delete().eq('id', result.roleId)
      }
    }

    return NextResponse.json({
      success: passedTests > 0,
      summary: {
        totalTests: testResults.length,
        passedTests,
        failedTests,
        successRate: `${Math.round((passedTests / testResults.length) * 100)}%`
      },
      testResults,
      conclusion: passedTests === testResults.length 
        ? '🎉 ALL TESTS PASSED - System handles all dynamic scenarios correctly!'
        : '⚠️ Some tests failed - check individual results for details'
    })

  } catch (error: any) {
    console.error('💥 Test execution failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Test execution failed',
      details: error.message
    }, { status: 500 })
  }
}

// Helper function to test role creation
async function testRoleCreation(supabase: any, roleData: RoleFormData, userId: string) {
  // Import validation and transformation utilities
  const { validateRoleForm } = await import('@/utils/form-validation')
  const { transformRoleFormData } = await import('@/utils/role-data-transformer')

  // Validate form data
  const validation = validateRoleForm(roleData)
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
  }

  // Transform data
  const transformedData = transformRoleFormData(roleData, userId)

  // Create role
  const { data: role, error: roleError } = await supabase
    .from('roles')
    .insert(transformedData.roleData)
    .select()
    .single()

  if (roleError) {
    throw new Error(`Role creation failed: ${roleError.message}`)
  }

  // Create skills if any
  if (transformedData.skillsData.length > 0) {
    const skillsWithRoleId = transformedData.skillsData.map(skill => ({
      ...skill,
      role_id: role.id
    }))
    
    const { error: skillsError } = await supabase
      .from('role_skills')
      .insert(skillsWithRoleId)

    if (skillsError) {
      await supabase.from('roles').delete().eq('id', role.id)
      throw new Error(`Skills creation failed: ${skillsError.message}`)
    }
  }

  // Create questions if any
  if (transformedData.questionsData.length > 0) {
    const questionsWithRoleId = transformedData.questionsData.map(question => ({
      ...question,
      role_id: role.id
    }))
    
    const { error: questionsError } = await supabase
      .from('role_questions')
      .insert(questionsWithRoleId)

    if (questionsError) {
      await supabase.from('role_skills').delete().eq('role_id', role.id)
      await supabase.from('roles').delete().eq('id', role.id)
      throw new Error(`Questions creation failed: ${questionsError.message}`)
    }
  }

  return { roleId: role.id }
}