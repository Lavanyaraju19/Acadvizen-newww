'use client'

import { useEffect, useState } from 'react'

function fieldWidthClass(field) {
  return field?.styling?.width === 'half' ? '' : 'md:col-span-2'
}

export default function FormEmbedRenderer({ formId, heading, text }) {
  const [form, setForm] = useState(null)
  const [values, setValues] = useState({})
  const [status, setStatus] = useState({ kind: '', text: '' })
  const [saving, setSaving] = useState(false)

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

  if (!form || !Array.isArray(form.fields) || !form.fields.length) return null

  function setValue(fieldId, value) {
    setValues((prev) => ({ ...prev, [fieldId]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setStatus({ kind: '', text: '' })
    try {
      const res = await fetch(`/api/cms/forms/${formId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || form.error_message || 'Please fix the errors and try again.')
      setValues({})
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
          {form.fields.map((field) => {
            if (field.type === 'hidden') {
              return <input key={field.id} type="hidden" name={field.id} value={values[field.id] ?? field.defaultValue ?? ''} />
            }
            if (field.type === 'html') {
              return (
                <div
                  key={field.id}
                  className={`text-sm text-slate-300 ${fieldWidthClass(field)}`}
                  dangerouslySetInnerHTML={{ __html: field.label || '' }}
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
                ) : (
                  <input
                    {...commonProps}
                    type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
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
