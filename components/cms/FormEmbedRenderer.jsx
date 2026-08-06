'use client'

import { useEffect, useRef, useState } from 'react'
import { evaluateFieldCondition } from '../../lib/formConditional'

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''

function fieldWidthClass(field) {
  return field?.styling?.width === 'half' ? '' : 'md:col-span-2'
}

function isFieldVisible(field, values) {
  return evaluateFieldCondition(field?.conditional, values)
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error || new Error('Could not read the selected file.'))
    reader.readAsDataURL(file)
  })
}

export default function FormEmbedRenderer({ formId, heading, text }) {
  const [form, setForm] = useState(null)
  const [values, setValues] = useState({})
  const [status, setStatus] = useState({ kind: '', text: '' })
  const [saving, setSaving] = useState(false)
  const [recaptchaReady, setRecaptchaReady] = useState(false)
  const recaptchaWidgetId = useRef(null)
  const recaptchaContainerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!formId) return
      try {
        const res = await fetch(`/api/cms/forms/${formId}`, { cache: 'no-store' })
        const json = await res.json()
        if (!cancelled && json?.success && json.data) setForm(json.data)
      } catch {
        // A missing/unpublished form simply renders nothing on the public site.
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [formId])

  // Loads the Google reCAPTCHA script once and renders the checkbox widget into
  // recaptchaContainerRef when a site key is configured. If NEXT_PUBLIC_RECAPTCHA_SITE_KEY
  // is unset the whole block is skipped - no broken widget, no blocked submissions.
  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY || !form) return
    if (window.grecaptcha?.render) {
      setRecaptchaReady(true)
      return
    }
    const existing = document.querySelector('script[data-recaptcha-loader]')
    if (existing) {
      existing.addEventListener('load', () => setRecaptchaReady(true), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = 'https://www.google.com/recaptcha/api.js'
    script.async = true
    script.defer = true
    script.dataset.recaptchaLoader = 'true'
    script.onload = () => setRecaptchaReady(true)
    document.head.appendChild(script)
  }, [form])

  useEffect(() => {
    if (!recaptchaReady || !recaptchaContainerRef.current || recaptchaWidgetId.current !== null) return
    recaptchaWidgetId.current = window.grecaptcha.render(recaptchaContainerRef.current, { sitekey: RECAPTCHA_SITE_KEY })
  }, [recaptchaReady])

  if (!form || !Array.isArray(form.fields) || !form.fields.length) return null

  function setValue(fieldId, value) {
    setValues((prev) => ({ ...prev, [fieldId]: value }))
  }

  async function handleFileChange(field, fileList) {
    const file = fileList?.[0]
    if (!file) {
      setValue(field.id, undefined)
      return
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setStatus({ kind: 'error', text: `"${field.label || 'File'}" is too large. Maximum size is 4MB.` })
      return
    }
    try {
      const dataBase64 = await readFileAsDataUrl(file)
      setValue(field.id, { fileName: file.name, mimeType: file.type, size: file.size, dataBase64 })
    } catch (error) {
      setStatus({ kind: 'error', text: error?.message || 'Could not read the selected file.' })
    }
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setStatus({ kind: '', text: '' })
    try {
      const visibleValues = {}
      form.fields.forEach((field) => {
        if (isFieldVisible(field, values)) visibleValues[field.id] = values[field.id]
      })
      const recaptchaToken = RECAPTCHA_SITE_KEY && window.grecaptcha ? window.grecaptcha.getResponse(recaptchaWidgetId.current ?? undefined) : ''
      if (RECAPTCHA_SITE_KEY && !recaptchaToken) {
        throw new Error('Please complete the "I\'m not a robot" verification.')
      }

      const res = await fetch(`/api/cms/forms/${formId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...visibleValues, _gotcha: values._gotcha || '', recaptchaToken }),
      })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || form.error_message || 'Please fix the errors and try again.')
      setValues({})
      if (window.grecaptcha && recaptchaWidgetId.current !== null) window.grecaptcha.reset(recaptchaWidgetId.current)
      setStatus({ kind: 'success', text: json.success_message || form.success_message || 'Thank you for your submission!' })
      if (json.redirect_url || form.redirect_url) {
        window.location.href = json.redirect_url || form.redirect_url
      }
    } catch (error) {
      setStatus({ kind: 'error', text: error?.message || form.error_message || 'Unable to submit right now.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-7 sm:px-8">
        {heading || form.name ? <h2 className="text-xl font-semibold text-slate-50">{heading || form.name}</h2> : null}
        {text || form.description ? <p className="mt-2 text-sm text-slate-300">{text || form.description}</p> : null}

        <form onSubmit={submit} className="mt-5 grid gap-3 md:grid-cols-2">
          {/* Honeypot: invisible to real visitors (off-screen, unlabeled, excluded from
              tab order), filled in only by bots that blindly complete every input. */}
          <input
            type="text"
            name="_gotcha"
            tabIndex={-1}
            autoComplete="off"
            value={values._gotcha || ''}
            onChange={(event) => setValue('_gotcha', event.target.value)}
            style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
            aria-hidden="true"
          />
          {form.fields.filter((field) => isFieldVisible(field, values)).map((field) => {
            if (field.type === 'hidden') {
              return <input key={field.id} type="hidden" name={field.id} value={values[field.id] ?? field.defaultValue ?? ''} />
            }
            if (field.type === 'html') {
              return (
                <div
                  key={field.id}
                  className={`text-sm text-slate-300 ${fieldWidthClass(field)}`}
                  dangerouslySetInnerHTML={{ __html: field.htmlContent || field.label || '' }}
                />
              )
            }

            const commonProps = {
              id: `form-${formId}-${field.id}`,
              name: field.id,
              required: Boolean(field.required),
              disabled: saving,
              className:
                'mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400',
            }

            return (
              <label key={field.id} className={`block text-xs text-slate-400 ${fieldWidthClass(field)}`}>
                {field.label}
                {field.required ? <span className="text-rose-300"> *</span> : null}

                {field.type === 'textarea' ? (
                  <textarea
                    {...commonProps}
                    rows={4}
                    placeholder={field.placeholder}
                    value={values[field.id] ?? ''}
                    onChange={(event) => setValue(field.id, event.target.value)}
                    maxLength={field.validation?.maxLength || undefined}
                    minLength={field.validation?.minLength || undefined}
                  />
                ) : field.type === 'select' ? (
                  <select
                    {...commonProps}
                    value={values[field.id] ?? ''}
                    onChange={(event) => setValue(field.id, event.target.value)}
                  >
                    <option value="">{field.placeholder || 'Select...'}</option>
                    {(field.options || []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'radio' ? (
                  <div className="mt-2 space-y-2">
                    {(field.options || []).map((option) => (
                      <label key={option} className="flex items-center gap-2 text-sm text-slate-200">
                        <input
                          type="radio"
                          name={field.id}
                          value={option}
                          required={field.required}
                          checked={values[field.id] === option}
                          onChange={() => setValue(field.id, option)}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                ) : field.type === 'checkbox' ? (
                  <div className="mt-2">
                    <input
                      type="checkbox"
                      checked={Boolean(values[field.id])}
                      required={field.required}
                      onChange={(event) => setValue(field.id, event.target.checked)}
                    />
                  </div>
                ) : field.type === 'file' || field.type === 'image' ? (
                  <div className="mt-1">
                    <input
                      id={commonProps.id}
                      type="file"
                      required={field.required && !values[field.id]}
                      disabled={saving}
                      accept={field.type === 'image' ? 'image/*' : 'image/*,.pdf,.doc,.docx'}
                      onChange={(event) => handleFileChange(field, event.target.files)}
                      className="mt-1 w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-500/20 file:px-3 file:py-2 file:text-teal-200"
                    />
                    {values[field.id]?.fileName ? (
                      <p className="mt-1 text-xs text-emerald-300">Selected: {values[field.id].fileName}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-slate-500">Max 4MB - images, PDF, or Word documents.</p>
                  </div>
                ) : (
                  <input
                    {...commonProps}
                    type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : field.type === 'url' ? 'url' : 'text'}
                    placeholder={field.placeholder}
                    value={values[field.id] ?? ''}
                    onChange={(event) => setValue(field.id, event.target.value)}
                    pattern={field.validation?.pattern || undefined}
                    minLength={field.validation?.minLength || undefined}
                    maxLength={field.validation?.maxLength || undefined}
                    min={field.validation?.min ?? undefined}
                    max={field.validation?.max ?? undefined}
                  />
                )}
              </label>
            )
          })}

          {RECAPTCHA_SITE_KEY ? (
            <div className="md:col-span-2" ref={recaptchaContainerRef} />
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="md:col-span-2 rounded-xl bg-teal-300 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-70"
          >
            {saving ? 'Submitting...' : 'Submit'}
          </button>
        </form>

        {status.text ? (
          <p className={`mt-3 text-sm ${status.kind === 'error' ? 'text-rose-300' : 'text-emerald-300'}`}>{status.text}</p>
        ) : null}
      </div>
    </section>
  )
}
