'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from "@/lib/supabase-browser"
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

  const fetchRoles = useCallback(async (includeInactive = false) => {
    if (!user?.id) {
      console.warn('No user ID available for fetching roles')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Fetching roles for user:', user.email)
      
      // Build query - include inactive roles if requested
      let query = supabase
        .from('roles')
        .select(`
          *,
          skills:role_skills(*),
          questions:role_questions(*),
          education_requirements:role_education_requirements(*),
          experience_requirements:role_experience_requirements(*)
        `)
        .eq('user_id', user.id)

      if (!includeInactive) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching roles:', error)
        throw error
      }
      
      console.log('Fetched roles for user:', data)
      setRoles(data || [])
      
    } catch (err: any) {
      console.error('Failed to fetch roles:', err)
      setError(err.message)
      setRoles([])
    } finally {
      setLoading(false)
    }
  }, [user])

  const createRole = async (roleData: RoleFormData) => {
    // Add timeout to prevent hanging requests in Brave browser
    const createRoleWithTimeout = async () => {
    console.log('🔐 Creating role for user:', user?.email)
    
    if (!user?.id) throw new Error('Authentication required. Please log in.')

    // Import utilities
    let validateRoleForm, transformRoleFormData
    
    try {
      const validationModule = await import('@/utils/form-validation')
      validateRoleForm = validationModule.validateRoleForm
      
      const transformModule = await import('@/utils/role-data-transformer')
      transformRoleFormData = transformModule.transformRoleFormData
    } catch (importError) {
      throw new Error('Failed to load required modules')
    }

    // Validate form
    const validation = validateRoleForm(roleData)
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '))
    }

    // Transform data
    let transformedData: any
    
    try {
      transformedData = transformRoleFormData(roleData, user.id)
    } catch (transformError: any) {
      throw new Error('Failed to prepare role data')
    }

    let createdRoleId: string | null = null

    try {
      console.log('📤 Creating role:', transformedData.roleData.title)
      
      // Create role with simplified error handling
      const { data: roleResult, error: roleError } = await supabase
        .from('roles')
        .insert(transformedData.roleData)
        .select()
        .single()
      
      if (roleError) {
        console.error('❌ Role insert failed:', roleError)
        console.error('   Error code:', roleError.code)
        console.error('   Error hint:', roleError.hint)
        console.error('   Error details:', roleError.details)
        throw new Error(`Failed to create role: ${roleError.message}`)
      }
      
      createdRoleId = roleResult.id
      
      // Step 2: Insert related data sequentially (Brave browser friendly)
      // Sequential inserts prevent Brave from blocking multiple simultaneous requests
      console.log('✅ Role created successfully, now adding related data...')
      
      const insertedData: string[] = []
      
      try {
        // Insert skills
        if (transformedData.skillsData?.length > 0) {
          console.log('📊 Inserting skills...')
          const skillsWithRoleId = transformedData.skillsData.map(skill => ({
            ...skill,
            role_id: createdRoleId
          }))
          const { error: skillsError } = await supabase
            .from('role_skills')
            .insert(skillsWithRoleId)
          
          if (skillsError) {
            console.error('Skills insert failed:', skillsError)
            throw new Error(`Failed to add skills: ${skillsError.message}`)
          }
          insertedData.push('skills')
          console.log('✅ Skills added successfully')
        }
        
        // Insert questions
        if (transformedData.questionsData?.length > 0) {
          console.log('❓ Inserting questions...')
          const questionsWithRoleId = transformedData.questionsData.map(question => ({
            ...question,
            role_id: createdRoleId
          }))
          const { error: questionsError } = await supabase
            .from('role_questions')
            .insert(questionsWithRoleId)
          
          if (questionsError) {
            console.error('Questions insert failed:', questionsError)
            throw new Error(`Failed to add questions: ${questionsError.message}`)
          }
          insertedData.push('questions')
          console.log('✅ Questions added successfully')
        }
        
        // Insert education requirements
        if (transformedData.educationData?.length > 0) {
          console.log('🎓 Inserting education requirements...')
          const educationWithRoleId = transformedData.educationData.map(edu => ({
            ...edu,
            role_id: createdRoleId
          }))
          const { error: educationError } = await supabase
            .from('role_education_requirements')
            .insert(educationWithRoleId)
          
          if (educationError) {
            console.error('Education requirements insert failed:', educationError)
            throw new Error(`Failed to add education requirements: ${educationError.message}`)
          }
          insertedData.push('education')
          console.log('✅ Education requirements added successfully')
        }
        
        // Insert experience requirements
        if (transformedData.experienceData?.length > 0) {
          console.log('💼 Inserting experience requirements...')
          const experienceWithRoleId = transformedData.experienceData.map(exp => ({
            ...exp,
            role_id: createdRoleId
          }))
          const { error: experienceError } = await supabase
            .from('role_experience_requirements')
            .insert(experienceWithRoleId)
          
          if (experienceError) {
            console.error('Experience requirements insert failed:', experienceError)
            throw new Error(`Failed to add experience requirements: ${experienceError.message}`)
          }
          insertedData.push('experience')
          console.log('✅ Experience requirements added successfully')
        }
        
        console.log(`🎉 Role creation completed! Added: ${insertedData.join(', ')}`)
        
      } catch (relatedDataError: any) {
        console.error('Failed to insert related data:', relatedDataError)
        // Don't delete the role - partial success is better than total failure
        // User can edit the role later to add missing components
        console.warn('⚠️ Role created but some related data failed. User can edit role to complete setup.')
        
        // Still refresh and return success - role exists
        await fetchRoles()
        return { 
          id: createdRoleId!,
          warning: `Role created but some components failed: ${relatedDataError.message}. You can edit the role to complete setup.`
        }
      }

      // Refresh roles list
      await fetchRoles()
      
      // Return the created role ID
      return { id: createdRoleId! }

    } catch (error: any) {
      console.error('❌ Role creation failed:', error)
      
      // Only cleanup if the main role creation failed
      // If role was created but related data failed, we don't delete it
      if (createdRoleId && error.message?.includes('Failed to create role:')) {
        console.log('🧹 Cleaning up failed role creation...')
        await supabase
          .from('roles')
          .delete()
          .eq('id', createdRoleId)
          .catch((cleanupError) => {
            console.error('Cleanup failed:', cleanupError)
          })
      }
      
      // Report error with better context
      const errorContext = {
        stage: createdRoleId ? 'related_data_insert' : 'role_insert',
        roleId: createdRoleId,
        userId: user.id,
        errorType: error.name || 'UnknownError'
      }
      
      reportError(error?.message || 'Role creation failed', 'high')
      
      // Provide Brave-specific error message if needed
      let friendlyError = getUserFriendlyError(error)
      
      // Check if this might be a Brave browser issue
      if (error.message?.includes('timeout') || error.message?.includes('blocked') || error.message?.includes('network')) {
        friendlyError += '\n\n💡 If you\'re using Brave browser, try:\n• Disable Brave Shields for this site\n• Use a different browser (Chrome, Firefox, Safari)\n• Try again in private/incognito mode'
      }
      
      throw new Error(friendlyError)
    }
    }
    
    // Set 15-second timeout for Brave compatibility
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Role creation timed out. This might be due to browser blocking. Please try using a different browser or disable privacy shields.'))
      }, 15000) // 15 seconds
    })
    
    try {
      return await Promise.race([
        createRoleWithTimeout(),
        timeoutPromise
      ])
    } catch (error: any) {
      // If it's a timeout, provide Brave-specific guidance
      if (error.message?.includes('timed out')) {
        throw new Error('Role creation timed out. If you\'re using Brave browser, try:\n• Disabling Brave Shields for this site\n• Using Chrome, Firefox, or Safari instead\n• Trying again in private/incognito mode')
      }
      throw error
    }
  }

  const deleteRole = async (roleId: string) => {
    if (!user) throw new Error('No user found')
    
    try {
      // First check if role has evaluation sessions or results
      const { data: sessions, error: sessionsError } = await supabase
        .from('evaluation_sessions')
        .select('id')
        .eq('role_id', roleId)
        .limit(1)

      if (sessionsError) throw sessionsError

      const { data: results, error: resultsError } = await supabase
        .from('evaluation_results') 
        .select('id')
        .eq('role_id', roleId)
        .limit(1)

      if (resultsError) throw resultsError

      // If there are evaluation sessions or results, only soft delete
      if (sessions?.length > 0 || results?.length > 0) {
        console.log('Role has evaluation data - performing soft delete')
        const { error } = await supabase
          .from('roles')
          .update({ is_active: false })
          .eq('id', roleId)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        // No evaluation data - safe to hard delete with cascade
        console.log('Role has no evaluation data - performing hard delete')
        
        // Delete related data in correct order (children first)
        await Promise.all([
          supabase.from('role_skills').delete().eq('role_id', roleId),
          supabase.from('role_questions').delete().eq('role_id', roleId),
          supabase.from('role_education_requirements').delete().eq('role_id', roleId),
          supabase.from('role_experience_requirements').delete().eq('role_id', roleId)
        ])

        // Finally delete the role
        const { error } = await supabase
          .from('roles')
          .delete()
          .eq('id', roleId)
          .eq('user_id', user.id)

        if (error) throw error
      }

      await fetchRoles()
    } catch (err: any) {
      console.error('Role deletion failed:', err)
      throw new Error(`Failed to delete role: ${err.message}`)
    }
  }

  const restoreRole = async (roleId: string) => {
    if (!user) throw new Error('No user found')
    
    try {
      const { error } = await supabase
        .from('roles')
        .update({ is_active: true })
        .eq('id', roleId)
        .eq('user_id', user.id)

      if (error) throw error
      await fetchRoles()
    } catch (err: any) {
      console.error('Role restoration failed:', err)
      throw new Error(`Failed to restore role: ${err.message}`)
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
    restoreRole,
    getRoleById,
    refreshRoles: fetchRoles,
  }
}