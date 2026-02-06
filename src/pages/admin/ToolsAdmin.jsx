import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'
import { Surface } from '../../components/ui/Surface'

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  short_description: '',
  category: '',
  image_url: '',
  link_url: '',
  order_index: 0,
  is_published: true,
}

export function ToolsAdmin() {
  const [tools, setTools] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState(emptyForm)

  useEffect(() => {
    loadTools()
  }, [])

  async function loadTools() {
    setLoading(true)
    const { data } = await supabase
      .from('tools')
      .select('*')
      .order('order_index', { ascending: true })
    if (data) setTools(data)
    setLoading(false)
  }

  function generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      ...formData,
      slug: formData.slug || generateSlug(formData.name),
    }

    try {
      if (editing) {
        await supabase.from('tools').update(payload).eq('id', editing.id)
      } else {
        await supabase.from('tools').insert([payload])
      }
      setEditing(null)
      setShowForm(false)
      setFormData(emptyForm)
      loadTools()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this tool?')) return
    await supabase.from('tools').delete().eq('id', id)
    loadTools()
  }

  function startEdit(tool) {
    setEditing(tool)
    setShowForm(true)
    setFormData({
      name: tool.name || '',
      slug: tool.slug || '',
      description: tool.description || '',
      short_description: tool.short_description || '',
      category: tool.category || '',
      image_url: tool.image_url || '',
      link_url: tool.link_url || '',
      order_index: tool.order_index ?? 0,
      is_published: Boolean(tool.is_published),
    })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-slate-50">Tools</h2>
        <button
          onClick={() => {
            setEditing(null)
            setShowForm(true)
            setFormData(emptyForm)
          }}
          data-cursor="button"
          className="px-4 py-2 rounded-xl bg-teal-300 text-slate-950 font-semibold hover:bg-teal-200 transition-transform hover:-translate-y-0.5"
        >
          + Add Tool
        </button>
      </div>

      {(showForm || editing) && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Surface className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-50">{editing ? 'Edit' : 'Add'} Tool</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value
                      setFormData({ ...formData, name, slug: generateSlug(name) })
                    }}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">Order Index</label>
                  <input
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value, 10) || 0 })}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">Short Description</label>
                <input
                  type="text"
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">Link URL</label>
                  <input
                    type="url"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="h-4 w-4"
                />
                <label htmlFor="is_published" className="text-sm text-slate-200">
                  Published
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  data-cursor="button"
                  className="px-4 py-2 rounded-xl bg-teal-300 text-slate-950 font-semibold hover:bg-teal-200 transition-transform hover:-translate-y-0.5"
                >
                  {editing ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null)
                    setShowForm(false)
                    setFormData(emptyForm)
                  }}
                  data-cursor="hover"
                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Surface>
        </motion.div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-300/70 mx-auto" />
        </div>
      ) : (
        <Surface className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/[0.03]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {tools.map((tool) => (
                  <tr key={tool.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-100">{tool.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{tool.category || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{tool.order_index}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          tool.is_published
                            ? 'bg-emerald-400/10 text-emerald-200 border border-emerald-400/20'
                            : 'bg-white/[0.03] text-slate-300 border border-white/10'
                        }`}
                      >
                        {tool.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => startEdit(tool)}
                        data-cursor="hover"
                        className="text-teal-300 hover:text-teal-200 mr-3 font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tool.id)}
                        className="text-rose-300 hover:text-rose-200 font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>
      )}
    </div>
  )
}
