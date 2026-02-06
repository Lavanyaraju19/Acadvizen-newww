import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { AuthShell } from '../components/ui/AuthShell'

export function RegisterPage() {
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { Register } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signUp(formData.email, formData.password, formData.fullName)
      navigate('/login', { state: { message: 'Registration successful! Please check your email to verify your account.' } })
    } catch (err) {
      setError(err.message || 'Failed to register')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Create account" subtitle="Join Acadvizen today">
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-slate-200 mb-2">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
          />
          <p className="mt-2 text-xs text-slate-500">Minimum 6 characters</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          data-cursor="button"
          className="w-full rounded-xl bg-teal-300 px-4 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5 hover:bg-teal-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating account…' : 'Sign up'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link to="/login" data-cursor="hover" className="font-semibold text-teal-300 hover:text-teal-200">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
