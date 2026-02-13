import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { motion } from 'framer-motion'
import { Surface } from '../../components/ui/Surface'

const emptyForm = {
  title: '',
  description: '',
  file_url: '',
  external_url: '',
  course_id: '',
  tool_id: '',
  order_index: 0,
  is_published: true,
}

export function ResourcesAdmin() {
  const [resources, setResources] = useState([])
  const [courses, setCourses] = useState([])
  const [tools, setTools] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [uploadBucket, setUploadBucket] = useState('pdfs')
  const [uploadFile, setUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [{ data: resourcesData }, { data: coursesData }, { data: toolsData }] = await Promise.all([
      supabase.from('resources').select('*, courses(title)').order('created_at', { ascending: false }),
      supabase.from('courses').select('id, title').order('order_index', { ascending: true }),
      supabase.from('tools_extended').select('id, name').order('created_at', { ascending: false }),
    ])

    if (resourcesData) setResources(resourcesData)
    if (coursesData) setCourses(coursesData)
    if (toolsData) setTools(toolsData)
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      ...formData,
      course_id: formData.course_id || null,
      tool_id: formData.tool_id || null,
    }

    try {
      if (editing) {
        await supabase.from('resources').update(payload).eq('id', editing.id)
      } else {
        await supabase.from('resources').insert([payload])
      }
      setEditing(null)
      setShowForm(false)
      setFormData(emptyForm)
      loadData()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this resource?')) return
    await supabase.from('resources').delete().eq('id', id)
    loadData()
  }

  function startEdit(resource) {
    setEditing(resource)
    setShowForm(true)
    setUploadFile(null)
    setUploadError('')
    setFormData({
      title: resource.title || '',
      description: resource.description || '',
      file_url: resource.file_url || '',
      external_url: resource.external_url || '',
      course_id: resource.course_id || '',
      tool_id: resource.tool_id || '',
      order_index: resource.order_index ?? 0,
      is_published: Boolean(resource.is_published),
    })
  }

  async function handleUpload() {
    if (!uploadFile) {
      setUploadError('Select a file to upload.')
      return
    }
    setUploading(true)
    setUploadError('')
    const safeName = uploadFile.name.replace(/\s+/g, '-')
    const filePath = `${Date.now()}-${safeName}`
    const { error } = await supabase.storage.from(uploadBucket).upload(filePath, uploadFile, {
      upsert: true,
    })
    if (error) {
      setUploadError(error.message)
    } else {
      const { data } = supabase.storage.from(uploadBucket).getPublicUrl(filePath)
      setFormData((prev) => ({ ...prev, file_url: data?.publicUrl || '' }))
    }
    setUploading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-semibold text-slate-50">Resources</h2>
        <button
          type="button"
          onClick={() => {
            setShowForm(true)
            setEditing(null)
            setFormData(emptyForm)
            setUploadFile(null)
            setUploadError('')
          }}
          data-cursor="button"
          className="px-4 py-2 rounded-xl bg-teal-300 text-slate-950 font-semibold hover:bg-teal-200 transition-transform hover:-translate-y-0.5"
        >
          + Add Resource
        </button>
      </div>

      {(showForm || editing) && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Surface className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-50">{editing ? 'Edit' : 'Add'} Resource</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">File URL</label>
                  <input
                    type="url"
                    value={formData.file_url}
                    onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">External URL</label>
                  <input
                    type="url"
                    value={formData.external_url}
                    onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">Upload Bucket</label>
                  <select
                    value={uploadBucket}
                    onChange={(e) => setUploadBucket(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
                  >
                    <option value="pdfs" className="bg-[#050b12]">PDFs</option>
                    <option value="videos" className="bg-[#050b12]">Videos</option>
                    <option value="brochures" className="bg-[#050b12]">Brochures</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-200 mb-1">Upload File</label>
                  <div className="flex flex-col md:flex-row gap-3">
                    <input
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
                    />
                    <button
                      type="button"
                      onClick={handleUpload}
                      disabled={uploading}
                      className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05]"
                    >
                      {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                  {uploadError && <div className="mt-2 text-sm text-rose-300">{uploadError}</div>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">Course</label>
                  <select
                    value={formData.course_id}
                    onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
                  >
                    <option value="">None</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id} className="bg-[#050b12]">
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">Tool</label>
                  <select
                    value={formData.tool_id}
                    onChange={(e) => setFormData({ ...formData, tool_id: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
                  >
                    <option value="">None</option>
                    {tools.map((tool) => (
                      <option key={tool.id} value={tool.id} className="bg-[#050b12]">
                        {tool.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">Order Index</label>
                  <input
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value, 10) || 0 })}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="resource_published"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <label htmlFor="resource_published" className="text-sm text-slate-200">
                    Published
                  </label>
                </div>
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
                    setUploadFile(null)
                    setUploadError('')
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Tool</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {resources.map((res) => (
                  <tr key={res.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-100">{res.title}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{res.courses?.title || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {tools.find((t) => t.id === res.tool_id)?.name || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          res.is_published
                            ? 'bg-emerald-400/10 text-emerald-200 border border-emerald-400/20'
                            : 'bg-white/[0.03] text-slate-300 border border-white/10'
                        }`}
                      >
                        {res.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => startEdit(res)}
                        data-cursor="hover"
                        className="text-teal-300 hover:text-teal-200 mr-3 font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(res.id)}
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
