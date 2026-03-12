import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { useAuth } from '../../../contexts/AuthContext'
import { Surface } from '../../../components/ui/Surface'
import { CoursesAdmin } from './CoursesAdmin'
import { ToolsAdmin } from './ToolsAdmin'
import { ResourcesAdmin } from './ResourcesAdmin'
import { uploadFile } from '../../../../lib/storageUpload'

function SectionShell({ title, subtitle, children, actions }) {
  return (
    <Surface className="p-6 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-slate-50">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-slate-300">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className="mt-6">{children}</div>
    </Surface>
  )
}

function UploadField({ bucket, onUploaded }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleUpload = async (file) => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const publicUrl = await uploadFile(file, bucket)
      onUploaded(publicUrl)
    } catch (err) {
      setError(err?.message || 'Upload failed.')
    }
    setUploading(false)
  }

  return (
    <div className="space-y-2">
      <input
        type="file"
        onChange={(event) => handleUpload(event.target.files?.[0])}
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
      />
      {uploading && <div className="text-xs text-slate-400">Uploading...</div>}
      {error && <div className="text-xs text-rose-300">{error}</div>}
    </div>
  )
}

function BlogContentEditor({ value, onChange }) {
  return (
    <div className="mt-2 space-y-3">
      <textarea
        rows={8}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
        placeholder="Paste plain blog text here. Use blank lines between paragraphs. No HTML needed."
      />
      <div className="text-xs text-slate-400">
        Tip: Use the <span className="text-slate-200">Featured Image</span> field for the main blog image. Line breaks in this text are preserved automatically.
      </div>
    </div>
  )
}

async function triggerFrontendRefresh(paths = ['/']) {
  try {
    await fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths }),
    })
  } catch {
    // no-op: legacy pages also subscribe to realtime changes
  }
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.map((v) => String(v ?? ''))
  return []
}

