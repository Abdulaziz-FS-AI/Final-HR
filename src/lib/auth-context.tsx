'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from './supabase-browser'

// Types
interface AuthUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  companyName?: string
  avatarUrl?: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, firstName: string, lastName?: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth Provider Component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  // Derived state
  const isAuthenticated = !!user

  // Clear error helper
  const clearError = () => setError(null)

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing auth...')
        
        // Get current session with enhanced debugging
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          setError('Failed to restore session')
          return
        }

        if (session?.user && mounted) {
          console.log('👤 Existing session found for:', session.user.email)
          console.log('🔑 Session details:', {
            userId: session.user.id,
            email: session.user.email,
            tokenExpiry: new Date(session.expires_at! * 1000),
            tokenPreview: session.access_token.substring(0, 50) + '...'
          })
          
          // Ensure session is fresh and valid
          if (session.expires_at && session.expires_at * 1000 > Date.now()) {
            await loadUserProfile(session.user)
          } else {
            console.log('⚠️ Session expired, refreshing...')
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
            if (refreshError) {
              console.error('Session refresh failed:', refreshError)
              setUser(null)
              setError('Session expired. Please log in again.')
              return
            }
            if (refreshData.session?.user) {
              await loadUserProfile(refreshData.session.user)
            }
          }
        } else {
          console.log('❌ No existing session')
          setUser(null) // Explicitly set to null
        }

      } catch (err) {
        console.error('Auth initialization error:', err)
        setError('Authentication system unavailable')
        setUser(null) // Ensure user is null on error
      } finally {
        if (mounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted || !initialized) return

        console.log('🔄 Auth state change:', event, session?.user?.email || 'No user')

        try {
          switch (event) {
            case 'SIGNED_IN':
              if (session?.user) {
                console.log('✅ User signed in:', session.user.email)
                await loadUserProfile(session.user)
              } else {
                console.log('⚠️ SIGNED_IN event but no user in session')
                setUser(null)
              }
              break
            
            case 'SIGNED_OUT':
              console.log('🚪 User signed out')
              setUser(null)
              setError(null)
              break
            
            case 'TOKEN_REFRESHED':
              console.log('🔄 Token refreshed for:', session?.user?.email)
              if (session?.user) {
                await loadUserProfile(session.user)
              }
              break
              
            default:
              console.log('👀 Unhandled auth event:', event)
          }
        } catch (err) {
          console.error('Auth state change error:', err)
          setError('Authentication state error')
        }

        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [initialized])

  // Load user profile from database
  const loadUserProfile = async (authUser: User) => {
    try {
      console.log('📋 Loading user profile:', authUser.email)
      
      // Try to get existing profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        // Error other than "not found"
        throw profileError
      }

      if (profile) {
        // Profile exists
        console.log('✅ Profile found')
        setUser({
          id: profile.id,
          email: profile.email,
          firstName: profile.first_name || undefined,
          lastName: profile.last_name || undefined,
          companyName: profile.company_name || undefined,
          avatarUrl: profile.avatar_url || undefined,
        })
      } else {
        // Profile doesn't exist, create it
        console.log('📝 Creating new profile')
        await createUserProfile(authUser)
      }

    } catch (err: any) {
      console.error('Profile loading error:', err)
      
      // Fallback: create minimal user from auth data using same logic as createUserProfile
      const fallbackFirstName = authUser.user_metadata?.given_name || 
                               authUser.user_metadata?.first_name ||
                               authUser.user_metadata?.name?.split(' ')[0] ||
                               authUser.user_metadata?.full_name?.split(' ')[0] || 
                               'User'
                               
      const fallbackLastName = authUser.user_metadata?.family_name ||
                              authUser.user_metadata?.last_name ||
                              (authUser.user_metadata?.name && authUser.user_metadata.name.split(' ').length > 1 
                                ? authUser.user_metadata.name.split(' ').slice(1).join(' ')
                                : undefined) ||
                              (authUser.user_metadata?.full_name && authUser.user_metadata.full_name.split(' ').length > 1
                                ? authUser.user_metadata.full_name.split(' ').slice(1).join(' ')
                                : undefined)

      setUser({
        id: authUser.id,
        email: authUser.email || '',
        firstName: fallbackFirstName,
        lastName: fallbackLastName,
        companyName: authUser.user_metadata?.company_name,
        avatarUrl: authUser.user_metadata?.picture || authUser.user_metadata?.avatar_url,
      })
    }
  }

  // Create user profile in database
  const createUserProfile = async (authUser: User) => {
    try {
      // Debug: Log the actual metadata we get from Google
      console.log('🔍 Google metadata received:', {
        full_name: authUser.user_metadata?.full_name,
        name: authUser.user_metadata?.name,
        given_name: authUser.user_metadata?.given_name,
        family_name: authUser.user_metadata?.family_name,
        first_name: authUser.user_metadata?.first_name,
        last_name: authUser.user_metadata?.last_name,
        picture: authUser.user_metadata?.picture,
        avatar_url: authUser.user_metadata?.avatar_url,
        all_metadata: authUser.user_metadata
      })

      // Extract names with proper Google OAuth field mapping
      const firstName = authUser.user_metadata?.given_name || 
                       authUser.user_metadata?.first_name ||
                       authUser.user_metadata?.name?.split(' ')[0] ||
                       authUser.user_metadata?.full_name?.split(' ')[0] || 
                       'User'
                       
      const lastName = authUser.user_metadata?.family_name ||
                      authUser.user_metadata?.last_name ||
                      (authUser.user_metadata?.name && authUser.user_metadata.name.split(' ').length > 1 
                        ? authUser.user_metadata.name.split(' ').slice(1).join(' ')
                        : null) ||
                      (authUser.user_metadata?.full_name && authUser.user_metadata.full_name.split(' ').length > 1
                        ? authUser.user_metadata.full_name.split(' ').slice(1).join(' ')
                        : null)

      const profileData = {
        id: authUser.id,
        email: authUser.email!,
        first_name: firstName,
        last_name: lastName,
        company_name: authUser.user_metadata?.company_name || null,
        avatar_url: authUser.user_metadata?.picture || 
                   authUser.user_metadata?.avatar_url || 
                   null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log('💾 Profile data to save:', profileData)

      const { error: insertError } = await supabase
        .from('users')
        .insert(profileData)

      if (insertError && insertError.code !== '23505') {
        // Error other than duplicate key
        throw insertError
      }

      console.log('✅ Profile created successfully')
      setUser({
        id: profileData.id,
        email: profileData.email,
        firstName: profileData.first_name,
        lastName: profileData.last_name || undefined,
        companyName: profileData.company_name || undefined,
        avatarUrl: profileData.avatar_url || undefined,
      })

    } catch (err: any) {
      console.error('Profile creation error:', err)
      throw new Error('Failed to create user profile')
    }
  }

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setError(null)
      setLoading(true)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        throw error
      }

    } catch (err: any) {
      console.error('Google sign-in error:', err)
      setError('Failed to sign in with Google. Please try again.')
      setLoading(false)
    }
  }

  // Sign in with email
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null)
      setLoading(true)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw error
      }

    } catch (err: any) {
      console.error('Email sign-in error:', err)
      setError(err.message || 'Failed to sign in with email. Please try again.')
      setLoading(false)
    }
  }

  // Sign up with email
  const signUpWithEmail = async (email: string, password: string, firstName: string, lastName?: string) => {
    try {
      setError(null)
      setLoading(true)

      console.log('📝 Creating account for:', email)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName || null,
          }
        }
      })

      if (error) {
        throw error
      }

      if (data.user) {
        console.log('✅ Supabase auth user created:', data.user.id)
        
        // For email signup, we need to create the profile immediately
        // since the user might not get the SIGNED_IN event until email verification
        try {
          await createUserProfile(data.user)
          console.log('✅ User profile created successfully')
          
          // Set user state immediately so they can access the app
          setUser({
            id: data.user.id,
            email: data.user.email!,
            firstName: firstName,
            lastName: lastName || undefined,
          })
        } catch (profileError) {
          console.error('Profile creation failed:', profileError)
          // Continue anyway - the loadUserProfile will handle it later
        }
      }

      // Show success message for email verification
      if (!error && data.user && !data.session) {
        setError('Account created! Please check your email to verify your account before signing in.')
      }
      
    } catch (err: any) {
      console.error('Email sign-up error:', err)
      setError(err.message || 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      setError(null)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }

      setUser(null)
      
    } catch (err: any) {
      console.error('Sign-out error:', err)
      setError('Failed to sign out. Please try again.')
    }
  }

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    clearError,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Auth hook
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}