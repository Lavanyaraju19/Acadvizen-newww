import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Surface } from '../../components/ui/Surface'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabaseClient'

export function AdminLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, loading, signOut } = useAuth()
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const signInWithRetry = async (payload, retries = 3) => {
    try {
      return await supabase.auth.signInWithPassword(payload)
    } catch (err) {
      const message = err?.message || ''
      if ((err?.name === 'AbortError' || message.includes('signal is aborted')) && retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 800))
        return signInWithRetry(payload, retries - 1)
      }
      throw err
    }
  }

  const manualPasswordSignIn = async (email, password) => {
    const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data?.error_description || data?.msg || 'Unable to sign in.')
    }
    await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    })
    return { user: data.user }
  }

  useEffect(() => {
    if (loading) return
    if (user && profile?.role === 'admin') {
      const redirectTo = location.state?.from?.pathname || '/admin-dashboard'
      navigate(redirectTo, { replace: true })
      return
    }
    if (user && profile && profile.role !== 'admin') {
      setError('This account does not have admin access.')
      signOut()
    }
  }, [loading, user, profile, navigate, location, signOut])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Please enter your admin email and password.')
      return
    }

    try {
      setSubmitting(true)
      const hardTimeout = setTimeout(() => {
        setSubmitting(false)
        setError('Sign-in timed out. Please try again.')
      }, 18000)
      if (!supabaseUrl || !supabaseAnonKey) {
        setError('Supabase env vars missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
        clearTimeout(hardTimeout)
        return
      }

      await supabase.auth.signOut({ scope: 'local' })

      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 8000)
        const health = await fetch(`${supabaseUrl}/auth/v1/health`, {
          headers: { apikey: supabaseAnonKey },
          signal: controller.signal,
        })
        clearTimeout(timeout)
        if (!health.ok) {
          setError('Supabase is unreachable. Please check your internet or Supabase status.')
          clearTimeout(hardTimeout)
          return
        }
      } catch (pingErr) {
        setError('Supabase is unreachable. Please check your internet or Supabase status.')
        clearTimeout(hardTimeout)
        return
      }

      let data
      let error
      try {
        const res = await signInWithRetry({
          email: email.trim(),
          password: password.trim(),
        })
        data = res?.data
        error = res?.error
      } catch (err) {
        // fallback to direct auth call if supabase-js stalls
        try {
          const manual = await manualPasswordSignIn(email.trim(), password.trim())
          data = { user: manual.user }
          error = null
        } catch (manualErr) {
          error = manualErr
        }
      }
      clearTimeout(hardTimeout)
      if (error) {
        setError(error.message || 'Invalid email or password.')
        return
      }

      if (data?.user?.id) {
        const { data: roleData, error: roleError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (roleError || roleData?.role !== 'admin') {
          await supabase.auth.signOut()
          setError('This account does not have admin access.')
          return
        }
        navigate('/admin-dashboard', { replace: true })
        return
      }
      setError('Unable to sign in. Please try again.')
    } catch (err) {
      const message = err?.message || 'Unable to sign in.'
      if (err?.name === 'AbortError' || message.includes('signal is aborted')) {
        setError('Request was interrupted. Please try again; if it persists, restart the dev server.')
        console.warn('[auth] Request aborted during sign-in', err)
      } else if (message.includes('Failed to fetch')) {
        setError('Network error. Unable to reach Supabase. Check your internet and env vars.')
        console.error('[auth] Failed to fetch from Supabase', err)
      } else {
        setError(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <Surface className="w-full max-w-md p-8">
        <h1 className="text-2xl font-semibold text-slate-50">Admin Login</h1>
        <p className="mt-2 text-sm text-slate-400">
          Sign in with your Supabase admin account.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-xs uppercase tracking-[0.2em] text-slate-400">Email</label>
            <input
              id="admin-email"
              name="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-300"
              placeholder="admin@acadvizen.com"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-xs uppercase tracking-[0.2em] text-slate-400">Password</label>
            <input
              id="admin-password"
              name="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-300"
              placeholder="********"
            />
          </div>
          {error && <div className="text-sm text-rose-300">{error}</div>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200 disabled:opacity-70"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </Surface>
    </div>
  )
}