function CrudSection({
  table,
  title,
  subtitle,
  fields,
  orderBy = 'order_index',
  emptyState = 'No content yet. Click New to add your first entry.',
  upsertKeys = '',
  itemToForm,
  formToPayload,
  refreshPaths = ['/'],
}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  const resetForm = () => {
    const initial = {}
    fields.forEach((field) => {
      if (field.type === 'checkbox') initial[field.name] = field.default ?? false
      else if (field.type === 'list') initial[field.name] = field.default ?? ['']
      else initial[field.name] = field.default ?? ''
    })
    setForm(initial)
  }

  const loadItems = async () => {
    setLoading(true)
    const { data } = await supabase.from(table).select('*').order(orderBy, { ascending: true })
    if (data) setItems(data)
    setLoading(false)
  }

  useEffect(() => {
    resetForm()
    loadItems()
    const channel = supabase
      .channel(`cms-${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, loadItems)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [table])

  const startEdit = (item) => {
    setEditing(item)
    if (typeof itemToForm === 'function') {
      setForm(itemToForm(item))
      return
    }
    const next = {}
    fields.forEach((field) => {
      if (field.type === 'json') {
        next[field.name] = item[field.name] ? JSON.stringify(item[field.name], null, 2) : ''
      } else if (field.type === 'list') {
        next[field.name] = normalizeList(item[field.name] ?? field.default)
      } else {
        next[field.name] = item[field.name] ?? (field.type === 'checkbox' ? false : '')
      }
    })
    setForm(next)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return
    setFormError('')
    setFormSuccess('')
    setSubmitting(true)
    try {
      const payload =
        typeof formToPayload === 'function'
          ? formToPayload(form, editing)
          : { ...form }

      for (const field of fields) {
        if (field.type === 'json') {
          const raw = form[field.name]
          if (raw && typeof raw === 'string') {
            const trimmed = raw.trim()
            if (!trimmed) {
              payload[field.name] = null
            } else {
              try {
                payload[field.name] = JSON.parse(trimmed)
              } catch (err) {
                setFormError(`Invalid JSON in ${field.label}.`)
                setSubmitting(false)
                return
              }
            }
          }
        }
      }

      let query
      if (upsertKeys) {
        query = supabase.from(table).upsert(payload, { onConflict: upsertKeys }).select()
      } else {
        const rowPayload = editing ? { ...payload, id: editing.id } : payload
        query = supabase.from(table).upsert(rowPayload, { onConflict: 'id' }).select()
      }

      const { error } = await query
      if (error) throw error

      setFormSuccess('Content updated successfully')
      setEditing(null)
      resetForm()
      await Promise.all([loadItems(), triggerFrontendRefresh(refreshPaths)])
    } catch (err) {
      setFormError(err?.message || 'Failed to save changes.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return
    await supabase.from(table).delete().eq('id', id)
    loadItems()
  }

  const formatJsonField = (name, label) => {
    const raw = form[name]
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      setForm((prev) => ({ ...prev, [name]: JSON.stringify(parsed, null, 2) }))
      setFormError('')
    } catch (err) {
      setFormError(`Invalid JSON in ${label}.`)
    }
  }

  return (
    <SectionShell
      title={title}
      subtitle={subtitle}
      actions={
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            resetForm()
          }}
          className="rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200"
        >
          New
        </button>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <div key={field.name} className={field.fullWidth ? 'md:col-span-2' : ''}>
            <div className="flex items-center justify-between">
              <label className="block text-xs uppercase tracking-[0.2em] text-slate-400">{field.label}</label>
              {field.type === 'json' && (
                <button
                  type="button"
                  onClick={() => formatJsonField(field.name, field.label)}
                  className="text-[10px] uppercase tracking-[0.18em] text-teal-300 hover:text-teal-200"
                >
                  Format JSON
                </button>
              )}
            </div>
            {field.type === 'textarea' ? (
              <textarea
                rows={4}
                value={form[field.name] ?? ''}
                onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
              />
            ) : field.type === 'blog-content' ? (
              <BlogContentEditor
                value={form[field.name] ?? ''}
                onChange={(nextValue) => setForm({ ...form, [field.name]: nextValue })}
              />
            ) : field.type === 'list' ? (
              <div className="mt-2 space-y-2">
                {(form[field.name] ?? []).map((item, index) => (
                  <div key={`${field.name}-${index}`} className="flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(event) => {
                        const next = [...(form[field.name] ?? [])]
                        next[index] = event.target.value
                        setForm({ ...form, [field.name]: next })
                      }}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = (form[field.name] ?? []).filter((_, i) => i !== index)
                        setForm({ ...form, [field.name]: next.length ? next : [''] })
                      }}
                      className="rounded-lg border border-rose-400/30 px-3 py-2 text-xs text-rose-200 hover:bg-rose-500/10"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const next = [...(form[field.name] ?? [])]
                    next.push('')
                    setForm({ ...form, [field.name]: next })
                  }}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/[0.05]"
                >
                  + Add Item
                </button>
              </div>
            ) : field.type === 'json' ? (
              <textarea
                rows={5}
                value={form[field.name] ?? ''}
                onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 font-mono"
                placeholder='{"key":"value"}'
              />
            ) : field.type === 'checkbox' ? (
              <input
                type="checkbox"
                checked={Boolean(form[field.name])}
                onChange={(event) => setForm({ ...form, [field.name]: event.target.checked })}
                className="mt-3 h-4 w-4"
              />
            ) : field.type === 'select' ? (
              <select
                value={form[field.name] ?? ''}
                onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
              >
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#050b12]">
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'file' ? (
              <UploadField bucket={field.bucket} onUploaded={(url) => setForm({ ...form, [field.name]: url })} />
            ) : (
              <input
                type={field.type || 'text'}
                value={form[field.name] ?? ''}
                onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
              />
            )}
          </div>
        ))}
        {formSuccess && <div className="md:col-span-2 text-xs text-emerald-300">{formSuccess}</div>}
        {formError && <div className="md:col-span-2 text-xs text-rose-300">{formError}</div>}
        <div className="md:col-span-2 flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200"
          >
            {submitting ? 'Saving...' : editing ? 'Update' : 'Create'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null)
                resetForm()
              }}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05]"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-8 space-y-3">
        {loading ? (
          <div className="text-sm text-slate-400">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-slate-400">{emptyState}</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-slate-200">
                  {fields.slice(0, 3).map((field) => (
                    <div key={field.name}>
                      <span className="text-slate-400">{field.label}:</span> {String(item[field.name] ?? '')}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-200 hover:bg-white/[0.05]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-lg border border-rose-400/30 px-3 py-1 text-xs text-rose-200 hover:bg-rose-500/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </SectionShell>
  )
}

function RegistrationsSection() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')

  const loadItems = async () => {
    const { data } = await supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setItems(data)
  }

  useEffect(() => {
    loadItems()
    const channel = supabase
      .channel('cms-registrations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, loadItems)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter((item) =>
      [item.full_name, item.email].some((value) => value?.toLowerCase().includes(q)),
    )
  }, [items, search])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this registration?')) return
    await supabase.from('registrations').delete().eq('id', id)
    loadItems()
  }

  const exportCsv = () => {
    const rows = [
      ['Full Name', 'Email', 'Phone', 'Learning Mode', 'Page', 'Created At'],
      ...filtered.map((item) => [
        item.full_name,
        item.email,
        item.phone,
        item.learning_mode,
        item.page,
        item.created_at,
      ]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'registrations.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <SectionShell
      title="Registrations"
      subtitle="Manage learner registrations and export leads."
      actions={
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search name or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
          />
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05]"
          >
            Export CSV
          </button>
        </div>
      }
    >
      <div className="text-sm text-slate-400">Total: {filtered.length}</div>
      <div className="mt-4 space-y-3">
        {filtered.map((item) => (
          <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-slate-200">
                <div className="font-semibold">{item.full_name}</div>
                <div className="text-xs text-slate-400">{item.email} - {item.phone}</div>
                <div className="text-xs text-slate-500">{item.learning_mode} - {item.page}</div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="rounded-lg border border-rose-400/30 px-3 py-1 text-xs text-rose-200 hover:bg-rose-500/10"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}

const cmsSections = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'registrations', label: 'Registrations' },
  { key: 'home_content', label: 'Home Content' },
  { key: 'page_content', label: 'Page Content' },
  { key: 'blog_posts', label: 'Blog Posts' },
  { key: 'placements', label: 'Placements' },
  { key: 'courses', label: 'Courses' },
  { key: 'tools', label: 'Tools' },
  { key: 'resources', label: 'Resources' },
  { key: 'locations', label: 'Locations' },
  { key: 'cohorts', label: 'Cohorts' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'hiring_partners', label: 'Hiring Partners' },
  { key: 'faqs', label: 'FAQs' },
  { key: 'alumni', label: 'Alumni' },
  { key: 'stats', label: 'Stats' },
  { key: 'ticker', label: 'Ticker' },
  { key: 'videos', label: 'Videos' },
  { key: 'gallery', label: 'Gallery' },
]

export function AdminCmsDashboard() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const [active, setActive] = useState('dashboard')

  useEffect(() => {
    if (loading) return
    if (!user || profile?.role !== 'admin') {
      navigate('/admin-login', { replace: true })
    }
  }, [user, profile, loading, navigate])

  useEffect(() => {
    if (!user || profile?.role !== 'admin') return

    const seedDefaults = async () => {
      const [{ count: homeCount }, { count: statsCount }, { count: toolsCount }, { count: testimonialsCount }] =
        await Promise.all([
          supabase.from('home_sections').select('*', { count: 'exact', head: true }),
          supabase.from('stats').select('*', { count: 'exact', head: true }),
          supabase.from('tools_extended').select('*', { count: 'exact', head: true }),
          supabase.from('testimonials').select('*', { count: 'exact', head: true }),
        ])

      if (!homeCount) {
        await supabase.from('home_sections').upsert(
          [
            {
              section_key: 'hero',
              title: 'Master AI-Powered Digital Marketing Course',
              subtitle: 'Build your own learning path with global industry mentors.',
              body: '6-Month Intensive Program with internship support.',
              items_json: ['120+ Tools', '75+ Live Projects', '45+ Certifications'],
              cta_json: {
                primary_label: 'Apply Now',
                primary_href: '/contact',
                secondary_label: 'View Courses',
                secondary_href: '/courses',
              },
              order_index: 1,
              is_active: true,
            },
            {
              section_key: 'features',
              title: 'Our Learning Values',
              subtitle: 'Practical, mentor-led, outcome-driven learning.',
              body: 'No content yet. Click New to add your first entry.',
              items_json: ['Hands-on training', 'Live projects', 'Career support'],
              order_index: 2,
              is_active: true,
            },
          ],
          { onConflict: 'section_key' },
        )
      }

      if (!statsCount) {
        await supabase.from('stats').insert([
          { label: 'Careers Transformed', value: '1000+', order_index: 1, is_active: true },
          { label: 'Successfully Placed', value: '625+', order_index: 2, is_active: true },
          { label: 'Hiring Partners', value: '250+', order_index: 3, is_active: true },
        ])
      }

      if (!toolsCount) {
        await supabase.from('tools_extended').insert([
          { name: 'Google Ads', slug: 'google-ads', category: 'Ads', is_active: true },
          { name: 'Meta Ads', slug: 'meta-ads', category: 'Ads', is_active: true },
        ])
      }

      if (!testimonialsCount) {
        await supabase.from('testimonials').insert([
          {
            name: 'Acadvizen Learner',
            role: 'Placed Candidate',
            quote: 'Hands-on learning and placement support improved my confidence.',
            order_index: 1,
            is_active: true,
          },
        ])
      }
    }

    seedDefaults()
  }, [user, profile])

  return (
    <div className="min-h-screen acadvizen-noise">
      <div className="pointer-events-none fixed inset-0 z-0 advz-animated-bg" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <Surface className="p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">CMS</div>
            <div className="mt-2 text-lg font-semibold text-slate-50">Admin Dashboard</div>
            <div className="mt-4 space-y-2">
              {cmsSections.map((section) => (
                <button
                  key={section.key}
                  onClick={() => setActive(section.key)}
                  className={`w-full rounded-xl px-4 py-2 text-left text-sm font-semibold ${
                    active === section.key
                      ? 'bg-teal-300 text-slate-950'
                      : 'border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05]'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </Surface>

          <div className="space-y-6">
            {active === 'dashboard' && (
              <SectionShell
                title="CMS Overview"
                subtitle="Use the sidebar to manage content, cohorts, and assets."
                actions={
                  <a href="/" className="text-sm font-semibold text-teal-300 hover:text-teal-200">
                    Back to site
                  </a>
                }
              >
                <div className="grid gap-4 md:grid-cols-2">
                  {cmsSections.filter((s) => s.key !== 'dashboard').map((s) => (
                    <div key={s.key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">
                      {s.label}
                    </div>
                  ))}
                </div>
              </SectionShell>
            )}

            {active === 'registrations' && <RegistrationsSection />}
            {active === 'home_content' && (
              <CrudSection
                table="home_sections"
                title="Home Page Content"
                subtitle="Edit homepage text, buttons, and list items with simple fields."
                upsertKeys="section_key"
                refreshPaths={['/']}
                fields={[
                  { name: 'section_key', label: 'Section Key' },
                  { name: 'title', label: 'Title' },
                  { name: 'subtitle', label: 'Subtitle' },
                  { name: 'body', label: 'Body', type: 'textarea', fullWidth: true },
                  { name: 'primary_button_text', label: 'Primary Button Text' },
                  { name: 'primary_button_link', label: 'Primary Button Link' },
                  { name: 'secondary_button_text', label: 'Secondary Button Text' },
                  { name: 'secondary_button_link', label: 'Secondary Button Link' },
                  { name: 'hero_image_url', label: 'Hero Image Upload', type: 'file', bucket: 'site-assets', fullWidth: true },
                  { name: 'list_items', label: 'List Items', type: 'list', fullWidth: true, default: [''] },
                  { name: 'order_index', label: 'Order', type: 'number', default: 0 },
                  { name: 'is_active', label: 'Active', type: 'checkbox', default: true },
                ]}
                itemToForm={(item) => {
                  const cta = item?.cta_json && typeof item.cta_json === 'object' ? item.cta_json : {}
                  return {
                    section_key: item.section_key ?? '',
                    title: item.title ?? '',
                    subtitle: item.subtitle ?? '',
                    body: item.body ?? '',
                    primary_button_text: cta.primary_label ?? cta.label ?? '',
                    primary_button_link: cta.primary_href ?? cta.href ?? '',
                    secondary_button_text: cta.secondary_label ?? '',
                    secondary_button_link: cta.secondary_href ?? '',
                    hero_image_url: cta.hero_image_url ?? '',
                    list_items: normalizeList(item.items_json).length ? normalizeList(item.items_json) : [''],
                    order_index: item.order_index ?? 0,
                    is_active: Boolean(item.is_active),
                  }
                }}
                formToPayload={(form) => ({
                  section_key: form.section_key,
                  title: form.title,
                  subtitle: form.subtitle,
                  body: form.body,
                  items_json: normalizeList(form.list_items).map((x) => x.trim()).filter(Boolean),
                  cta_json: {
                    primary_label: form.primary_button_text || undefined,
                    primary_href: form.primary_button_link || undefined,
                    secondary_label: form.secondary_button_text || undefined,
                    secondary_href: form.secondary_button_link || undefined,
                    hero_image_url: form.hero_image_url || undefined,
                  },
                  order_index: Number(form.order_index) || 0,
                  is_active: Boolean(form.is_active),
                })}
              />
            )}
            {active === 'page_content' && (
              <CrudSection
                table="page_sections"
                title="Page Content"
                subtitle="Edit headings, copy, and empty states for other pages."
                upsertKeys="page_slug,section_key"
                refreshPaths={['/about', '/contact', '/courses', '/tools', '/placement']}
                fields={[
                  { name: 'page_slug', label: 'Page Slug' },
                  { name: 'section_key', label: 'Section Key' },
                  { name: 'title', label: 'Title' },
                  { name: 'subtitle', label: 'Subtitle' },
                  { name: 'body', label: 'Body', type: 'textarea', fullWidth: true },
                  { name: 'primary_button_text', label: 'Primary Button Text' },
                  { name: 'primary_button_link', label: 'Primary Button Link' },
                  { name: 'secondary_button_text', label: 'Secondary Button Text' },
                  { name: 'secondary_button_link', label: 'Secondary Button Link' },
                  { name: 'list_items', label: 'List Items', type: 'list', fullWidth: true, default: [''] },
                  { name: 'order_index', label: 'Order', type: 'number', default: 0 },
                  { name: 'is_active', label: 'Active', type: 'checkbox', default: true },
                ]}
                itemToForm={(item) => {
                  const cta = item?.cta_json && typeof item.cta_json === 'object' ? item.cta_json : {}
                  return {
                    page_slug: item.page_slug ?? '',
                    section_key: item.section_key ?? '',
                    title: item.title ?? '',
                    subtitle: item.subtitle ?? '',
                    body: item.body ?? '',
                    primary_button_text: cta.primary_label ?? cta.label ?? '',
                    primary_button_link: cta.primary_href ?? cta.href ?? '',
                    secondary_button_text: cta.secondary_label ?? '',
                    secondary_button_link: cta.secondary_href ?? '',
                    list_items: normalizeList(item.items_json).length ? normalizeList(item.items_json) : [''],
                    order_index: item.order_index ?? 0,
                    is_active: Boolean(item.is_active),
                  }
                }}
                formToPayload={(form) => ({
                  page_slug: form.page_slug,
                  section_key: form.section_key,
                  title: form.title,
                  subtitle: form.subtitle,
                  body: form.body,
                  items_json: normalizeList(form.list_items).map((x) => x.trim()).filter(Boolean),
                  cta_json: {
                    primary_label: form.primary_button_text || undefined,
                    primary_href: form.primary_button_link || undefined,
                    secondary_label: form.secondary_button_text || undefined,
                    secondary_href: form.secondary_button_link || undefined,
                  },
                  order_index: Number(form.order_index) || 0,
                  is_active: Boolean(form.is_active),
                })}
              />
            )}
            {active === 'blog_posts' && (
              <CrudSection
                table="blog_posts"
                title="Blog Posts"
                subtitle="Create and publish blog posts."
                emptyState="No content yet. Click New to add your first entry."
                refreshPaths={['/', '/blog']}
                fields={[
                  { name: 'title', label: 'Title' },
                  { name: 'slug', label: 'Slug' },
                  { name: 'excerpt', label: 'Excerpt', type: 'textarea', fullWidth: true },
                  { name: 'content', label: 'Content', type: 'blog-content', fullWidth: true },
                  { name: 'featured_image', label: 'Featured Image Upload', type: 'file', bucket: 'blog-images' },
                  { name: 'featured_image_url', label: 'Featured Image URL' },
                  { name: 'author', label: 'Author' },
                  { name: 'published_at', label: 'Published At', type: 'datetime-local' },
                  { name: 'is_published', label: 'Published', type: 'checkbox', default: true },
                ]}
                itemToForm={(item) => ({
                  title: item.title ?? '',
                  slug: item.slug ?? '',
                  excerpt: item.excerpt ?? '',
                  content: item.content ?? '',
                  featured_image: '',
                  featured_image_url: item.featured_image || item.image || '',
                  author: item.author ?? '',
                  published_at: item.published_at ? item.published_at.slice(0, 16) : '',
                  is_published: Boolean(item.is_published ?? item.status === 'published'),
                })}
                formToPayload={(form) => ({
                  title: form.title,
                  slug: form.slug,
                  excerpt: form.excerpt,
                  content: form.content,
                  featured_image: form.featured_image || form.featured_image_url || null,
                  author: form.author || null,
                  published_at: form.published_at || null,
                  is_published: Boolean(form.is_published),
                })}
              />
            )}
            {active === 'placements' && (
              <CrudSection
                table="placements"
                title="Placements"
                subtitle="Manage placement highlights."
                refreshPaths={['/', '/placement']}
                fields={[
                  { name: 'title', label: 'Title' },
                  { name: 'company_name', label: 'Company Name' },
                  { name: 'location', label: 'Location' },
                  { name: 'package', label: 'Package' },
                  { name: 'role', label: 'Role' },
                  { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
                  { name: 'featured_image', label: 'Featured Image', type: 'file', bucket: 'placements' },
                  { name: 'is_active', label: 'Active', type: 'checkbox', default: true },
                ]}
              />
            )}
            {active === 'courses' && <CoursesAdmin />}
            {active === 'tools' && <ToolsAdmin />}
            {active === 'resources' && <ResourcesAdmin />}
            {active === 'locations' && (
              <CrudSection
                table="locations"
                title="Location SEO Pages"
                subtitle="Manage programmatic location SEO content."
                refreshPaths={['/']}
                fields={[
                  { name: 'name', label: 'Location Name' },
                  { name: 'slug', label: 'Slug' },
                  { name: 'meta_title', label: 'Meta Title' },
                  { name: 'meta_description', label: 'Meta Description', type: 'textarea', fullWidth: true },
                  { name: 'intro_text', label: 'Intro Text', type: 'textarea', fullWidth: true },
                  { name: 'why_text', label: 'Why Section', type: 'textarea', fullWidth: true },
                  { name: 'demand_text', label: 'Demand Section', type: 'textarea', fullWidth: true },
                  { name: 'is_active', label: 'Active', type: 'checkbox', default: true },
                ]}
              />
            )}

            {active === 'cohorts' && (
              <CrudSection
                table="cohorts"
                title="Upcoming Cohorts"
                subtitle="Manage upcoming cohort schedules."
                refreshPaths={['/']}
                fields={[
                  { name: 'cohort_date', label: 'Date', type: 'date' },
                  { name: 'mode', label: 'Mode' },
                  { name: 'weekday', label: 'Weekday' },
                  { name: 'capacity', label: 'Capacity' },
                  { name: 'campus', label: 'Campus' },
                  { name: 'cta_label', label: 'CTA Label' },
                  { name: 'limited_seats', label: 'Limited Seats', type: 'checkbox', default: true },
                  { name: 'order_index', label: 'Order', type: 'number', default: 0 },
                  { name: 'is_active', label: 'Active', type: 'checkbox', default: true },
                ]}
              />
            )}

            {active === 'testimonials' && (
              <CrudSection
                table="testimonials"
                title="Testimonials"
                subtitle="Add learner success stories."
                emptyState="No content yet. Click New to add your first entry."
                refreshPaths={['/', '/placement']}
                fields={[
                  { name: 'name', label: 'Name' },
                  { name: 'role', label: 'Role' },
                  { name: 'quote', label: 'Quote', type: 'textarea', fullWidth: true },
                  { name: 'image_url', label: 'Image URL' },
                  { name: 'video_url', label: 'Video URL' },
                  { name: 'order_index', label: 'Order', type: 'number', default: 0 },
                  { name: 'is_active', label: 'Active', type: 'checkbox', default: true },
                ]}
              />
            )}

            {active === 'hiring_partners' && (
              <CrudSection
                table="hiring_partners"
                title="Hiring Partners"
                subtitle="Manage partner logos for homepage marquee rows."
                refreshPaths={['/']}
                fields={[
                  { name: 'name', label: 'Company Name' },
                  { name: 'logo_url', label: 'Logo URL', type: 'file', bucket: 'partner-logos' },
                  {
                    name: 'row_group',
                    label: 'Row Group',
                    type: 'select',
                    options: [
                      { label: 'Row A', value: 'row_a' },
                      { label: 'Row B', value: 'row_b' },
                    ],
                  },
                  { name: 'order_index', label: 'Order', type: 'number', default: 0 },
                  { name: 'is_active', label: 'Active', type: 'checkbox', default: true },
                ]}
              />
            )}

            {active === 'faqs' && (
              <CrudSection
                table="faqs"
                title="FAQs"
                subtitle="Keep FAQs updated."
                refreshPaths={['/', '/contact', '/courses']}
                fields={[
                  { name: 'question', label: 'Question' },
                  { name: 'answer', label: 'Answer', type: 'textarea', fullWidth: true },
                  { name: 'order_index', label: 'Order', type: 'number', default: 0 },
                  { name: 'is_active', label: 'Active', type: 'checkbox', default: true },
                ]}
              />
            )}

            {active === 'alumni' && (
              <CrudSection
                table="alumni"
                title="Alumni Logos"
                subtitle="Add companies where learners got placed."
                refreshPaths={['/']}
                fields={[
                  { name: 'company', label: 'Company' },
                  { name: 'logo_url', label: 'Logo URL', type: 'file', bucket: 'gallery' },
                  { name: 'color', label: 'Color' },
                  { name: 'order_index', label: 'Order', type: 'number', default: 0 },
                  { name: 'is_active', label: 'Active', type: 'checkbox', default: true },
                ]}
              />
            )}

            {active === 'stats' && (
              <CrudSection
                table="stats"
                title="Stats"
                subtitle="Update headline metrics."
                refreshPaths={['/']}
                fields={[
                  { name: 'label', label: 'Label' },
                  { name: 'value', label: 'Value' },
                  { name: 'order_index', label: 'Order', type: 'number', default: 0 },
                  { name: 'is_active', label: 'Active', type: 'checkbox', default: true },
                ]}
              />
            )}

            {active === 'ticker' && (
              <CrudSection
                table="ticker"
                title="Ticker"
                subtitle="Update the scrolling updates bar."
                refreshPaths={['/']}
                fields={[
                  { name: 'text', label: 'Text', type: 'textarea', fullWidth: true },
                  { name: 'order_index', label: 'Order', type: 'number', default: 0 },
                  { name: 'is_active', label: 'Active', type: 'checkbox', default: true },
                ]}
              />
            )}

            {active === 'videos' && (
              <CrudSection
                table="videos"
                title="Videos"
                subtitle="Manage video highlights."
                refreshPaths={['/']}
                fields={[
                  { name: 'title', label: 'Title' },
                  { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
                  { name: 'url', label: 'Video URL' },
                  { name: 'thumbnail_url', label: 'Thumbnail', type: 'file', bucket: 'videos' },
                  { name: 'order_index', label: 'Order', type: 'number', default: 0 },
                  { name: 'is_active', label: 'Active', type: 'checkbox', default: true },
                  { name: 'is_featured', label: 'Featured', type: 'checkbox', default: false },
                ]}
              />
            )}

            {active === 'gallery' && (
              <CrudSection
                table="gallery"
                title="Gallery"
                subtitle="Campus images and videos."
                emptyState="No content yet. Click New to add your first entry."
                refreshPaths={['/']}
                fields={[
                  { name: 'title', label: 'Title' },
                  {
                    name: 'media_type',
                    label: 'Media Type',
                    type: 'select',
                    options: [
                      { label: 'Image', value: 'image' },
                      { label: 'Video', value: 'video' },
                    ],
                  },
                  { name: 'media_url', label: 'Media', type: 'file', bucket: 'gallery' },
                  { name: 'order_index', label: 'Order', type: 'number', default: 0 },
                  { name: 'is_active', label: 'Active', type: 'checkbox', default: true },
                  { name: 'is_featured', label: 'Featured', type: 'checkbox', default: false },
                ]}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminCmsDashboard


