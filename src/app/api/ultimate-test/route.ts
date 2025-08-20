import { NextRequest, NextResponse } from 'next/server'
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 ULTIMATE TEST: Testing all possible role creation methods...')
    
    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({
        success: false,
        error: 'Authentication failed',
        details: sessionError
      })
    }

    console.log('👤 Testing with user:', session.user.email)

    // Test data
    const testRoleData = {
      title: 'ULTIMATE TEST ROLE',
      description: 'Testing all possible creation methods',
      responsibilities: 'Test responsibilities',
      education_requirements: {
        hasRequirements: true,
        requirements: 'Test education requirement'
      },
      experience_requirements: {
        hasRequirements: false,
        requirements: ''
      },
      bonus_config: null,
      penalty_config: null,
      skills: [
        {
          skill_name: 'Test Skill',
          skill_category: 'Technical',
          weight: 1,
          is_required: true
        }
      ],
      questions: [
        {
          question_text: 'Test question?',
          category: 'Technical',
          weight: 1
        }
      ]
    }

    const results: any = {
      methods: {},
      summary: {
        totalMethods: 0,
        successfulMethods: 0,
        failedMethods: 0
      }
    }

    // Method 1: Standard Supabase client
    console.log('🧪 Method 1: Standard Supabase client...')
    try {
      const roleInsertData = {
        user_id: session.user.id,
        title: testRoleData.title,
        description: testRoleData.description,
        responsibilities: testRoleData.responsibilities,
        education_requirements: {
          enabled: testRoleData.education_requirements.hasRequirements,
          requirement: testRoleData.education_requirements.requirements || '',
          nice_to_have: ''
        },
        experience_requirements: {
          enabled: testRoleData.experience_requirements.hasRequirements,
          requirement: testRoleData.experience_requirements.requirements || '',
          nice_to_have: '',
          minimum_years: 0
        },
        bonus_config: testRoleData.bonus_config,
        penalty_config: testRoleData.penalty_config,
      }

      const result1 = await supabase
        .from('roles')
        .insert(roleInsertData)
        .select()
        .single()

      if (result1.error) throw result1.error

      results.methods.standardClient = {
        success: true,
        roleId: result1.data.id,
        method: 'Standard Supabase Client'
      }
      results.summary.successfulMethods++

      // Cleanup
      await supabase.from('roles').delete().eq('id', result1.data.id)

    } catch (error1: any) {
      results.methods.standardClient = {
        success: false,
        error: error1.message,
        details: error1
      }
      results.summary.failedMethods++
    }
    results.summary.totalMethods++

    // Method 2: Manual fetch with auth headers
    console.log('🧪 Method 2: Manual fetch with auth headers...')
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          user_id: session.user.id,
          title: testRoleData.title + ' - Manual Fetch',
          description: testRoleData.description
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw errorData
      }

      const data = await response.json()
      const roleId = Array.isArray(data) ? data[0].id : data.id

      results.methods.manualFetch = {
        success: true,
        roleId: roleId,
        method: 'Manual Fetch with Auth Headers'
      }
      results.summary.successfulMethods++

      // Cleanup
      await supabase.from('roles').delete().eq('id', roleId)

    } catch (error2: any) {
      results.methods.manualFetch = {
        success: false,
        error: error2.message || error2.error || 'Manual fetch failed',
        details: error2
      }
      results.summary.failedMethods++
    }
    results.summary.totalMethods++

    // Method 3: Emergency service role bypass
    console.log('🧪 Method 3: Emergency service role bypass...')
    try {
      const emergencyResponse = await fetch('/api/emergency-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleData: {
            ...testRoleData,
            title: testRoleData.title + ' - Emergency Bypass'
          }
        })
      })

      if (!emergencyResponse.ok) {
        const emergencyError = await emergencyResponse.json()
        throw emergencyError
      }

      const emergencyResult = await emergencyResponse.json()

      results.methods.emergencyBypass = {
        success: true,
        roleId: emergencyResult.role.id,
        method: 'Service Role Emergency Bypass',
        details: emergencyResult
      }
      results.summary.successfulMethods++

      // Cleanup
      await supabase.from('roles').delete().eq('id', emergencyResult.role.id)

    } catch (error3: any) {
      results.methods.emergencyBypass = {
        success: false,
        error: error3.error || error3.message || 'Emergency bypass failed',
        details: error3
      }
      results.summary.failedMethods++
    }
    results.summary.totalMethods++

    // Method 4: Deep debug analysis
    console.log('🧪 Method 4: Deep debug analysis...')
    try {
      const debugResponse = await fetch('/api/deep-debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (debugResponse.ok) {
        const debugResult = await debugResponse.json()
        results.methods.deepDebug = {
          success: true,
          method: 'Deep Debug Analysis',
          analysis: debugResult.deepAnalysis
        }
      } else {
        throw new Error('Debug analysis failed')
      }

    } catch (error4: any) {
      results.methods.deepDebug = {
        success: false,
        error: error4.message || 'Debug analysis failed',
        details: error4
      }
    }

    // Final assessment
    results.assessment = {
      overallSuccess: results.summary.successfulMethods > 0,
      recommendedMethod: null,
      criticalIssues: [],
      recommendations: []
    }

    if (results.methods.standardClient?.success) {
      results.assessment.recommendedMethod = 'Standard Supabase Client'
      results.assessment.recommendations.push('Standard client works - issue was temporary or environment-specific')
    } else if (results.methods.manualFetch?.success) {
      results.assessment.recommendedMethod = 'Manual Fetch with Auth Headers'
      results.assessment.criticalIssues.push('Standard Supabase client has auth header issues')
      results.assessment.recommendations.push('Use manual fetch approach as primary method')
    } else if (results.methods.emergencyBypass?.success) {
      results.assessment.recommendedMethod = 'Service Role Emergency Bypass'
      results.assessment.criticalIssues.push('All client-side authentication methods are failing')
      results.assessment.criticalIssues.push('RLS policies may be blocking legitimate requests')
      results.assessment.recommendations.push('Investigate RLS policy configuration')
      results.assessment.recommendations.push('Check JWT token validation in database')
    } else {
      results.assessment.criticalIssues.push('ALL METHODS FAILED - Critical system issue')
      results.assessment.recommendations.push('Check Supabase project configuration')
      results.assessment.recommendations.push('Verify environment variables')
      results.assessment.recommendations.push('Check database connectivity')
    }

    console.log('🎯 Ultimate test completed:', results.assessment)

    return NextResponse.json({
      success: results.assessment.overallSuccess,
      message: `${results.summary.successfulMethods}/${results.summary.totalMethods} methods succeeded`,
      results: results,
      sessionInfo: {
        userId: session.user.id,
        email: session.user.email,
        tokenValid: !!session.access_token
      }
    })

  } catch (error: any) {
    console.error('💥 Ultimate test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Ultimate test execution failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}