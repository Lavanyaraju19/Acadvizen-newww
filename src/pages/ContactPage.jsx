import { useState } from 'react'
import { motion } from 'framer-motion'

export function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    // In production, integrate with email service or Supabase Edge Function
    console.log('Contact form submitted:', formData)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 5000)
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-8 md:p-12"
        >
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-50 mb-6">Contact Us</h1>
          {submitted ? (
            <div className="p-4 rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
              Thank you for your message! We'll get back to you soon.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-200 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-200 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={6}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-teal-300 px-6 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5 hover:bg-teal-200"
              >
                Send Message
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}
