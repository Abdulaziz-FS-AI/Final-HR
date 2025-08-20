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
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
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

      if (error) throw error
      
      setRoles(data || [])
      
    } catch (err: any) {
      setError(err.message)
      setRoles([])
    } finally {
      setLoading(false)
    }
  }, [user])

  const createRole = async (roleData: RoleFormData) => {
    // Validation
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
      // Create role with simplified error handling
      const { data: roleResult, error: roleError } = await supabase
        .from('roles')
        .insert(transformedData.roleData)
        .select()
        .single()
      
      if (roleError) {
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