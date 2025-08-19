import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Testing useRoles imports and functions...')
    
    // Test the async imports that useRoles uses
    console.log('📦 Testing validation import...')
    const { validateRoleForm } = await import('@/utils/form-validation')
    console.log('✅ Validation import successful')

    console.log('📦 Testing transformer import...')
    const { 
      transformRoleFormData, 
      generateRoleCreationSummary, 
      validateTransformedData,
      createUserSummary,
      generateEvaluationPrompt
    } = await import('@/utils/role-data-transformer')
    console.log('✅ Transformer import successful')

    // Test with minimal form data
    const testFormData = {
      title: 'Test Role',
      description: 'Test description for debugging purposes',
      responsibilities: '',
      education_requirements: [],
      experience_requirements: [],
      skills: [{
        skill_name: 'Test Skill',
        skill_category: 'Technical',
        weight: 5,
        is_required: true
      }],
      questions: [],
      bonus_config: {} as any,
      penalty_config: {} as any
    }

    console.log('🧪 Testing form validation...')
    const validation = validateRoleForm(testFormData)
    console.log('Validation result:', validation)

    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Form validation failed',
        step: 'validation',
        details: validation.errors
      })
    }

    console.log('🔄 Testing data transformation...')
    const transformedData = transformRoleFormData(testFormData, 'test-user-id')
    console.log('Transformed data:', transformedData)

    console.log('📊 Testing summary generation...')
    const summary = generateRoleCreationSummary(testFormData)
    console.log('Summary:', summary)

    console.log('✅ Testing validation of transformed data...')
    const transformationErrors = validateTransformedData(transformedData)
    console.log('Transformation errors:', transformationErrors)

    if (transformationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Data transformation validation failed',
        step: 'transformation_validation',
        details: transformationErrors
      })
    }

    return NextResponse.json({
      success: true,
      message: 'All useRoles functions working correctly',
      steps: {
        imports: 'PASSED',
        validation: 'PASSED',
        transformation: 'PASSED',
        summary_generation: 'PASSED',
        transformation_validation: 'PASSED'
      },
      testResults: {
        validation,
        transformedData,
        summary,
        transformationErrors
      }
    })

  } catch (error: any) {
    console.error('💥 useRoles debug test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'useRoles debug test failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}