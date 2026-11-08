// @ts-nocheck
import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured, checkSupabaseConfigured } from '@/integrations/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

export type UserProfile = {
  id: string
  display_name: string | null
  created_at?: string
  updated_at?: string
}

export function formatAuthError(err: any): string {
  if (!err) return 'Authentication failed.'
  const rawMsg =
    typeof err === 'string'
      ? err
      : err.message || err.error_description || err.error || JSON.stringify(err)

  if (
    rawMsg.includes('provider is not enabled') ||
    rawMsg.includes('Unsupported provider') ||
    rawMsg.includes('provider_not_found')
  ) {
    return 'Google Sign-In is not enabled in your Supabase project. Please enable Google under Authentication → Providers in your Supabase dashboard.'
  }

  if (rawMsg.includes('popup_closed') || rawMsg.includes('access_denied')) {
    return 'Sign-in window was closed or access was denied.'
  }

  if (rawMsg.includes('invalid_credentials') || rawMsg.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials.'
  }

  if (rawMsg.length <= 2) {
    return 'Unable to connect to Google authentication service. Please check your Supabase configuration or sign in with email.'
  }

  return rawMsg
}

type AuthContextType = {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  isGuest: boolean
  isCloudConfigured: boolean
  authModalOpen: boolean
  authModalMode: 'signin' | 'signup'
  authNotification: string | null
  clearAuthNotification: () => void
  openSignIn: () => void
  openSignUp: () => void
  closeAuthModal: () => void
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null; needsEmailConfirmation?: boolean }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signOut: () => Promise<{ error: Error | null }>
  continueAsGuest: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin')
  const [authNotification, setAuthNotification] = useState<string | null>(null)
  const [isGuest, setIsGuest] = useState(false)

  // Load user profile from Supabase
  const loadProfile = async (userId: string) => {
    if (!checkSupabaseConfigured()) return
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (!error && data) {
        setProfile(data as UserProfile)
      } else {
        // Fallback profile if record not found
        const metadata = user?.user_metadata
        setProfile({
          id: userId,
          display_name: metadata?.full_name || metadata?.name || user?.email?.split('@')[0] || 'Learner',
        })
      }
    } catch (e) {
      console.warn('Error loading user profile:', e)
    }
  }

  useEffect(() => {
    // If Supabase credentials are not configured, smoothly boot in Guest Mode
    if (!checkSupabaseConfigured()) {
      console.info('[Cognify] Supabase is not configured. Running in Guest Mode with local storage persistence.');
      setIsGuest(true)
      setLoading(false)
      return
    }

    // Check for OAuth errors in the redirect URL
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      const search = window.location.search
      const searchParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : search)
      const errorDesc = searchParams.get('error_description') || searchParams.get('error')

      if (errorDesc) {
        const friendly = formatAuthError(decodeURIComponent(errorDesc))
        setAuthNotification(friendly)
        window.history.replaceState(null, '', window.location.pathname)
      }
    }

    // Check initial active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      }
      setLoading(false)
    }).catch(() => {
      setIsGuest(true)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        setIsGuest(false)
        await loadProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription?.unsubscribe?.()
    }
  }, [])

  const openSignIn = () => {
    setAuthModalMode('signin')
    setAuthModalOpen(true)
  }

  const openSignUp = () => {
    setAuthModalMode('signup')
    setAuthModalOpen(true)
  }

  const closeAuthModal = () => {
    setAuthModalOpen(false)
  }

  const continueAsGuest = () => {
    setIsGuest(true)
    setAuthModalOpen(false)
  }

  const clearAuthNotification = () => {
    setAuthNotification(null)
  }

  const signInWithEmail = async (email: string, password: string) => {
    if (!checkSupabaseConfigured()) {
      return { error: new Error('Supabase authentication is not configured for this deployment. Cognify is running in Guest Mode with local storage persistence.') }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) return { error: new Error(formatAuthError(error)) }
      setUser(data.user)
      setSession(data.session)
      setIsGuest(false)
      if (data.user) {
        await loadProfile(data.user.id)
      }
      closeAuthModal()
      return { error: null }
    } catch (err: any) {
      return { error: new Error(formatAuthError(err)) }
    }
  }

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    if (!checkSupabaseConfigured()) {
      return { error: new Error('Supabase authentication is not configured for this deployment. Cognify is running in Guest Mode with local storage persistence.') }
    }

    try {
      const cleanName = displayName?.trim() || email.split('@')[0]
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: cleanName,
            name: cleanName,
          },
        },
      })
      if (error) return { error: new Error(formatAuthError(error)) }

      if (data.session) {
        setIsGuest(false)
      }

      if (data.user) {
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            display_name: cleanName,
            updated_at: new Date().toISOString(),
          })
          await loadProfile(data.user.id)
        } catch {
          // Profile trigger may handle this
        }
      }

      const needsConfirmation = !data.session
      if (!needsConfirmation) {
        closeAuthModal()
      }
      return { error: null, needsEmailConfirmation: needsConfirmation }
    } catch (err: any) {
      return { error: new Error(formatAuthError(err)) }
    }
  }

  const signInWithGoogle = async () => {
    if (!checkSupabaseConfigured()) {
      return { error: new Error('Supabase authentication is not configured for this deployment. Cognify is running in Guest Mode with local storage persistence.') }
    }

    try {
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}${window.location.pathname}`
          : undefined

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      })

      if (error) {
        return { error: new Error(formatAuthError(error)) }
      }
      return { error: null }
    } catch (err: any) {
      return { error: new Error(formatAuthError(err)) }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setSession(null)
      setIsGuest(false)
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('cognify_onboarding_draft')
      }
      return { error: error ? new Error(formatAuthError(error)) : null }
    } catch (err: any) {
      setUser(null)
      setProfile(null)
      setSession(null)
      setIsGuest(false)
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('cognify_onboarding_draft')
      }
      return { error: new Error(formatAuthError(err)) }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isGuest,
        isCloudConfigured: checkSupabaseConfigured(),
        loading,
        authModalOpen,
        authModalMode,
        authNotification,
        clearAuthNotification,
        openSignIn,
        openSignUp,
        closeAuthModal,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        continueAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
