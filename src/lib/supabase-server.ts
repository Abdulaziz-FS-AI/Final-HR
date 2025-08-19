import { createServerClient as createSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database-generated'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Server-side Supabase client that reads cookies (modern SSR approach)
export async function createServerClient() {
  const cookieStore = await cookies()
  
  return createSSRClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set(name, value, options)
        } catch {
          // The set method is available in middleware but not in Server Components
          // This is expected behavior
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.delete(name)
        } catch {
          // The remove method is available in middleware but not in Server Components
          // This is expected behavior  
        }
      },
    },
  })
}