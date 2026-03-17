import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthShell } from '../../components/ui/AuthShell'
import { supabase } from '../../lib/supabaseClient'
import { trackLead } from '../../../lib/metaPixel'

export function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phone: '',
    learningMode: 'online',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    setLoading(true)
    try {
      await supabase.from('registrations').insert([
        {
          full_name: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          learning_mode: formData.learningMode,
          page: '/register',
        },
      ])
      trackLead(
        {
          content_name: 'Register Page Form',
          content_category: formData.learningMode,
          page_path: '/register',
        },
        `register-page:${formData.email.trim().toLowerCase()}`
      )
      navigate('/login', { state: { message: 'Registration successful! We will contact you soon.' } })
    } catch (err) {
      setError(err.message || 'Failed to register')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Secure Your Spot">
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
                id="fullName"
                name="full_name"
                type="text"
                required
                placeholder=" "
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="peer w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 pb-3 pt-5 text-sm text-slate-100 placeholder:text-transparent outline-none transition focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
              />
              <label
                htmlFor="fullName"
                className="pointer-events-none absolute left-4 -top-2 rounded bg-[#050b12] px-1 text-xs text-slate-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-teal-200"
              >
                Full Name
              </label>
            </div>

            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder=" "
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder=" "
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="peer w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 pb-3 pt-5 text-sm text-slate-100 placeholder:text-transparent outline-none transition focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
              />
              <label
                htmlFor="phone"
                className="pointer-events-none absolute left-4 -top-2 rounded bg-[#050b12] px-1 text-xs text-slate-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-teal-200"
              >
                Phone Number
              </label>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Learning Mode</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {[
                  { label: 'Online', value: 'online' },
                  { label: 'Offline', value: 'offline' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 transition-colors hover:border-teal-300/40"
                  >
                    <input
                      type="radio"
                      name="learningMode"
                      id={`learningMode-${option.value}`}
                      value={option.value}
                      checked={formData.learningMode === option.value}
                      onChange={(e) => setFormData({ ...formData, learningMode: e.target.value })}
                      className="h-4 w-4 accent-teal-300"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              data-cursor="button"
              className="w-full rounded-xl bg-teal-300 px-4 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5 hover:bg-teal-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" data-cursor="hover" className="font-semibold text-teal-300 hover:text-teal-200">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  )
}

export default RegisterPage


