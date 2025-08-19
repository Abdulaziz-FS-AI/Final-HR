'use client'

import { supabase } from './supabase-browser'

/**
 * Enhanced Supabase client with explicit auth token management
 * Use this when RLS policies are strict about auth context
 */
export async function createAuthenticatedClient() {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session) {
    throw new Error('No authenticated session found')
  }
  
  // Create a client with explicit auth headers
  return {
    from: (table: string) => ({
      insert: async (data: any) => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(data)
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw error
        }
        
        const result = await response.json()
        return { data: result, error: null }
      },
      select: (columns = '*') => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}?select=${columns}&${column}=eq.${value}&limit=1`,
              {
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                }
              }
            )
            
            if (!response.ok) {
              const error = await response.json()
              throw error
            }
            
            const result = await response.json()
            return { data: result[0] || null, error: null }
          }
        })
      })
    })
  }
}