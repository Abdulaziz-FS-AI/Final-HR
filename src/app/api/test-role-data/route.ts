import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 TESTING ROLE DATA: Analyzing 400 error...')
    
    const supabase = await createServerClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No session - please log in first'
      })
    }

    // Test with MINIMAL data first
    const minimalRoleData = {
      user_id: session.user.id,
      title: 'TEST ROLE',
      description: 'Testing minimal role data structure'
    }

    console.log('📝 Testing MINIMAL role data...')
    const { data: minimalResult, error: minimalError } = await supabase
      .from('roles')
      .insert(minimalRoleData)
      .select()
      .single()

    if (minimalError) {
      console.error('❌ MINIMAL data failed:', minimalError)
      return NextResponse.json({
        success: false,
        step: 'minimal_data',
        error: minimalError.message,
        details: minimalError
      })
    }

    console.log('✅ MINIMAL data worked:', minimalResult.id)
    await supabase.from('roles').delete().eq('id', minimalResult.id)

    // Test with EDUCATION requirements
    const educationRoleData = {
      user_id: session.user.id,
      title: 'TEST EDUCATION ROLE',
      description: 'Testing education requirements structure',
      education_requirements: {
        enabled: true,
        requirement: 'Bachelor degree in Computer Science',
        nice_to_have: 'Master degree preferred'
      }
    }

    console.log('📝 Testing EDUCATION data...')
    const { data: educationResult, error: educationError } = await supabase
      .from('roles')
      .insert(educationRoleData)
      .select()
      .single()

    if (educationError) {
      console.error('❌ EDUCATION data failed:', educationError)
      return NextResponse.json({
        success: false,
        step: 'education_data',
        error: educationError.message,
        details: educationError,
        testData: educationRoleData
      })
    }

    console.log('✅ EDUCATION data worked:', educationResult.id)
    await supabase.from('roles').delete().eq('id', educationResult.id)

    // Test with EXPERIENCE requirements
    const experienceRoleData = {
      user_id: session.user.id,
      title: 'TEST EXPERIENCE ROLE',
      description: 'Testing experience requirements structure',
      experience_requirements: {
        enabled: true,
        requirement: '3+ years in software development',
        nice_to_have: 'Leadership experience',
        minimum_years: 3
      }
    }

    console.log('📝 Testing EXPERIENCE data...')
    const { data: experienceResult, error: experienceError } = await supabase
      .from('roles')
      .insert(experienceRoleData)
      .select()
      .single()

    if (experienceError) {
      console.error('❌ EXPERIENCE data failed:', experienceError)
      return NextResponse.json({
        success: false,
        step: 'experience_data',
        error: experienceError.message,
        details: experienceError,
        testData: experienceRoleData
      })
    }

    console.log('✅ EXPERIENCE data worked:', experienceResult.id)
    await supabase.from('roles').delete().eq('id', experienceResult.id)

    // Test with BONUS/PENALTY configs - this is likely the culprit
    const bonusRoleData = {
      user_id: session.user.id,
      title: 'TEST BONUS ROLE',
      description: 'Testing bonus/penalty config structure',
      bonus_config: {
        enabled: false,
        items: []
      },
      penalty_config: {
        enabled: false,
        items: []
      }
    }

    console.log('📝 Testing BONUS/PENALTY data...')
    const { data: bonusResult, error: bonusError } = await supabase
      .from('roles')
      .insert(bonusRoleData)
      .select()
      .single()

    if (bonusError) {
      console.error('❌ BONUS/PENALTY data failed:', bonusError)
      return NextResponse.json({
        success: false,
        step: 'bonus_penalty_data',
        error: bonusError.message,
        details: bonusError,
        testData: bonusRoleData,
        recommendation: 'Issue is likely in bonus_config or penalty_config structure'
      })
    }

    console.log('✅ BONUS/PENALTY data worked:', bonusResult.id)
    await supabase.from('roles').delete().eq('id', bonusResult.id)

    return NextResponse.json({
      success: true,
      message: 'All data structures work correctly',
      conclusion: 'The 400 error is likely caused by complex bonus/penalty config from the form'
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