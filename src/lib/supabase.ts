'use client'

import { createBrowserClient, createClient } from '@supabase/ssr'
import { Database } from '@/types/database-generated'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Singleton pattern to prevent multiple instances
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

function createSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  supabaseInstance = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name) => {
        if (typeof window === 'undefined') return undefined
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop()?.split(';').shift()
        return undefined
      },
      set: (name, value, options) => {
        if (typeof window === 'undefined') return
        document.cookie = `${name}=${value}; path=/; ${options?.maxAge ? `max-age=${options.maxAge};` : ''} ${options?.secure ? 'secure;' : ''} ${options?.sameSite ? `samesite=${options.sameSite};` : ''}`
      },
      remove: (name, options) => {
        if (typeof window === 'undefined') return
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${options?.secure ? 'secure;' : ''} ${options?.sameSite ? `samesite=${options.sameSite};` : ''}`
      },
    },
  })

  return supabaseInstance
}

export const supabase = createSupabaseClient()

// Admin client for server-side operations
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!serviceRoleKey) {
    throw new Error('Missing Supabase service role key')
  }
  
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}