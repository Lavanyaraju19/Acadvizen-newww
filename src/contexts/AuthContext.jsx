import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { ensureBrowserSupabaseClient, supabase } from '../lib/supabaseClient'
import { canAccessAdminProfile, enrichAdminProfile } from '../../lib/adminPermissions'

const AuthContext = createContext(null)
const AUTH_TIMEOUT_MS = 12000

function isTimeoutLikeError(error) {
  const message = String(error?.message || '').toLowerCase()
  return message.includes('timed out') || error?.name === 'AbortError'
}

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
  const [profileLoading, setProfileLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const inFlightProfileRef = useRef(new Map())
  const supabaseRef = useRef(supabase)

  const getClient = useCallback(async () => {
    const client = supabaseRef.current || await ensureBrowserSupabaseClient()
    if (client) {
      supabaseRef.current = client
    }
    return client
  }, [])

  const fetchProfile = useCallback(async (userId, { silent = false } = {}) => {
    const client = await getClient()
    if (!client || !userId) {
      setProfile(null)
      setProfileLoading(false)
      return null
    }

    const existing = inFlightProfileRef.current.get(userId)
    if (existing) return existing

    const request = (async () => {
      setProfileLoading(true)
      try {
        const { data, error } = await withTimeout(
          client
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle(),
          AUTH_TIMEOUT_MS,
          'Profile lookup timed out.'
        )

        if (error) throw error
        setProfile(enrichAdminProfile(data || null))
        if (!silent) setAuthError('')
        return data || null
      } catch (error) {
        setProfile(null)
        if (!silent) {
          setAuthError(
            isTimeoutLikeError(error)
              ? 'Unable to load your account profile right now. Please retry in a moment.'
              : (error?.message || 'Unable to load account profile.')
          )
        }
        return null
      } finally {
        inFlightProfileRef.current.delete(userId)
        setProfileLoading(false)
      }
    })()

    inFlightProfileRef.current.set(userId, request)
    return request
  }, [getClient])

  useEffect(() => {
    let isMounted = true
    let unsubscribe = null

    const applySession = (session, { silentProfile = false } = {}) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        void fetchProfile(session.user.id, { silent: silentProfile })
      } else {
        setProfile(null)
        setProfileLoading(false)
        setAuthError('')
      }
    }

    const init = async () => {
      try {
        setLoading(true)
        setAuthError('')
        const client = await getClient()
        if (!client) {
          throw new Error('Supabase browser client is unavailable.')
        }
        const {
          data: { session },
        } = await withTimeout(
          client.auth.getSession(),
          AUTH_TIMEOUT_MS,
          'Session initialization timed out.'
        )
        if (!isMounted) return
        applySession(session, { silentProfile: true })

        const { data } = client.auth.onAuthStateChange(async (_event, nextSession) => {
          try {
            setLoading(true)
            applySession(nextSession, { silentProfile: true })
          } catch (err) {
            if (isMounted) {
              setUser(null)
              setProfile(null)
              setProfileLoading(false)
              setAuthError(err?.message || 'Unable to refresh authentication state.')
            }
          } finally {
            if (isMounted) setLoading(false)
          }
        })

        unsubscribe = () => {
          data?.subscription?.unsubscribe()
        }
      } catch (err) {
        if (isMounted) {
          setUser(null)
          setProfile(null)
          setProfileLoading(false)
          setAuthError(err?.message || 'Unable to initialize authentication.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    init()

    return () => {
      isMounted = false
      unsubscribe?.()
    }
  }, [fetchProfile, getClient])

  async function signUp(email, password, fullName) {
    const client = await getClient()
    if (!client?.auth) throw new Error('Supabase browser client is unavailable.')

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
    return data
  }

  async function signIn(email, password) {
    const client = await getClient()
    if (!client?.auth) throw new Error('Supabase browser client is unavailable.')

    const { data, error } = await client.auth.signInWithPassword({ email, password })
    if (error) throw error
    setUser(data?.user ?? null)
    await fetchProfile(data.user.id, { silent: true })
    return data
  }

  async function signOut(scope = 'global') {
    const client = await getClient()
    if (!client?.auth) throw new Error('Supabase browser client is unavailable.')

    const { error } = await client.auth.signOut({ scope })
    if (error && scope !== 'local') {
      await client.auth.signOut({ scope: 'local' })
    }
    setUser(null)
    setProfile(null)
    setAuthError('')
    if (error && scope === 'local') throw error
  }

  async function resetPassword(email) {
    const client = await getClient()
    if (!client?.auth) throw new Error('Supabase browser client is unavailable.')

    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  const value = {
    user,
    profile,
    loading,
    profileLoading,
    authError,
    refreshProfile: fetchProfile,
    signUp,
    signIn,
    signOut,
    resetPassword,
    isAdmin: profile?.is_full_admin === true,
    canAccessAdmin: canAccessAdminProfile(profile),
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
