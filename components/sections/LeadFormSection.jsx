'use client'

import { useState } from 'react'
import { trackLead, trackContact } from '../../lib/metaPixel'
import {
  bodyClass,
  headingClass,
  normalizeContent,
  normalizeStyle,
  safeString,
  sectionAlignClass,
  sectionInlineStyle,
  sectionPaddingClass,
  sectionVisibilityClass,
} from './sectionUtils'

export default function LeadFormSection({ section }) {
  const content = normalizeContent(section)
  const style = normalizeStyle(section)
  const [status, setStatus] = useState({ kind: '', text: '' })
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    message: '',
  })

  async function submit(event) {
    event.preventDefault()
    if (!form.full_name.trim() && !form.email.trim() && !form.phone.trim()) {
      setStatus({
        kind: 'error',
        text: safeString(content.validation_message, 'Please add at least name, email, or phone.'),
      })
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
          page_slug: content.page_slug || '',
          source: content.source || 'website',
          form_type: content.form_type || 'inquiry',
          payload: { message: form.message },
        }),
      })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || 'Failed to submit form.')
      setForm({ full_name: '', email: '', phone: '', message: '' })
      trackLead(
        {
          content_name: safeString(content.heading, 'Lead Form'),
          form_type: safeString(content.form_type, 'inquiry'),
          page_slug: safeString(content.page_slug, ''),
        },
        `lead-form:${safeString(content.page_slug, 'unknown')}:${safeString(content.form_type, 'inquiry')}`
      )
      if (/contact/i.test(safeString(content.form_type, '')) || /contact/i.test(safeString(content.source, ''))) {
        trackContact(
          {
            content_name: safeString(content.heading, 'Contact Form'),
            page_slug: safeString(content.page_slug, ''),
          },
          `contact-form:${safeString(content.page_slug, 'unknown')}`
        )
      }
      setStatus({
        kind: 'success',
        text: safeString(content.success_message, 'Thanks, our team will contact you shortly.'),
      })
    } catch (error) {
      setStatus({
        kind: 'error',
        text: error?.message || safeString(content.error_message, 'Unable to submit form right now.'),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={`${sectionPaddingClass(content, style)} ${sectionVisibilityClass(content)}`} style={sectionInlineStyle(content, style)}>
      <div className={`mx-auto max-w-3xl rounded-3xl border border-white/10 bg-[var(--section-card-bg,rgba(255,255,255,0.03))] px-5 py-7 sm:px-8 ${sectionAlignClass(content, style)}`}>
        {content.heading ? <h2 className={`font-semibold text-slate-50 ${headingClass(style)}`}>{safeString(content.heading)}</h2> : null}
        {content.text ? <p className={`mt-2 whitespace-pre-line text-slate-300 ${bodyClass(style)}`}>{safeString(content.text)}</p> : null}

        <form onSubmit={submit} className="mt-5 grid gap-3 md:grid-cols-2">
          <input
            id="lead-full-name"
            name="full_name"
            value={form.full_name}
            onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
            placeholder={safeString(content.name_label, 'Your name')}
            disabled={saving}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400"
          />
          <input
            id="lead-email"
            name="email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder={safeString(content.email_label, 'Email')}
            disabled={saving}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400"
          />
          <input
            id="lead-phone"
            name="phone"
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            placeholder={safeString(content.phone_label, 'Phone number')}
            disabled={saving}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 md:col-span-2"
          />
          <textarea
            id="lead-message"
            name="message"
            rows={4}
            value={form.message}
            onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
            placeholder={safeString(content.message_label, 'How can we help you?')}
            disabled={saving}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 md:col-span-2"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-[var(--section-btn-radius,0.75rem)] border border-[var(--section-btn-border,transparent)] bg-[var(--section-btn-bg,#5eead4)] px-5 py-3 text-sm font-semibold text-[var(--section-btn-text,#020617)] md:col-span-2"
          >
            {saving ? safeString(content.submitting_label, 'Submitting...') : safeString(content.submit_label, 'Submit')}
          </button>
        </form>

        {status.text ? (
          <p className={`mt-3 text-sm ${status.kind === 'error' ? 'text-rose-300' : 'text-emerald-300'}`}>
            {status.text}
          </p>
        ) : null}
      </div>
    </section>
  )
}
