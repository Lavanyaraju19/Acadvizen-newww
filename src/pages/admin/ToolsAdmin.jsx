import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'
import { Surface } from '../../components/ui/Surface'

export function ToolsAdmin() {
  const [tools, setTools] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    category: '',
    image_url: '',
    link_url: '',
    order_index: 0,
    is_published: true,
  })
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
  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.slug) {
      formData.slug = generateSlug(formData.name)
    }
    try {
      if (editing) {
        await supabase.from('tools').update(formData).eq('id', editing.id)
      } else {
        await supabase.from('tools').insert([formData])
      }
      setEditing(null)
      setShowForm(false)
      setFormData({
        name: '',
        slug: '',
        description: '',
        short_description: '',
        category: '',
        image_url: '',
        link_url: '',
        order_index: 0,
        is_published: true,
      })
      loadTools()
    } catch (err) {
      alert('Error: ' + err.message)
  async function handleDelete(id) {
    if (!confirm('Delete this tool?')) return
    await supabase.from('tools').delete().eq('id', id)
  function startEdit(tool) {
    setEditing(tool)
    setShowForm(true)
    setFormData(tool)
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-slate-50">Tools</h2>
        <button
          onClick={() => {
            setEditing(null)
            setShowForm(true)
            setFormData({
              name: '',
              slug: '',
              description: '',
              short_description: '',
              category: '',
              image_url: '',
              link_url: '',
              order_index: 0,
              is_published: true,
            })
          }}
          data-cursor="button"
          className="px-4 py-2 rounded-xl bg-teal-300 text-slate-950 font-semibold hover:bg-teal-200 transition-transform hover:-translate-y-0.5"
        >
          ➕ Add Tool
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
                      setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })
                    }}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
                  />
                </div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">Slug</label>
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              </div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">Category</label>
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  <label className="block text-sm font-medium text-slate-200 mb-1">Order Index</label>
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">Short Description</label>
                <input
                  type="text"
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
                />
                <label className="block text-sm font-medium text-slate-200 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  <label className="block text-sm font-medium text-slate-200 mb-1">Image URL</label>
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  <label className="block text-sm font-medium text-slate-200 mb-1">Link URL</label>
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
              <div className="flex items-center gap-2">
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                <label htmlFor="is_published" className="text-sm text-slate-200">
                  Published
                </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  data-cursor="button"
                  className="px-4 py-2 rounded-xl bg-teal-300 text-slate-950 font-semibold hover:bg-teal-200 transition-transform hover:-translate-y-0.5"
                >
                  {editing ? 'Update' : 'Create'}
                </button>
                  type="button"
                  onClick={() => {
                    setEditing(null)
                    setShowForm(false)
                    setFormData({
                      name: '',
                      slug: '',
                      description: '',
                      short_description: '',
                      category: '',
                      image_url: '',
                      link_url: '',
                      order_index: 0,
                      is_published: true,
                    })
                  }}
                  data-cursor="hover"
                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05]"
                  Cancel
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
                        tool.is_published ? 'bg-emerald-400/10 text-emerald-200 border border-emerald-400/20' : 'bg-white/[0.03] text-slate-300 border border-white/10'
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
                      ✏️ Edit
                    </button>
                      onClick={() => handleDelete(tool.id)}
                      className="text-rose-300 hover:text-rose-200 font-semibold"
                      🗑 Delete
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Surface>
    </div>
  )
}
