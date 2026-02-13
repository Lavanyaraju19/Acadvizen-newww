import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { Surface } from '../../components/ui/Surface'
import { CoursesAdmin } from './CoursesAdmin'
import { ToolsAdmin } from './ToolsAdmin'
import { ResourcesAdmin } from './ResourcesAdmin'

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
    const safeName = file.name.replace(/\s+/g, '-')
    const path = `${Date.now()}-${safeName}`
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (uploadError) {
      setError(uploadError.message)
    } else {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      onUploaded(data?.publicUrl || '')
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

function CrudSection({ table, title, subtitle, fields, orderBy = 'order_index' }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [formError, setFormError] = useState('')

  const resetForm = () => {
    const initial = {}
    fields.forEach((field) => {
      if (field.type === 'checkbox') initial[field.name] = field.default ?? false
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
    const next = {}
    fields.forEach((field) => {
      if (field.type === 'json') {
        next[field.name] = item[field.name] ? JSON.stringify(item[field.name], null, 2) : ''
      } else {
        next[field.name] = item[field.name] ?? (field.type === 'checkbox' ? false : '')
      }
    })
    setForm(next)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')
    const payload = { ...form }
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
              return
            }
          }
        }
      }
    }
    if (editing) {
      await supabase.from(table).update(payload).eq('id', editing.id)
    } else {
      await supabase.from(table).insert([payload])
    }
    setEditing(null)
    resetForm()
    loadItems()
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
        {formError && <div className="md:col-span-2 text-xs text-rose-300">{formError}</div>}
        <div className="md:col-span-2 flex gap-3">
          <button
            type="submit"
            className="rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200"
          >
            {editing ? 'Update' : 'Create'}
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
          <div className="text-sm text-slate-400">No items yet.</div>
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
      navigate('/admin/login', { replace: true })
    }
  }, [user, profile, loading, navigate])

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
                subtitle="Edit homepage text, CTAs, and lists using JSON where needed."
                fields={[
                  { name: 'section_key', label: 'Section Key' },
                  { name: 'title', label: 'Title' },
                  { name: 'subtitle', label: 'Subtitle' },
                  { name: 'body', label: 'Body', type: 'textarea', fullWidth: true },
                  { name: 'items_json', label: 'Items JSON', type: 'json', fullWidth: true },
                  { name: 'cta_json', label: 'CTA JSON', type: 'json', fullWidth: true },
                  { name: 'order_index', label: 'Order', type: 'number', default: 0 },
                  { name: 'is_active', label: 'Active', type: 'checkbox', default: true },
                ]}
              />
            )}
            {active === 'page_content' && (
              <CrudSection
                table="page_sections"
                title="Page Content"
                subtitle="Edit headings, copy, and empty states for other pages."
                fields={[
                  { name: 'page_slug', label: 'Page Slug' },
                  { name: 'section_key', label: 'Section Key' },
                  { name: 'title', label: 'Title' },
                  { name: 'subtitle', label: 'Subtitle' },
                  { name: 'body', label: 'Body', type: 'textarea', fullWidth: true },
                  { name: 'items_json', label: 'Items JSON', type: 'json', fullWidth: true },
                  { name: 'cta_json', label: 'CTA JSON', type: 'json', fullWidth: true },
                  { name: 'order_index', label: 'Order', type: 'number', default: 0 },
                  { name: 'is_active', label: 'Active', type: 'checkbox', default: true },
                ]}
              />
            )}
            {active === 'blog_posts' && (
              <CrudSection
                table="blog_posts"
                title="Blog Posts"
                subtitle="Create and publish blog posts."
                fields={[
                  { name: 'title', label: 'Title' },
                  { name: 'slug', label: 'Slug' },
                  { name: 'excerpt', label: 'Excerpt', type: 'textarea', fullWidth: true },
                  { name: 'content', label: 'Content', type: 'textarea', fullWidth: true },
                  { name: 'featured_image', label: 'Featured Image', type: 'file', bucket: 'blog' },
                  { name: 'author', label: 'Author' },
                  { name: 'published_at', label: 'Published At', type: 'datetime-local' },
                  { name: 'is_published', label: 'Published', type: 'checkbox', default: true },
                ]}
              />
            )}
            {active === 'placements' && (
              <CrudSection
                table="placements"
                title="Placements"
                subtitle="Manage placement highlights."
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

            {active === 'cohorts' && (
              <CrudSection
                table="cohorts"
                title="Upcoming Cohorts"
                subtitle="Manage upcoming cohort schedules."
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
                fields={[
                  { name: 'name', label: 'Company Name' },
                  { name: 'logo_url', label: 'Logo URL', type: 'file', bucket: 'gallery' },
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
