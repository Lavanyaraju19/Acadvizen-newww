'use client'

import { useEffect, useMemo, useState } from 'react'
import { adminApiFetch } from '../../../lib/adminApiClient'
import { uploadFileAsset } from '../../../lib/storageUpload'

const typeDefaults = {
  text: '',
  textarea: '',
  number: '',
  checkbox: false,
  json: '{}',
  datetime: '',
}

function normalizeInputValue(field, value) {
  if (field.type === 'checkbox') return Boolean(value)
  if (field.type === 'json') {
    try {
      return value ? JSON.stringify(value, null, 2) : '{}'
    } catch {
      return '{}'
    }
  }
  return value ?? ''
}

function toPayload(fields, values) {
  const payload = {}
  for (const field of fields) {
    const raw = values[field.key]
    if (field.type === 'checkbox') {
      payload[field.key] = Boolean(raw)
      continue
    }
    if (field.type === 'number') {
      payload[field.key] = raw === '' ? null : Number(raw)
      continue
    }
    if (field.type === 'json') {
      if (!String(raw || '').trim()) {
        payload[field.key] = field.nullable ? null : {}
      } else {
        payload[field.key] = JSON.parse(raw)
      }
      continue
    }
    payload[field.key] = raw === '' ? null : raw
  }
  return payload
}

function buildDefaultForm(fields) {
  const values = {}
  for (const field of fields) {
    values[field.key] = field.default ?? typeDefaults[field.type || 'text']
  }
  return values
}

