'use client'

import { useState } from 'react'
import { trackLead } from '../../../lib/metaPixel'

// Inline lead-capture form for the Immersive course/location templates. Posts to the same
// /api/cms/leads endpoint and payload shape as components/sections/LeadFormSection.jsx (the
// generic Page Builder lead-form block) so both paths land in the one real Admin > Leads list -
// this is a separate component only because LeadFormSection renders its own outer <section>,
// which would double-wrap inside SectionFrame here.
export default function LeadCaptureCard({ pageSlug = '', formType = 'inquiry' }) {
  const [status, setStatus] = useState({ kind: '', text: '' })
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' })

  async function submit(event) {
    event.preventDefault()
    if (!form.full_name.trim() && !form.email.trim() && !form.phone.trim()) {
      setStatus({ kind: 'error', text: 'Please add at least name, email, or phone.' })
      return
    }
    setSaving(true)
    setStatus({ kind: '', text: '' })
    try {
      const res = await fetch('/api/cms/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          page_slug: pageSlug,
          source: 'website',
          form_type: formType,
        }),
      })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || 'Failed to submit form.')
      setForm({ full_name: '', email: '', phone: '' })
      trackLead({ content_name: 'Lead Capture Card', form_type: formType, page_slug: pageSlug }, `lead-capture:${pageSlug || 'unknown'}:${formType}`)
      setStatus({ kind: 'success', text: 'Thanks - our admissions team will reach out shortly.' })
    } catch (error) {
      setStatus({ kind: 'error', text: error?.message || 'Unable to submit right now. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="immersive-glass-strong mx-auto max-w-2xl rounded-3xl p-6 sm:p-8">
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <input
          id="immersive-lead-name"
          name="full_name"
          value={form.full_name}
          onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
          placeholder="Your name"
          disabled={saving}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
        />
        <input
          id="immersive-lead-email"
          name="email"
          type="email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          placeholder="Email"
          disabled={saving}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
        />
        <input
          id="immersive-lead-phone"
          name="phone"
          value={form.phone}
          onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
          placeholder="Phone number"
          disabled={saving}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 sm:col-span-2"
        />
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-full bg-teal-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-200 disabled:opacity-60 sm:col-span-2"
        >
          {saving ? 'Submitting...' : 'Request a Callback'}
        </button>
      </form>
      {status.text ? (
        <p className={`mt-3 text-center text-sm ${status.kind === 'error' ? 'text-rose-300' : 'text-emerald-300'}`}>{status.text}</p>
      ) : null}
    </div>
  )
}
