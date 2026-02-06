import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'
import { Surface } from '../../components/ui/Surface'

export function ResourcesAdmin() {
  const [resources, setResources] = useState([])
  const [courses, setCourses] = useState([])
  const [tools, setTools] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    resource_type: 'pdf',
    file_url: '',
    external_url: '',
    description: '',
    course_id: '',
    tool_id: '',
    order_index: 0,
    is_published: true,
  })
  useEffect(() => {
    loadData()
  }, [])
  async function loadData() {
    setLoading(true)
    const [resRes, coursesRes, toolsRes] = await Promise.all([
      supabase.from('resources').select('*, courses(title), tools(name)').order('created_at', { ascending: false }),
      supabase.from('courses').select('id, title').order('title'),
      supabase.from('tools').select('id, name').order('name'),
    ])
    if (resRes.data) setResources(resRes.data)
    if (coursesRes.data) setCourses(coursesRes.data)
    if (toolsRes.data) setTools(toolsRes.data)
    setLoading(false)
  }
  async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const bucket = formData.resource_type === 'pdf' ? 'pdfs' : formData.resource_type === 'video' ? 'videos' : formData.resource_type === 'image' ? 'images' : 'brochures'
      const { data, error } = await supabase.storage.from(bucket).upload(fileName, file)
      if (error) throw error
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName)
      setFormData({ ...formData, file_url: urlData.publicUrl })
    } catch (err) {
      alert('Upload error: ' + err.message)
    } finally {
      setUploading(false)
    }
  async function handleSubmit(e) {
    e.preventDefault()
      const data = { ...formData }
      if (!data.course_id) delete data.course_id
      if (!data.tool_id) delete data.tool_id
      if (editing) {
        await supabase.from('resources').update(data).eq('id', editing.id)
      } else {
        await supabase.from('resources').insert([data])
      }
      setEditing(null)
      setShowForm(false)
      setFormData({
        title: '',
        resource_type: 'pdf',
        file_url: '',
        external_url: '',
        description: '',
        course_id: '',
        tool_id: '',
        order_index: 0,
        is_published: true,
      })
      loadData()
      alert('Error: ' + err.message)
  async function handleDelete(id) {
    if (!confirm('Delete this resource?')) return
    await supabase.from('resources').delete().eq('id', id)
  function startEdit(resource) {
    setEditing(resource)
    setShowForm(true)
    setFormData(resource)
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-slate-50">Resources</h2>
        <button
          onClick={() => {
            setEditing(null)
            setShowForm(true)
            setFormData({
              title: '',
              resource_type: 'pdf',
              file_url: '',
              external_url: '',
              description: '',
              course_id: '',
              tool_id: '',
              order_index: 0,
              is_published: true,
            })
          }}
          data-cursor="button"
          className="px-4 py-2 rounded-xl bg-teal-300 text-slate-950 font-semibold hover:bg-teal-200 transition-transform hover:-translate-y-0.5"
        >
          ➕ Add Resource
        </button>
      </div>
      {(showForm || editing) && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Surface className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-50">{editing ? 'Edit' : 'Add'} Resource</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
                  />
                </div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">Resource Type *</label>
                  <select
                    value={formData.resource_type}
                    onChange={(e) => setFormData({ ...formData, resource_type: e.target.value })}
                  >
                    <option value="pdf" className="bg-[#050b12]">PDF</option>
                    <option value="video" className="bg-[#050b12]">Video</option>
                    <option value="image" className="bg-[#050b12]">Image</option>
                    <option value="brochure" className="bg-[#050b12]">Brochure</option>
                    <option value="llm_link" className="bg-[#050b12]">LLM Link</option>
                  </select>
              </div>
              {(formData.resource_type !== 'llm_link') && (
                  <label className="block text-sm font-medium text-slate-200 mb-1">Upload File</label>
                    type="file"
                    accept={formData.resource_type === 'pdf' ? '.pdf' : formData.resource_type === 'video' ? 'video/*' : 'image/*'}
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 file:mr-4 file:rounded-lg file:border-0 file:bg-white/[0.06] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-100 hover:file:bg-white/[0.10]"
                  {uploading && <p className="text-sm text-slate-400 mt-2">Uploading…</p>}
                  {formData.file_url && (
                    <p className="text-sm text-emerald-200 mt-2">✓ File uploaded</p>
                  )}
              )}
              {formData.resource_type === 'llm_link' && (
                  <label className="block text-sm font-medium text-slate-200 mb-1">External URL *</label>
                    type="url"
                    value={formData.external_url}
                    onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
                />
                  <label className="block text-sm font-medium text-slate-200 mb-1">Course (optional)</label>
                    value={formData.course_id || ''}
                    onChange={(e) => setFormData({ ...formData, course_id: e.target.value || null })}
                    <option value="" className="bg-[#050b12]">None</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#050b12]">
                        {c.title}
                      </option>
                    ))}
                  <label className="block text-sm font-medium text-slate-200 mb-1">Tool (optional)</label>
                    value={formData.tool_id || ''}
                    onChange={(e) => setFormData({ ...formData, tool_id: e.target.value || null })}
                    {tools.map((t) => (
                      <option key={t.id} value={t.id} className="bg-[#050b12]">
                        {t.name}
                <label className="block text-sm font-medium text-slate-200 mb-1">Order Index</label>
                <input
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
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
                      title: '',
                      resource_type: 'pdf',
                      file_url: '',
                      external_url: '',
                      description: '',
                      course_id: '',
                      tool_id: '',
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Course/Tool</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {resources.map((res) => (
                <tr key={res.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-100">{res.title}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{res.resource_type}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {res.courses?.title || res.tools?.name || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        res.is_published ? 'bg-emerald-400/10 text-emerald-200 border border-emerald-400/20' : 'bg-white/[0.03] text-slate-300 border border-white/10'
                      }`}
                    >
                      {res.is_published ? 'Published' : 'Draft'}
                    </span>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => startEdit(res)}
                      data-cursor="hover"
                      className="text-teal-300 hover:text-teal-200 mr-3 font-semibold"
                      ✏️ Edit
                    </button>
                      onClick={() => handleDelete(res.id)}
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
