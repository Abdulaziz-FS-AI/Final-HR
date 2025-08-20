'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from "@/lib/supabase"
import { Role, RoleWithDetails, RoleFormData } from '@/types'
import { useAuth } from '@/lib/auth-context'
import { getUserFriendlyError } from '@/lib/error-messages'
import { withDatabaseRetry } from '@/lib/retry-utils'
import { useErrorMonitoring } from '@/lib/error-monitoring'

export function useRoles() {
  const [roles, setRoles] = useState<RoleWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { reportError } = useErrorMonitoring()

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
    console.log('🚀 Creating role...')
    
    // Enhanced validation
    if (!user) throw new Error('Authentication required. Please log in.')
    if (!user.id) throw new Error('User session invalid. Please refresh and try again.')

    // Import utilities
    let validateRoleForm, transformRoleFormData, generateRoleCreationSummary, validateTransformedData, createUserSummary, generateEvaluationPrompt
    
    try {
      const validationModule = await import('@/utils/form-validation')
      validateRoleForm = validationModule.validateRoleForm
      
      const transformModule = await import('@/utils/role-data-transformer')
      transformRoleFormData = transformModule.transformRoleFormData
      generateRoleCreationSummary = transformModule.generateRoleCreationSummary
      validateTransformedData = transformModule.validateTransformedData
      createUserSummary = transformModule.createUserSummary
      generateEvaluationPrompt = transformModule.generateEvaluationPrompt
    } catch (importError) {
      console.error('Import failed:', importError)
      throw new Error(`Module import failed: ${importError.message}`)
    }

    // Validate form
    const validation = validateRoleForm(roleData)
    if (!validation.isValid) {
      throw new Error(`Form validation failed: ${validation.errors.join(', ')}`)
    }

    // Check authentication
    if (!user?.id) {
      throw new Error('User session invalid. Please refresh and try again.')
    }

    // Transform data
    
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
      console.log('📞 Calling RPC...')
      
      const result = await withDatabaseRetry(
        async () => {
          console.log('🔄 Attempting RPC call...')
          
          // Add timeout and enhanced error handling for Brave browser
          const rpcPromise = supabase.rpc('create_role_with_details', transactionData)
          
          // Race between the RPC call and a timeout
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('RPC call timed out - this may be due to browser blocking. Please try disabling tracking protection for this site.'))
            }, 30000) // 30 second timeout
          })
          
          let rpcResult
          try {
            rpcResult = await Promise.race([rpcPromise, timeoutPromise])
          } catch (timeoutError) {
            console.error('🚨 TIMEOUT DETECTED:', timeoutError.message)
            
            // Detect Brave browser specifically
            const isBrave = navigator.userAgent.includes('Brave') || 
                           (window as any).navigator?.brave !== undefined ||
                           navigator.userAgent.includes('Brave/')
            
            if (isBrave) {
              throw new Error(`
🦁 Brave Browser Detected

Brave's privacy features are blocking this request even with shields disabled.

**Quick Fix:**
1. Open this site in Chrome, Firefox, or Safari
2. Or try Brave's "Private Window with Tor" mode

**Why this happens:**
Brave blocks certain database operations for privacy, even with shields off.

This is a known issue with privacy browsers and complex web applications.
              `.trim())
            }
            
            // Check if role was actually created despite timeout
            console.log('🔍 Checking if role was created despite timeout...')
            await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
            
            // Refresh roles to see if it was created
            await fetchRoles()
            
            throw timeoutError
          }
          
          const { data, error } = rpcResult
          
          console.log('📡 RPC response:', { 
            data, 
            error, 
            hasData: !!data,
            dataType: typeof data,
            errorCode: error?.code,
            errorMessage: error?.message,
            errorDetails: error?.details,
            errorHint: error?.hint
          })
          
          if (error) {
            console.error('❌ RPC error details:', {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint,
              fullError: error
            })
            throw new Error(`Database error: ${error.message} (Code: ${error.code})`)
          }
          
          if (!data) {
            throw new Error('No data returned from database function')
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
      console.error('❌ Role creation failed:', {
        errorMessage: error?.message,
        errorStack: error?.stack,
        errorName: error?.name,
        errorCode: error?.code,
        fullError: error
      })
      
      // Report to error monitoring
      reportError(
        `Role creation failed: ${error?.message || 'Unknown error'}`, 
        'high'
      )
      
      // Transaction automatically handles rollback, no manual cleanup needed
      
      // Enhanced error handling for Brave browser compatibility
      let friendlyError = getUserFriendlyError(error)
      
      // Check if this looks like a Brave blocking issue
      if (error?.message?.includes('timed out') || 
          error?.message?.includes('browser blocking') ||
          error?.message?.includes('tracking protection')) {
        friendlyError = `
🛡️ Browser Security Feature Detected

Your browser's tracking protection may be blocking this request. To fix this:

**For Brave Browser:**
1. Click the 🛡️ Brave shield icon in the address bar
2. Turn off "Block trackers & ads" for this site
3. Refresh the page and try again

**Alternative:** Try using Chrome, Firefox, or Safari for the best experience.

Original error: ${friendlyError}
        `.trim()
      }
      
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