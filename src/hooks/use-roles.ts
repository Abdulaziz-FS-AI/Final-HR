'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase-browser'
import { Role, RoleWithDetails, RoleFormData } from '@/types'
import { useAuth } from '@/lib/auth-context'
import { getUserFriendlyError } from '@/lib/error-messages'
import { withDatabaseRetry } from '@/lib/retry-utils'

export function useRoles() {
  const [roles, setRoles] = useState<RoleWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchRoles = useCallback(async () => {
    if (!user || !user.id) {
      console.log('fetchRoles: No user or user.id available', { user })
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Debug: Check session before making request
      const { data: session } = await supabase.auth.getSession()
      console.log('fetchRoles: Current session:', !!session.session)
      console.log('fetchRoles: User ID:', user.id)
      
      const { data, error } = await supabase
        .from('roles')
        .select(`
          *,
          skills:role_skills(*),
          questions:role_questions(*),
          education_requirements:role_education_requirements(*),
          experience_requirements:role_experience_requirements(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('fetchRoles error:', error)
        throw error
      }
      
      setRoles(data || [])
      console.log(`✅ Fetched ${data?.length || 0} roles`)
      
    } catch (err: any) {
      console.error('fetchRoles failed:', err)
      setError(err.message)
      setRoles([])
    } finally {
      setLoading(false)
    }
  }, [user])

  const createRole = async (roleData: RoleFormData) => {
    console.log('🚀 Starting createRole function...')
    
    // Enhanced validation
    if (!user) throw new Error('Authentication required. Please log in.')
    if (!user.id) throw new Error('User session invalid. Please refresh and try again.')

    // Import validation and transformation utilities at the top
    console.log('📦 Importing validation utilities...')
    const { validateRoleForm } = await import('@/utils/form-validation')
    console.log('📦 Importing transformation utilities...')
    const { 
      transformRoleFormData, 
      generateRoleCreationSummary, 
      validateTransformedData,
      createUserSummary,
      generateEvaluationPrompt
    } = await import('@/utils/role-data-transformer')
    console.log('✅ All imports successful')

    // ===== STEP 1: COMPREHENSIVE FORM VALIDATION =====
    console.log('📝 Validating form data...')
    const validation = validateRoleForm(roleData)
    if (!validation.isValid) {
      const errorMessage = `Form validation failed:\n${validation.errors.join('\n')}`
      console.error('❌ Validation failed:', validation.errors)
      throw new Error(errorMessage)
    }
    console.log('✅ Form validation passed')

    // ===== STEP 2: AUTHENTICATION VERIFICATION =====
    console.log('🔐 Starting authentication verification...')
    
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    console.log('📡 Session data received:', { hasSession: !!sessionData.session, error: sessionError })
    
    if (sessionError) {
      console.error('Session error details:', sessionError)
      throw new Error('Authentication session error. Please log in again.')
    }
    
    let currentSession = sessionData.session
    
    if (!currentSession) {
      console.error('No active session found')
      throw new Error('No active session. Please log in again.')
    }
    
    console.log('✅ Session found:', currentSession.user.email)
    
    // Proactively refresh session if it will expire in the next 5 minutes
    const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000)
    if (currentSession.expires_at && currentSession.expires_at * 1000 <= fiveMinutesFromNow) {
      console.log('⚠️ Session expiring soon, refreshing proactively...')
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError || !refreshData.session) {
        console.error('Session refresh failed:', refreshError)
        throw new Error('Session expired. Please log in again.')
      }
      currentSession = refreshData.session
      console.log('✅ Session refreshed successfully')
    }

    console.log('🔑 Creating role with authenticated user:', {
      userId: user.id,
      sessionUserId: currentSession.user?.id,
      tokenValid: !!currentSession.access_token,
      tokenExpiry: new Date(currentSession.expires_at! * 1000)
    })
    
    // Verify user ID matches session
    if (currentSession.user?.id !== user.id) {
      console.error('User ID mismatch:', { sessionUserId: currentSession.user?.id, contextUserId: user.id })
      throw new Error('User authentication mismatch. Please refresh and try again.')
    }

    // ===== STEP 3: DATA TRANSFORMATION =====
    console.log('🔄 Transforming form data to database format...')
    
    // Declare transformedData in outer scope
    let transformedData: any
    let summary: any
    
    try {
      transformedData = transformRoleFormData(roleData, user.id)
      console.log('✅ Data transformation completed')
      
      summary = generateRoleCreationSummary(roleData)
      console.log('📊 Role creation summary:', summary)
      
      const evaluationPrompt = generateEvaluationPrompt(
        transformedData.roleData, 
        transformedData.skillsData, 
        transformedData.questionsData,
        transformedData.educationData,
        transformedData.experienceData
      )
      console.log('🎯 Evaluation prompt preview:', evaluationPrompt.substring(0, 200) + '...')
    } catch (transformError: any) {
      console.error('❌ Data transformation failed:', transformError)
      throw new Error(`Data transformation failed: ${transformError.message}`)
    }
    
    // Validate transformed data
    const transformationErrors = validateTransformedData(transformedData)
    if (transformationErrors.length > 0) {
      console.error('❌ Data transformation validation failed:', transformationErrors)
      throw new Error(`Data transformation failed: ${transformationErrors.join(', ')}`)
    }
    console.log('✅ Data transformation validated')

    let createdRoleId: string | null = null

    try {
      // ===== STEP 4: CREATE ROLE USING TRANSACTION FUNCTION =====
      console.log('🚀 Creating role with transaction...')
      
      // Prepare data for the transaction function
      const transactionData = {
        p_role_data: transformedData.roleData,
        p_skills: transformedData.skillsData,
        p_questions: transformedData.questionsData,
        p_education_requirements: transformedData.educationData,
        p_experience_requirements: transformedData.experienceData
      }
      
      // Use the transaction function with retry logic
      console.log('📞 Calling RPC with data:', JSON.stringify(transactionData, null, 2))
      
      const result = await withDatabaseRetry(
        async () => {
          console.log('🔄 Attempting RPC call...')
          const { data, error } = await supabase.rpc('create_role_with_details', transactionData)
          console.log('📡 RPC response:', { data, error })
          if (error) {
            console.error('❌ RPC error details:', error)
            throw error
          }
          return data
        },
        'role creation'
      )
      
      if (!result || typeof result !== 'object' || !('role_id' in result)) {
        throw new Error('Role creation failed: No role ID returned')
      }
      
      createdRoleId = (result as any).role_id
      console.log('✅ Role created successfully with transaction:', result)

      // Transaction function handles all related inserts atomically
      // No need for separate inserts anymore

      // ===== STEP 5: FINALIZE AND SUCCESS =====
      console.log('🔄 Refreshing roles list...')
      if (user && user.id) {
        await fetchRoles()
      }
      
      // Fetch the complete role with all relations
      const { data: completeRole } = await supabase
        .from('roles')
        .select(`
          *,
          skills:role_skills(*),
          questions:role_questions(*),
          education_requirements:role_education_requirements(*),
          experience_requirements:role_experience_requirements(*)
        `)
        .eq('id', createdRoleId!)
        .single()
      
      console.log('🎉 Role creation completed successfully!')
      console.log('📊 Final Statistics:', (result as any).stats)
      
      return completeRole || { id: createdRoleId! }

    } catch (error: any) {
      console.error('❌ Role creation failed:', error)
      
      // Transaction automatically handles rollback, no manual cleanup needed
      
      // Throw user-friendly error message
      const friendlyError = getUserFriendlyError(error)
      throw new Error(friendlyError)
    }
  }

  const deleteRole = async (roleId: string) => {
    if (!user) throw new Error('No user found')
    
    try {
      const { error } = await supabase
        .from('roles')
        .update({ is_active: false })
        .eq('id', roleId)
        .eq('user_id', user.id)

      if (error) throw error
      await fetchRoles()
    } catch (err: any) {
      throw new Error(err.message)
    }
  }

  const getRoleById = async (roleId: string): Promise<RoleWithDetails | null> => {
    if (!user) throw new Error('No user found')
    
    try {
      const { data, error } = await supabase
        .from('roles')
        .select(`
          *,
          skills:role_skills(*),
          questions:role_questions(*),
          education_requirements:role_education_requirements(*),
          experience_requirements:role_experience_requirements(*)
        `)
        .eq('id', roleId)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      return data
    } catch (err: any) {
      throw new Error(err.message)
    }
  }

  useEffect(() => {
    if (user !== null) { // Only fetch when auth state is determined (not loading)
      fetchRoles()
    }
  }, [user, fetchRoles])

  return {
    roles,
    loading,
    error,
    createRole,
    deleteRole,
    getRoleById,
    refreshRoles: fetchRoles,
  }
}