export default function EntityCrudManager({
  entity,
  title,
  subtitle,
  fields = [],
  filterQuery = '',
  showDuplicate = true,
  showDelete = true,
  compact = false,
  pageSize = 10,
}) {
  const [items, setItems] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingField, setUploadingField] = useState('')
  const [status, setStatus] = useState('')
  const [form, setForm] = useState(buildDefaultForm(fields))
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const selected = useMemo(() => items.find((item) => item.id === selectedId) || null, [items, selectedId])
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return items
    return items.filter((item) => {
      const haystack = Object.values(item || {}).join(' ').toLowerCase()
      return haystack.includes(query)
    })
  }, [items, search])
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize))
  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, page, pageSize])

  async function load(nextId) {
    setStatus('')
    try {
      const json = await adminApiFetch(`/api/cms/entities/${entity}?limit=500${filterQuery ? `&${filterQuery}` : ''}`, { cache: 'no-store' })
      const rows = Array.isArray(json.data) ? json.data : []
      setItems(rows)
      const id = nextId || selectedId || rows[0]?.id || ''
      setSelectedId(id)
      if (id) {
        const row = rows.find((entry) => entry.id === id)
        if (row) {
          const next = {}
          for (const field of fields) {
            next[field.key] = normalizeInputValue(field, row[field.key])
          }
          setForm(next)
        }
      } else {
        setForm(buildDefaultForm(fields))
      }
    } catch (error) {
      setStatus(error?.message || `Failed to load ${title}.`)
      return
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity, filterQuery])

  useEffect(() => {
    setPage(1)
  }, [search, entity])

  function beginCreate() {
    setSelectedId('')
    setForm(buildDefaultForm(fields))
  }

  async function registerUploadedMedia(asset, field) {
    if (!asset?.url || field?.trackMedia === false) return

    try {
      await adminApiFetch('/api/cms/media', {
        method: 'POST',
        body: {
          url: asset.url,
          bucket: asset.bucket,
          path: asset.path,
          type: asset.type,
          width: asset.width,
          height: asset.height,
          size: asset.size,
          alt_text: '',
          caption: '',
        },
      })
    } catch {
      // Keep the primary save path resilient even if media indexing fails.
    }
  }

  async function handleFieldUpload(field, file) {
    if (!field?.bucket || !file) return

    setUploadingField(field.key)
    setStatus('')
    try {
      const asset = await uploadFileAsset(file, field.bucket)
      await registerUploadedMedia(asset, field)
      setForm((prev) => ({ ...prev, [field.key]: asset.url }))
      setStatus(`${field.label} uploaded.`)
    } catch (error) {
      setStatus(error?.message || `Failed to upload ${field.label}.`)
    } finally {
      setUploadingField('')
    }
  }

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    setStatus('')
    try {
      const payload = toPayload(fields, form)
      if (selectedId) payload.id = selectedId
      const json = await adminApiFetch(`/api/cms/entities/${entity}`, {
        method: 'POST',
        body: payload,
      })
      await load(json.data?.id)
      setStatus('Saved.')
    } catch (error) {
      setStatus(error?.message || `Failed to save ${title}.`)
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!selectedId || !showDelete) return
    if (!window.confirm('Delete this item?')) return
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/entities/${entity}/${selectedId}`, { method: 'DELETE' })
      beginCreate()
      await load('')
      setStatus('Deleted.')
    } catch (error) {
      setStatus(error?.message || 'Failed to delete item.')
    } finally {
      setSaving(false)
    }
  }

  async function duplicate() {
    if (!selectedId || !showDuplicate) return
    setSaving(true)
    setStatus('')
    try {
      const json = await adminApiFetch(`/api/cms/entities/${entity}`, {
        method: 'POST',
        body: { action: 'duplicate', id: selectedId },
      })
      await load(json.data?.id)
      setStatus('Duplicated.')
    } catch (error) {
      setStatus(error?.message || 'Failed to duplicate item.')
    } finally {
      setSaving(false)
    }
  }

  const containerClass = compact ? 'rounded-2xl border border-white/10 bg-white/[0.03] p-4' : 'rounded-2xl border border-white/10 bg-white/[0.03] p-5'

  return (
    <section className={containerClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-100">{title}</h3>
          {subtitle ? <p className="mt-1 text-xs text-slate-400">{subtitle}</p> : null}
        </div>
        <button
          type="button"
          onClick={beginCreate}
          className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-200 hover:bg-white/[0.05]"
        >
          New
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-3">
          <label className="block text-[11px] uppercase tracking-[0.2em] text-slate-400">
            Search
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search records"
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
            />
          </label>
          {pagedItems.length ? (
            pagedItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedId(item.id)
                  const next = {}
                  for (const field of fields) {
                    next[field.key] = normalizeInputValue(field, item[field.key])
                  }
                  setForm(next)
                }}
                className={`w-full rounded-lg px-3 py-2 text-left text-xs ${
                  selectedId === item.id
                    ? 'bg-teal-300 text-slate-950'
                    : 'border border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.05]'
                }`}
              >
                {item.title || item.name || item.company_name || item.label || item.slug || item.key || 'Untitled'}
              </button>
            ))
          ) : (
            <p className="text-xs text-slate-500">No items yet.</p>
          )}
          {filteredItems.length > pageSize ? (
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <button type="button" disabled={page === 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))} className="disabled:opacity-50">
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} className="disabled:opacity-50">
                Next
              </button>
            </div>
          ) : null}
        </aside>

        <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
          {fields.map((field) => (
            <label key={field.key} className={`text-xs text-slate-400 ${field.full ? 'md:col-span-2' : ''}`}>
              {field.label}
              {field.type === 'textarea' ? (
                <textarea
                  rows={field.rows || 3}
                  value={form[field.key] ?? ''}
                  onChange={(event) => setForm((prev) => ({ ...prev, [field.key]: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                />
              ) : field.type === 'checkbox' ? (
                <div className="mt-2">
                  <input
                    type="checkbox"
                    checked={Boolean(form[field.key])}
                    onChange={(event) => setForm((prev) => ({ ...prev, [field.key]: event.target.checked }))}
                  />
                </div>
              ) : field.type === 'json' ? (
                <textarea
                  rows={field.rows || 5}
                  value={form[field.key] ?? '{}'}
                  onChange={(event) => setForm((prev) => ({ ...prev, [field.key]: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 font-mono text-xs text-slate-100"
                />
              ) : field.type === 'select' ? (
                <select
                  value={form[field.key] ?? ''}
                  onChange={(event) => setForm((prev) => ({ ...prev, [field.key]: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                >
                  {(field.options || []).map((option) => (
                    <option key={`${field.key}-${option.value}`} value={option.value} className="bg-[#07101b]">
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'file' ? (
                <div className="mt-1 space-y-2">
                  <input
                    type="text"
                    value={form[field.key] ?? ''}
                    onChange={(event) => setForm((prev) => ({ ...prev, [field.key]: event.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                  />
                  <input
                    type="file"
                    accept={field.accept || '*/*'}
                    onChange={(event) => handleFieldUpload(field, event.target.files?.[0])}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                  />
                  {uploadingField === field.key ? <p className="text-[11px] text-slate-400">Uploading...</p> : null}
                </div>
              ) : (
                <input
                  type={field.type === 'datetime' ? 'datetime-local' : field.type === 'number' ? 'number' : 'text'}
                  value={form[field.key] ?? ''}
                  onChange={(event) => setForm((prev) => ({ ...prev, [field.key]: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                />
              )}
            </label>
          ))}

          <div className="md:col-span-2 flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-teal-300 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-70"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            {showDuplicate ? (
              <button
                type="button"
                disabled={saving || !selectedId}
                onClick={duplicate}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 disabled:opacity-60"
              >
                Duplicate
              </button>
            ) : null}
            {showDelete ? (
              <button
                type="button"
                disabled={saving || !selectedId}
                onClick={remove}
                className="rounded-lg border border-rose-400/30 px-3 py-2 text-xs text-rose-200 disabled:opacity-60"
              >
                Delete
              </button>
            ) : null}
          </div>
        </form>
      </div>

      {status ? <p className="mt-3 text-xs text-slate-300">{status}</p> : null}
    </section>
  )
}
