'use client'

import { useEffect, useState } from 'react'
import { Surface } from '../../../src/components/ui/Surface'
import { adminApiFetch } from '../../../lib/adminApiClient'

export default function SeoAdminClient() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    id: '',
    page_slug: '',
    meta_title: '',
    meta_description: '',
    canonical_url: '',
    og_title: '',
    og_description: '',
    og_image: '',
    twitter_title: '',
    twitter_description: '',
    twitter_image: '',
    noindex: false,
    schema_json: '',
  })

  async function loadSeo() {
    setStatus('')
    try {
      const json = await adminApiFetch('/api/cms/seo?limit=500', { cache: 'no-store' })
      setItems(Array.isArray(json.data) ? json.data : [])
    } catch (error) {
      setStatus(error?.message || 'Failed to load SEO metadata.')
      return
    }
  }

  useEffect(() => {
    loadSeo()
  }, [])

  function syncForm(item) {
    setForm({
      id: item.id || '',
      page_slug: item.page_slug || '',
      meta_title: item.meta_title || '',
      meta_description: item.meta_description || '',
      canonical_url: item.canonical_url || '',
      og_title: item.og_title || '',
      og_description: item.og_description || '',
      og_image: item.og_image || '',
      twitter_title: item.twitter_title || '',
      twitter_description: item.twitter_description || '',
      twitter_image: item.twitter_image || '',
      noindex: item.noindex === true,
      schema_json: item.schema_json ? JSON.stringify(item.schema_json, null, 2) : '',
    })
  }

  function resetForm() {
    setForm({
      id: '',
      page_slug: '',
      meta_title: '',
      meta_description: '',
      canonical_url: '',
      og_title: '',
      og_description: '',
      og_image: '',
      twitter_title: '',
      twitter_description: '',
      twitter_image: '',
      noindex: false,
      schema_json: '',
    })
  }

  async function saveSeo(event) {
    event.preventDefault()
    if (!form.page_slug.trim()) {
      setStatus('page_slug is required.')
      return
    }

    setSaving(true)
    setStatus('')
    try {
      let schemaJson = null
      if (form.schema_json.trim()) schemaJson = JSON.parse(form.schema_json)

      const payload = {
        id: form.id || undefined,
        page_slug: form.page_slug.trim(),
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
        canonical_url: form.canonical_url || null,
        og_title: form.og_title || null,
        og_description: form.og_description || null,
        og_image: form.og_image || null,
        twitter_title: form.twitter_title || null,
        twitter_description: form.twitter_description || null,
        twitter_image: form.twitter_image || null,
        noindex: Boolean(form.noindex),
        schema_json: schemaJson,
      }
      const json = await adminApiFetch('/api/cms/seo', {
        method: 'POST',
        body: payload,
      })
      await loadSeo()
      syncForm(json.data)
      setStatus('SEO metadata saved.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save SEO metadata.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteSeo(id) {
    if (!window.confirm('Delete this SEO metadata record?')) return
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/seo/${id}`, { method: 'DELETE' })
      if (form.id === id) resetForm()
      await loadSeo()
      setStatus('SEO metadata deleted.')
    } catch (error) {
      setStatus(error?.message || 'Failed to delete SEO metadata.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">SEO Metadata</h2>
          <p className="mt-1 text-sm text-slate-300">Manage title/description/OG/Twitter/schema for each slug.</p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200"
        >
          New Record
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-sm font-semibold text-slate-100">SEO Records</h3>
          <div className="mt-3 space-y-2">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => syncForm(item)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                  form.id === item.id
                    ? 'bg-teal-300 text-slate-950'
                    : 'border border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.05]'
                }`}
              >
                <div className="font-semibold">{item.page_slug}</div>
                <div className="text-xs opacity-80">{item.meta_title || 'No title'}</div>
              </button>
            ))}
            {!items.length ? <p className="text-xs text-slate-500">No SEO records yet.</p> : null}
          </div>
        </aside>

        <form onSubmit={saveSeo} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-xs text-slate-400">
              Page Slug
              <input value={form.page_slug} onChange={(e) => setForm((p) => ({ ...p, page_slug: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
            </label>
            <label className="text-xs text-slate-400">
              Canonical URL
              <input value={form.canonical_url} onChange={(e) => setForm((p) => ({ ...p, canonical_url: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
            </label>
            <label className="text-xs text-slate-400">
              Meta Title
              <input value={form.meta_title} onChange={(e) => setForm((p) => ({ ...p, meta_title: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
            </label>
            <label className="text-xs text-slate-400">
              OG Title
              <input value={form.og_title} onChange={(e) => setForm((p) => ({ ...p, og_title: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
            </label>
            <label className="text-xs text-slate-400 md:col-span-2">
              Meta Description
              <textarea rows={3} value={form.meta_description} onChange={(e) => setForm((p) => ({ ...p, meta_description: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
            </label>
            <label className="text-xs text-slate-400 md:col-span-2">
              OG Description
              <textarea rows={3} value={form.og_description} onChange={(e) => setForm((p) => ({ ...p, og_description: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
            </label>
            <label className="text-xs text-slate-400">
              OG Image
              <input value={form.og_image} onChange={(e) => setForm((p) => ({ ...p, og_image: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
            </label>
            <label className="text-xs text-slate-400">
              Twitter Title
              <input value={form.twitter_title} onChange={(e) => setForm((p) => ({ ...p, twitter_title: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
            </label>
            <label className="text-xs text-slate-400 md:col-span-2">
              Twitter Description
              <textarea rows={3} value={form.twitter_description} onChange={(e) => setForm((p) => ({ ...p, twitter_description: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
            </label>
            <label className="text-xs text-slate-400">
              Twitter Image
              <input value={form.twitter_image} onChange={(e) => setForm((p) => ({ ...p, twitter_image: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={form.noindex}
                onChange={(e) => setForm((p) => ({ ...p, noindex: e.target.checked }))}
              />
              Noindex
            </label>
            <label className="text-xs text-slate-400 md:col-span-2">
              Schema JSON
              <textarea rows={8} value={form.schema_json} onChange={(e) => setForm((p) => ({ ...p, schema_json: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-xs text-slate-100" />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving} className="rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200 disabled:opacity-70">
              {saving ? 'Saving...' : 'Save SEO'}
            </button>
            {form.id ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => deleteSeo(form.id)}
                className="rounded-xl border border-rose-400/30 px-4 py-2 text-sm text-rose-200 hover:bg-rose-500/10"
              >
                Delete
              </button>
            ) : null}
          </div>
        </form>
      </div>

      {status ? <p className="mt-4 text-sm text-slate-300">{status}</p> : null}
    </Surface>
  )
}
