'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../lib/env'
import { adminApiFetch } from '../lib/adminApiClient'

const LOGIN_TIMEOUT_MS = 18000

export default function AdminLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function signInWithRetry(client, payload, retries = 2) {
    try {
      return await client.auth.signInWithPassword(payload)
    } catch (err) {
      const message = err?.message || ''
      if ((err?.name === 'AbortError' || message.includes('signal is aborted')) && retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 800))
        return signInWithRetry(client, payload, retries - 1)
      }
      throw err
    }
  }

  async function manualPasswordSignIn(emailValue, passwordValue) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !supabase?.auth) {
      throw new Error('Supabase configuration is unavailable. Contact support if this persists.')
    }

    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: emailValue, password: passwordValue }),
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

  const handleLogin = async (event) => {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password.')
      return
    }

    try {
      setLoading(true)
      const client = supabase

      if (!client?.auth || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Supabase configuration is unavailable. Contact support if this persists.')
      }

      const hardTimeout = setTimeout(() => {
        setLoading(false)
        setError('Sign-in timed out. Please try again.')
      }, LOGIN_TIMEOUT_MS)

      await client.auth.signOut({ scope: 'local' })

      let data
      let loginError = null
      try {
        const response = await signInWithRetry(client, {
          email: email.trim(),
          password: password.trim(),
        })
        data = response?.data
        loginError = response?.error || null
      } catch (signInError) {
        try {
          const manual = await manualPasswordSignIn(email.trim(), password.trim())
          data = { user: manual.user }
        } catch (manualError) {
          loginError = manualError
        }
      }

      clearTimeout(hardTimeout)

      if (loginError) {
        setError(loginError.message)
        return
      }

      const user = data?.user
      if (!user?.id) {
        setError('Unable to verify account. Please try again.')
        return
      }

      try {
        await adminApiFetch('/api/admin/session', { method: 'POST' })
      } catch (sessionError) {
        await client.auth.signOut()
        setError(sessionError?.message || 'Access denied: not an admin')
        return
      }

      router.push('/admin')
      router.refresh()
    } catch (e) {
      setError(e?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <h1 className="text-2xl font-semibold text-slate-50">Admin Login</h1>
        <p className="mt-2 text-sm text-slate-400">Sign in with your Supabase admin account.</p>

        <form className="mt-6 space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-slate-400" htmlFor="admin-email">
              Email
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-300"
              placeholder="********"
            />
          </div>
          {error && <div className="text-sm text-rose-300">{error}</div>}
          <button
            type="submit"
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
