'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

export default function AdminLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function getSupabaseForLogin() {
    if (supabase?.auth) return supabase

    const response = await fetch('/api/public-config', { cache: 'no-store' })
    const payload = await response.json()
    const url = payload?.data?.url
    const anonKey = payload?.data?.anonKey

    if (!url || !anonKey) {
      throw new Error(
        'Supabase configuration missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY and restart the server.'
      )
    }

    return createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {},
      },
    })
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
      const client = await getSupabaseForLogin()
      const { data, error: loginError } = await client.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })

      if (loginError) {
        setError(loginError.message)
        return
      }

      const user = data?.user
      if (!user?.id) {
        setError('Unable to verify account. Please try again.')
        return
      }

      const { data: profile, error: profileError } = await client
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || profile?.role !== 'admin') {
        setError('Access denied: not an admin')
        await client.auth.signOut()
        return
      }

      await fetch('/api/admin/session', { method: 'POST' })
      router.push('/admin-dashboard')
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
