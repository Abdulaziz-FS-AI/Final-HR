import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 COMPREHENSIVE DATA MAPPING VERIFICATION')
    
    const supabase = await createServerClient()
    
    // Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (!session || sessionError) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        details: sessionError?.message
      })
    }

    // Import validation and transformation utilities
    const { validateRoleForm } = await import('@/utils/form-validation')
    const { transformRoleFormData } = await import('@/utils/role-data-transformer')

    // Create comprehensive test data that exercises ALL UI fields
    const comprehensiveFormData = {
      // Basic Information (UI: role-form.tsx:298-331)
      title: 'Senior Full Stack Developer - Data Mapping Test',
      description: 'This is a comprehensive test role to verify that every single UI input field maps correctly to its corresponding database column. We will test all possible scenarios including multiple education requirements, experience requirements, skills, and questions.',
      responsibilities: 'Lead development teams, architect scalable solutions, mentor junior developers, conduct code reviews, collaborate with product managers, ensure security best practices.',

      // Education Requirements Array (UI: role-form.tsx:335-388, max 5)
      education_requirements: [
        {
          requirement: 'Bachelor\'s degree in Computer Science, Software Engineering, or related technical field',
          is_required: true
        },
        {
          requirement: 'Master\'s degree in Computer Science or equivalent experience preferred',
          is_required: false
        },
        {
          requirement: 'Industry certifications in cloud platforms (AWS, Azure, GCP)',
          is_required: false
        }
      ],

      // Experience Requirements Array (UI: role-form.tsx:392-458, max 5)
      experience_requirements: [
        {
          requirement: 'Senior-level software development experience with full-stack web applications',
          minimum_years: 5,
          is_required: true
        },
        {
          requirement: 'Experience leading development teams and mentoring developers',
          minimum_years: 3,
          is_required: true
        },
        {
          requirement: 'Experience with microservices architecture and distributed systems',
          minimum_years: 2,
          is_required: false
        },
        {
          requirement: 'Experience with DevOps practices and CI/CD pipelines',
          minimum_years: 2,
          is_required: false
        }
      ],

      // Skills Array (UI: role-form.tsx:462-547, max 10)
      skills: [
        {
          skill_name: 'React',
          skill_category: 'Frontend Frameworks',
          weight: 10,
          is_required: true
        },
        {
          skill_name: 'Node.js',
          skill_category: 'Backend Technologies',
          weight: 9,
          is_required: true
        },
        {
          skill_name: 'TypeScript',
          skill_category: 'Programming Languages',
          weight: 8,
          is_required: true
        },
        {
          skill_name: 'PostgreSQL',
          skill_category: 'Databases',
          weight: 7,
          is_required: false
        },
        {
          skill_name: 'AWS',
          skill_category: 'Cloud Platforms',
          weight: 6,
          is_required: false
        },
        {
          skill_name: 'Docker',
          skill_category: 'Tools & Software',
          weight: 5,
          is_required: false
        }
      ],

      // Questions Array (UI: role-form.tsx:551-625, max 10)
      questions: [
        {
          question_text: 'Describe your experience with React and modern frontend development patterns.',
          category: 'Technical Experience',
          weight: 9
        },
        {
          question_text: 'How do you approach mentoring junior developers and building team culture?',
          category: 'Leadership',
          weight: 8
        },
        {
          question_text: 'Explain your experience with microservices architecture and distributed systems.',
          category: 'Technical Experience',
          weight: 7
        },
        {
          question_text: 'How do you handle technical debt and code quality in large codebases?',
          category: 'Technical Experience',
          weight: 6
        }
      ],

      // Bonus/Penalty configs
      bonus_config: {
        preferredEducation: { enabled: false, specificUniversities: [], categories: { topLeague: false, top100Global: false, top50Global: false, regionalTop: false } },
        preferredCompanies: { enabled: false, specificCompanies: [], categories: { faangTech: false, fortune500: false, unicorns: false, industryLeaders: false, directCompetitors: false } },
        relatedProjects: { enabled: false, idealProjectDescription: '', maxProjects: 5 },
        valuableCertifications: { enabled: false, certifications: [], maxCertifications: 15 }
      },
      penalty_config: {
        jobStabilityCheck: { enabled: false, jobHoppingConcern: 'moderate' as const, jobHoppingThresholds: { lenient: '>50% short tenures', moderate: '>30% short tenures', strict: '>20% short tenures' } },
        employmentGapCheck: { enabled: false, gapThreshold: '1year' as const, gapPenalty: 5 }
      }
    }

    console.log('📊 Test Data Summary:', {
      educationCount: comprehensiveFormData.education_requirements.length,
      experienceCount: comprehensiveFormData.experience_requirements.length,
      skillsCount: comprehensiveFormData.skills.length,
      questionsCount: comprehensiveFormData.questions.length
    })

    // ===== STEP 1: VALIDATE FORM DATA =====
    console.log('📝 Step 1: Validating comprehensive form data...')
    const validation = validateRoleForm(comprehensiveFormData)
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        step: 'validation',
        error: 'Form validation failed',
        details: validation.errors
      })
    }
    console.log('✅ Form validation passed')

    // ===== STEP 2: TRANSFORM DATA =====
    console.log('🔄 Step 2: Transforming form data to database format...')
    const transformedData = transformRoleFormData(comprehensiveFormData, session.user.id)
    
    console.log('📋 Transformed Data Structure:', {
      roleData: {
        hasUserId: !!transformedData.roleData.user_id,
        hasTitle: !!transformedData.roleData.title,
        hasDescription: !!transformedData.roleData.description,
        hasResponsibilities: !!transformedData.roleData.responsibilities,
        hasBonusConfig: !!transformedData.roleData.bonus_config,
        hasPenaltyConfig: !!transformedData.roleData.penalty_config,
        isActive: transformedData.roleData.is_active
      },
      educationData: transformedData.educationData.length,
      experienceData: transformedData.experienceData.length,
      skillsData: transformedData.skillsData.length,
      questionsData: transformedData.questionsData.length
    })

    // ===== STEP 3: CREATE ROLE =====
    console.log('💾 Step 3: Creating main role record...')
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
    console.log('✅ Role created:', role.id)

    // ===== STEP 4: CREATE EDUCATION REQUIREMENTS =====
    console.log('🎓 Step 4: Creating education requirements...')
    let educationResults: any[] = []
    if (transformedData.educationData.length > 0) {
      const educationWithRoleId = transformedData.educationData.map(req => ({
        ...req,
        role_id: role.id
      }))
      
      const { data: education, error: educationError } = await supabase
        .from('role_education_requirements')
        .insert(educationWithRoleId)
        .select()

      if (educationError) {
        console.error('❌ Education requirements creation failed:', educationError)
        await supabase.from('roles').delete().eq('id', role.id)
        return NextResponse.json({
          success: false,
          step: 'education_creation',
          error: 'Education requirements creation failed',
          details: educationError
        })
      }
      educationResults = education || []
    }
    console.log(`✅ Created ${educationResults.length} education requirements`)

    // ===== STEP 5: CREATE EXPERIENCE REQUIREMENTS =====
    console.log('💼 Step 5: Creating experience requirements...')
    let experienceResults: any[] = []
    if (transformedData.experienceData.length > 0) {
      const experienceWithRoleId = transformedData.experienceData.map((req: any) => ({
        ...req,
        role_id: role.id
      }))
      
      const { data: experience, error: experienceError } = await supabase
        .from('role_experience_requirements')
        .insert(experienceWithRoleId)
        .select()

      if (experienceError) {
        console.error('❌ Experience requirements creation failed:', experienceError)
        await supabase.from('role_education_requirements').delete().eq('role_id', role.id)
        await supabase.from('roles').delete().eq('id', role.id)
        return NextResponse.json({
          success: false,
          step: 'experience_creation',
          error: 'Experience requirements creation failed',
          details: experienceError
        })
      }
      experienceResults = experience || []
    }
    console.log(`✅ Created ${experienceResults.length} experience requirements`)

    // ===== STEP 6: CREATE SKILLS =====
    console.log('🎯 Step 6: Creating skills...')
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
        await supabase.from('role_experience_requirements').delete().eq('role_id', role.id)
        await supabase.from('role_education_requirements').delete().eq('role_id', role.id)
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
    console.log(`✅ Created ${skillResults.length} skills`)

    // ===== STEP 7: CREATE QUESTIONS =====
    console.log('❓ Step 7: Creating questions...')
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
        await supabase.from('role_skills').delete().eq('role_id', role.id)
        await supabase.from('role_experience_requirements').delete().eq('role_id', role.id)
        await supabase.from('role_education_requirements').delete().eq('role_id', role.id)
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
    console.log(`✅ Created ${questionResults.length} questions`)

    // ===== STEP 8: VERIFICATION =====
    console.log('🔍 Step 8: Performing comprehensive data mapping verification...')
    
    // Verify UI to Database mapping
    const verificationReport = {
      uiToDatabase: {
        // Basic Information Mapping
        title: {
          uiField: 'formData.title',
          dbColumn: 'roles.title',
          uiValue: comprehensiveFormData.title,
          dbValue: role.title,
          mapped: comprehensiveFormData.title === role.title
        },
        description: {
          uiField: 'formData.description',
          dbColumn: 'roles.description',
          uiValue: comprehensiveFormData.description.substring(0, 50) + '...',
          dbValue: role.description.substring(0, 50) + '...',
          mapped: comprehensiveFormData.description === role.description
        },
        responsibilities: {
          uiField: 'formData.responsibilities',
          dbColumn: 'roles.responsibilities',
          uiValue: comprehensiveFormData.responsibilities?.substring(0, 50) + '...',
          dbValue: role.responsibilities?.substring(0, 50) + '...',
          mapped: comprehensiveFormData.responsibilities === role.responsibilities
        },
        
        // Education Requirements Mapping
        educationRequirements: {
          uiField: 'formData.education_requirements[]',
          dbTable: 'role_education_requirements',
          uiCount: comprehensiveFormData.education_requirements.length,
          dbCount: educationResults.length,
          mapped: comprehensiveFormData.education_requirements.length === educationResults.length,
          details: educationResults.map((dbReq, index) => ({
            uiRequirement: comprehensiveFormData.education_requirements[index]?.requirement,
            dbRequirement: dbReq.requirement,
            uiIsRequired: comprehensiveFormData.education_requirements[index]?.is_required,
            dbIsRequired: dbReq.is_required,
            mapped: comprehensiveFormData.education_requirements[index]?.requirement === dbReq.requirement &&
                   comprehensiveFormData.education_requirements[index]?.is_required === dbReq.is_required
          }))
        },
        
        // Experience Requirements Mapping
        experienceRequirements: {
          uiField: 'formData.experience_requirements[]',
          dbTable: 'role_experience_requirements',
          uiCount: comprehensiveFormData.experience_requirements.length,
          dbCount: experienceResults.length,
          mapped: comprehensiveFormData.experience_requirements.length === experienceResults.length,
          details: experienceResults.map((dbReq, index) => ({
            uiRequirement: comprehensiveFormData.experience_requirements[index]?.requirement,
            dbRequirement: dbReq.requirement,
            uiMinYears: comprehensiveFormData.experience_requirements[index]?.minimum_years,
            dbMinYears: dbReq.minimum_years,
            uiIsRequired: comprehensiveFormData.experience_requirements[index]?.is_required,
            dbIsRequired: dbReq.is_required,
            mapped: comprehensiveFormData.experience_requirements[index]?.requirement === dbReq.requirement &&
                   comprehensiveFormData.experience_requirements[index]?.minimum_years === dbReq.minimum_years &&
                   comprehensiveFormData.experience_requirements[index]?.is_required === dbReq.is_required
          }))
        },
        
        // Skills Mapping
        skills: {
          uiField: 'formData.skills[]',
          dbTable: 'role_skills',
          uiCount: comprehensiveFormData.skills.length,
          dbCount: skillResults.length,
          mapped: comprehensiveFormData.skills.length === skillResults.length,
          details: skillResults.map((dbSkill, index) => ({
            uiSkillName: comprehensiveFormData.skills[index]?.skill_name,
            dbSkillName: dbSkill.skill_name,
            uiCategory: comprehensiveFormData.skills[index]?.skill_category,
            dbCategory: dbSkill.skill_category,
            uiWeight: comprehensiveFormData.skills[index]?.weight,
            dbWeight: dbSkill.weight,
            uiIsRequired: comprehensiveFormData.skills[index]?.is_required,
            dbIsRequired: dbSkill.is_required,
            mapped: comprehensiveFormData.skills[index]?.skill_name === dbSkill.skill_name &&
                   comprehensiveFormData.skills[index]?.skill_category === dbSkill.skill_category &&
                   comprehensiveFormData.skills[index]?.weight === dbSkill.weight &&
                   comprehensiveFormData.skills[index]?.is_required === dbSkill.is_required
          }))
        },
        
        // Questions Mapping
        questions: {
          uiField: 'formData.questions[]',
          dbTable: 'role_questions',
          uiCount: comprehensiveFormData.questions.length,
          dbCount: questionResults.length,
          mapped: comprehensiveFormData.questions.length === questionResults.length,
          details: questionResults.map((dbQuestion, index) => ({
            uiQuestionText: comprehensiveFormData.questions[index]?.question_text,
            dbQuestionText: dbQuestion.question_text,
            uiCategory: comprehensiveFormData.questions[index]?.category,
            dbCategory: dbQuestion.question_category,
            uiWeight: comprehensiveFormData.questions[index]?.weight,
            dbWeight: dbQuestion.weight,
            mapped: comprehensiveFormData.questions[index]?.question_text === dbQuestion.question_text &&
                   comprehensiveFormData.questions[index]?.category === dbQuestion.question_category &&
                   comprehensiveFormData.questions[index]?.weight === dbQuestion.weight
          }))
        }
      }
    }

    // Calculate overall mapping success
    const mappingChecks = [
      verificationReport.uiToDatabase.title.mapped,
      verificationReport.uiToDatabase.description.mapped,
      verificationReport.uiToDatabase.responsibilities.mapped,
      verificationReport.uiToDatabase.educationRequirements.mapped,
      verificationReport.uiToDatabase.experienceRequirements.mapped,
      verificationReport.uiToDatabase.skills.mapped,
      verificationReport.uiToDatabase.questions.mapped,
      ...verificationReport.uiToDatabase.educationRequirements.details.map(d => d.mapped),
      ...verificationReport.uiToDatabase.experienceRequirements.details.map(d => d.mapped),
      ...verificationReport.uiToDatabase.skills.details.map(d => d.mapped),
      ...verificationReport.uiToDatabase.questions.details.map(d => d.mapped)
    ]

    const successfulMappings = mappingChecks.filter(Boolean).length
    const totalMappings = mappingChecks.length
    const mappingSuccessRate = (successfulMappings / totalMappings) * 100

    console.log(`📊 Mapping Verification: ${successfulMappings}/${totalMappings} (${mappingSuccessRate.toFixed(1)}%)`)

    return NextResponse.json({
      success: true,
      message: '🎉 COMPREHENSIVE DATA MAPPING VERIFICATION COMPLETE',
      mappingSuccessRate,
      summary: {
        totalUIFields: totalMappings,
        successfulMappings,
        failedMappings: totalMappings - successfulMappings,
        mappingSuccessRate: `${mappingSuccessRate.toFixed(1)}%`
      },
      verification: verificationReport,
      createdData: {
        role: {
          id: role.id,
          title: role.title,
          created_at: role.created_at
        },
        educationRequirements: educationResults.length,
        experienceRequirements: experienceResults.length,
        skills: skillResults.length,
        questions: questionResults.length
      },
      testUser: {
        id: session.user.id,
        email: session.user.email
      }
    })

  } catch (error: any) {
    console.error('💥 Data mapping verification failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Verification execution failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}