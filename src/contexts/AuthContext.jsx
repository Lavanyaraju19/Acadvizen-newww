import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)
const AUTH_TIMEOUT_MS = 12000

function withTimeout(promise, timeoutMs, label) {
  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(label)), timeoutMs)
  })

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId)
  })
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  async function fetchProfile(userId, { silent = false } = {}) {
    if (!supabase || !userId) {
      setProfile(null)
      return null
    }

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(),
        AUTH_TIMEOUT_MS,
        'Profile lookup timed out.'
      )

      if (error) throw error
      setProfile(data || null)
      if (!silent) setAuthError('')
      return data || null
    } catch (error) {
      setProfile(null)
      if (!silent) setAuthError(error?.message || 'Unable to load account profile.')
      return null
    }
  }

  useEffect(() => {
    let isMounted = true
    if (!supabase) {
      setAuthError('Supabase browser client is unavailable.')
      setLoading(false)
      return () => {
        isMounted = false
      }
    }

    const applySession = async (session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setAuthError('')
      }
    }

    const init = async () => {
      try {
        setLoading(true)
        setAuthError('')
        const {
          data: { session },
        } = await withTimeout(
          supabase.auth.getSession(),
          AUTH_TIMEOUT_MS,
          'Session initialization timed out.'
        )
        if (!isMounted) return
        await applySession(session)
      } catch (err) {
        if (isMounted) {
          setUser(null)
          setProfile(null)
          setAuthError(err?.message || 'Unable to initialize authentication.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        setLoading(true)
        await applySession(session)
      } catch (err) {
        if (isMounted) {
          setUser(null)
          setProfile(null)
          setAuthError(err?.message || 'Unable to refresh authentication state.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
    return data
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    setUser(data?.user ?? null)
    await fetchProfile(data.user.id)
    return data
  }

  async function signOut(scope = 'global') {
    const { error } = await supabase.auth.signOut({ scope })
    if (error && scope !== 'local') {
      await supabase.auth.signOut({ scope: 'local' })
    }
    setUser(null)
    setProfile(null)
    setAuthError('')
    if (error && scope === 'local') throw error
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  const value = {
    user,
    profile,
    loading,
    authError,
    refreshProfile: fetchProfile,
    signUp,
    signIn,
    signOut,
    resetPassword,
    isAdmin: profile?.role === 'admin',
    isStudent: profile?.role === 'student',
    isSales: profile?.role === 'sales',
    isApproved: profile?.approval_status === 'approved',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
