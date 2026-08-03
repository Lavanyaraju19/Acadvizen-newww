'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ensureBrowserSupabaseClient, ensureBrowserSupabaseConfig } from '../lib/supabaseClient'
import { signInAdminWithPassword } from '../lib/adminAuthClient'

const LOGIN_TIMEOUT_MS = 18000

export default function AdminLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (event) => {
    event.preventDefault()
    setError('')
    let hardTimeout = null

    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password.')
      return
    }

    try {
      setLoading(true)
      const config = await ensureBrowserSupabaseConfig()
      const client = config ? await ensureBrowserSupabaseClient() : null

      if (!client?.auth || !config?.url || !config?.anonKey) {
        throw new Error('Supabase configuration is unavailable. Contact support if this persists.')
      }

      hardTimeout = setTimeout(() => {
        setLoading(false)
        setError('Sign-in timed out. Please try again.')
      }, LOGIN_TIMEOUT_MS)

      const result = await signInAdminWithPassword(email, password)
      clearTimeout(hardTimeout)
      const user = result?.user
      if (!user?.id) {
        setError('Unable to verify account. Please try again.')
        return
      }

      router.push('/admin')
      router.refresh()
    } catch (e) {
      setError(e?.message || 'Login failed. Please try again.')
    } finally {
      if (hardTimeout) clearTimeout(hardTimeout)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <h1 className="text-2xl font-semibold text-slate-50">Admin Login</h1>
        <p className="mt-2 text-sm text-slate-400">Sign in with your Supabase admin account.</p>

        <form className="mt-6 space-y-4" onSubmit={handleLogin} data-testid="admin-login-form">
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-slate-400" htmlFor="admin-email">
              Email
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              data-testid="admin-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-300"
              placeholder="operation@acadvizen.com"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-slate-400" htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              data-testid="admin-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-300"
              placeholder="********"
            />
          </div>
          {error && <div className="text-sm text-rose-300">{error}</div>}
          <button
            type="submit"
            data-testid="admin-login-submit"
            disabled={loading}
            className="w-full rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200 disabled:opacity-70"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
