'use client'

import { useState, useEffect } from 'react'
import { supabase } from "@/lib/supabase"
import { EvaluationResult, EvaluationResultWithDetails } from '@/types'
import { useAuth } from '@/lib/auth-context'

export function useEvaluations(roleId?: string, sessionId?: string) {
  const [evaluations, setEvaluations] = useState<EvaluationResultWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchEvaluations = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      let query = supabase
        .from('evaluation_results')
        .select(`
          *,
          file:file_uploads(*),
          role:roles(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Apply filters if provided
      if (roleId) {
        query = query.eq('role_id', roleId)
      }
      
      if (sessionId) {
        query = query.eq('session_id', sessionId)
      }

      const { data, error } = await query

      if (error) throw error
      setEvaluations(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getEvaluationById = async (evaluationId: string): Promise<EvaluationResultWithDetails | null> => {
    try {
      const { data, error } = await supabase
        .from('evaluation_results')
        .select(`
          *,
          file:file_uploads(*),
          role:roles(*)
        `)
        .eq('id', evaluationId)
        .eq('user_id', user?.id || '')
        .single()

      if (error) throw error
      return data
    } catch (err: any) {
      console.error('Error fetching evaluation:', err)
      return null
    }
  }

  const deleteEvaluation = async (evaluationId: string) => {
    if (!user) throw new Error('No user found')
    
    try {
      const { error } = await supabase
        .from('evaluation_results')
        .delete()
        .eq('id', evaluationId)
        .eq('user_id', user.id)

      if (error) throw error
      await fetchEvaluations()
    } catch (err: any) {
      throw new Error(err.message)
    }
  }

  const triggerEvaluation = async (fileId: string, roleId: string) => {
    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'single',
          fileId,
          roleId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to trigger evaluation')
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Evaluation failed')
      }

      // Refresh evaluations
      await fetchEvaluations()
      return result.data

    } catch (err: any) {
      throw new Error(err.message)
    }
  }

  const triggerBatchEvaluation = async (sessionId: string, roleId: string) => {
    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'batch',
          sessionId,
          roleId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to trigger batch evaluation')
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Batch evaluation failed')
      }

      // Refresh evaluations
      await fetchEvaluations()
      return result.data

    } catch (err: any) {
      throw new Error(err.message)
    }
  }

  const processQueue = async () => {
    try {
      const response = await fetch('/api/process-queue', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to process queue')
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Queue processing failed')
      }

      // Refresh evaluations after processing
      await fetchEvaluations()
      return result

    } catch (err: any) {
      throw new Error(err.message)
    }
  }

  // Real-time subscriptions for evaluation updates
  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel('evaluation_results')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'evaluation_results',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchEvaluations()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  useEffect(() => {
    fetchEvaluations()
  }, [user, roleId, sessionId])

  return {
    evaluations,
    loading,
    error,
    getEvaluationById,
    deleteEvaluation,
    triggerEvaluation,
    triggerBatchEvaluation,
    processQueue,
    refreshEvaluations: fetchEvaluations,
  }
}