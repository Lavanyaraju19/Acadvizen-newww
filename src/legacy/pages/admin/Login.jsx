import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Surface } from '../../../components/ui/Surface'
import { useAuth } from '../../../contexts/AuthContext'
import { ensureBrowserSupabaseClient, ensureBrowserSupabaseConfig } from '../../../lib/supabaseClient'
import { signInAdminWithPassword } from '../../../../lib/adminAuthClient'
import { canAccessAdminProfile } from '../../../../lib/adminPermissions'

export function AdminLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, loading, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (loading) return
    if (user && canAccessAdminProfile(profile)) {
      const redirectTo = location.state?.from?.pathname || '/admin'
      navigate(redirectTo, { replace: true })
      return
    }
    if (user && profile && !canAccessAdminProfile(profile)) {
      setError('This account does not have admin access.')
      signOut()
    }
  }, [loading, user, profile, navigate, location, signOut])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    let hardTimeout = null

    if (!email.trim() || !password.trim()) {
      setError('Please enter your admin email and password.')
      return
    }

    try {
      setSubmitting(true)
      const config = await ensureBrowserSupabaseConfig()
      const client = config ? await ensureBrowserSupabaseClient() : null
      hardTimeout = setTimeout(() => {
        setSubmitting(false)
        setError('Sign-in timed out. Please try again.')
      }, 18000)

      if (!client?.auth || !config?.url || !config?.anonKey) {
        setError('Supabase configuration is unavailable. Contact support if this persists.')
        clearTimeout(hardTimeout)
        return
      }

      const result = await signInAdminWithPassword(email, password)
      clearTimeout(hardTimeout)
      if (result?.user?.id) {
        navigate('/admin', { replace: true })
        return
      }
      setError('Unable to sign in. Please try again.')
    } catch (err) {
      const message = err?.message || 'Unable to sign in.'
      if (err?.name === 'AbortError' || message.includes('signal is aborted')) {
        setError('Request was interrupted. Please try again; if it persists, restart the dev server.')
      } else if (message.includes('Failed to fetch')) {
        setError('Network error. Unable to reach the login service. Check your connection and try again.')
      } else {
        setError(message)
      }
    } finally {
      if (hardTimeout) clearTimeout(hardTimeout)
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






export default AdminLogin


