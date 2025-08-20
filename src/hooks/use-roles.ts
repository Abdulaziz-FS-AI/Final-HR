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
      // ===== STEP 4: CREATE ROLE USING DIRECT TABLE INSERTS =====
      console.log('🚀 Creating role with direct inserts...')
      
      // Step 1: Insert the main role
      console.log('📝 Step 1: Creating role...')
      const { data: roleResult, error: roleError } = await supabase
        .from('roles')
        .insert(transformedData.roleData)
        .select()
        .single()
      
      if (roleError) {
        console.error('❌ Role insert failed:', roleError)
        throw new Error(`Failed to create role: ${roleError.message}`)
      }
      
      createdRoleId = roleResult.id
      console.log('✅ Role created successfully:', createdRoleId)
      
      // Step 2: Insert skills in parallel
      const insertPromises: Promise<any>[] = []
      
      if (transformedData.skillsData.length > 0) {
        console.log('📝 Step 2: Adding skills...')
        const skillsWithRoleId = transformedData.skillsData.map(skill => ({
          ...skill,
          role_id: createdRoleId
        }))
        
        insertPromises.push(
          supabase.from('role_skills').insert(skillsWithRoleId)
        )
      }
      
      if (transformedData.questionsData.length > 0) {
        console.log('📝 Step 3: Adding questions...')
        const questionsWithRoleId = transformedData.questionsData.map(question => ({
          ...question,
          role_id: createdRoleId
        }))
        
        insertPromises.push(
          supabase.from('role_questions').insert(questionsWithRoleId)
        )
      }
      
      if (transformedData.educationData.length > 0) {
        console.log('📝 Step 4: Adding education requirements...')
        const educationWithRoleId = transformedData.educationData.map(edu => ({
          ...edu,
          role_id: createdRoleId
        }))
        
        insertPromises.push(
          supabase.from('role_education_requirements').insert(educationWithRoleId)
        )
      }
      
      if (transformedData.experienceData.length > 0) {
        console.log('📝 Step 5: Adding experience requirements...')
        const experienceWithRoleId = transformedData.experienceData.map(exp => ({
          ...exp,
          role_id: createdRoleId
        }))
        
        insertPromises.push(
          supabase.from('role_experience_requirements').insert(experienceWithRoleId)
        )
      }
      
      // Execute all inserts in parallel for better performance
      if (insertPromises.length > 0) {
        console.log(`📦 Executing ${insertPromises.length} related data inserts...`)
        const results = await Promise.all(insertPromises)
        
        // Check for any errors in the parallel inserts
        const errors = results.filter(result => result.error)
        if (errors.length > 0) {
          console.error('❌ Some related data inserts failed:', errors)
          // Continue anyway - role is created, some data might be missing but not critical
          console.log('⚠️ Role created but some related data may be incomplete')
        } else {
          console.log('✅ All related data inserted successfully')
        }
      }

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
      
      // Basic cleanup if role was created but related data failed
      if (createdRoleId && error?.message?.includes('related data')) {
        console.log('🧹 Attempting cleanup of partially created role...')
        try {
          await supabase
            .from('roles')
            .update({ is_active: false })
            .eq('id', createdRoleId)
          console.log('✅ Role marked as inactive for cleanup')
        } catch (cleanupError) {
          console.error('❌ Cleanup failed:', cleanupError)
          // Don't throw - original error is more important
        }
      }
      
      // Enhanced error handling
      let friendlyError = getUserFriendlyError(error)
      
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