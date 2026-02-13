import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { AuthShell } from '../components/ui/AuthShell'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Sign in" subtitle="Access your dashboard">
      <div className="relative">
        <div aria-hidden="true" className="pointer-events-none absolute -inset-6 rounded-3xl bg-gradient-to-r from-teal-400/10 via-sky-400/5 to-indigo-400/10 blur-2xl" />
        <div className="relative">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="peer w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 pb-3 pt-5 text-sm text-slate-100 placeholder:text-transparent outline-none transition focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
              />
              <label
                htmlFor="email"
                className="pointer-events-none absolute left-4 -top-2 rounded bg-[#050b12] px-1 text-xs text-slate-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-teal-200"
              >
                Email
              </label>
            </div>

            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="peer w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 pb-3 pt-5 text-sm text-slate-100 placeholder:text-transparent outline-none transition focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
              />
              <label
                htmlFor="password"
                className="pointer-events-none absolute left-4 -top-2 rounded bg-[#050b12] px-1 text-xs text-slate-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-teal-200"
              >
                Password
              </label>
            </div>

            <div className="flex items-center justify-between">
              <Link
                to="/forgot-password"
                data-cursor="hover"
                className="text-sm font-semibold text-teal-300 hover:text-teal-200 transition-colors"
              >
                Forgot password?
              </Link>
              <Link
                to="/register"
                data-cursor="hover"
                className="text-sm font-semibold text-slate-300 hover:text-slate-100 transition-colors"
              >
                New here? Create an account
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              data-cursor="button"
              className="w-full rounded-xl bg-teal-300 px-4 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5 hover:bg-teal-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Don&apos;t have an account?{' '}
            <Link to="/register" data-cursor="hover" className="font-semibold text-teal-300 hover:text-teal-200">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  )
}
