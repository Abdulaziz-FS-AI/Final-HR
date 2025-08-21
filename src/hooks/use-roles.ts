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
      
      // Debug: Log the user ID being used
      console.log('🔍 IMPORTANT: Currently logged in as:')
      console.log('   Email:', user.email)
      console.log('   User ID:', user.id)
      console.log('-----------------------------------')
      
      // Get session info
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        console.log('✅ Session confirmed for:', session.user.email)
        
        // Show which roles belong to which account
        console.log('📋 Role ownership:')
        console.log('   abdulaziz.fs.ai@gmail.com has role with user_id: 632687b6-01e7-4a5e-9230-95e5d3a7540c')
        console.log('   abdulaziz747uni@gmail.com has role with user_id: 1fb0a5c4-951d-43bd-8a76-489bf38daa62')
      }
      
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
    // Validation
    console.log('🔐 Current auth state:', { 
      hasUser: !!user, 
      userId: user?.id,
      userEmail: user?.email 
    })
    
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
      // Debug: Check auth state before insert
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔒 Auth check before insert:', {
        hasSession: !!session,
        sessionUserId: session?.user?.id,
        sessionEmail: session?.user?.email,
        tokenValid: session?.expires_at ? new Date(session.expires_at * 1000) > new Date() : false
      })
      
      // Debug: Log the data being inserted
      console.log('📤 Attempting to insert role with data:', transformedData.roleData)
      
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
      
      // Step 2: Insert skills in parallel
      const insertPromises: Promise<any>[] = []
      
      if (transformedData.skillsData?.length > 0) {
        const skillsWithRoleId = transformedData.skillsData.map(skill => ({
          ...skill,
          role_id: createdRoleId
        }))
        insertPromises.push(
          supabase.from('role_skills').insert(skillsWithRoleId)
        )
      }
      
      if (transformedData.questionsData?.length > 0) {
        const questionsWithRoleId = transformedData.questionsData.map(question => ({
          ...question,
          role_id: createdRoleId
        }))
        insertPromises.push(
          supabase.from('role_questions').insert(questionsWithRoleId)
        )
      }
      
      if (transformedData.educationData?.length > 0) {
        const educationWithRoleId = transformedData.educationData.map(edu => ({
          ...edu,
          role_id: createdRoleId
        }))
        insertPromises.push(
          supabase.from('role_education_requirements').insert(educationWithRoleId)
        )
      }
      
      if (transformedData.experienceData?.length > 0) {
        const experienceWithRoleId = transformedData.experienceData.map(exp => ({
          ...exp,
          role_id: createdRoleId
        }))
        insertPromises.push(
          supabase.from('role_experience_requirements').insert(experienceWithRoleId)
        )
      }
      
      // Execute all inserts in parallel
      if (insertPromises.length > 0) {
        await Promise.all(insertPromises)
      }

      // Refresh roles list
      await fetchRoles()
      
      // Return the created role ID
      return { id: createdRoleId! }

    } catch (error: any) {
      // Cleanup if role was partially created
      if (createdRoleId) {
        await supabase
          .from('roles')
          .delete()
          .eq('id', createdRoleId)
          .catch(() => {}) // Ignore cleanup errors
      }
      
      // Report error
      reportError(error?.message || 'Role creation failed', 'high')
      
      // Throw user-friendly error
      throw new Error(getUserFriendlyError(error))
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