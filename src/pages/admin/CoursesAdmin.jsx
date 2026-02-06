import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { Surface } from '../../components/ui/Surface'

export function CoursesAdmin() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    short_description: '',
    image_url: '',
    order_index: 0,
    is_published: true,
  })
  useEffect(() => {
    loadCourses()
  }, [])
  async function loadCourses() {
    setLoading(true)
    const { data } = await supabase
      .from('courses')
      .select('*')
      .order('order_index', { ascending: true })
    if (data) setCourses(data)
    setLoading(false)
  }
  function generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.slug) {
      formData.slug = generateSlug(formData.title)
    }
    try {
      if (editing) {
        await supabase.from('courses').update(formData).eq('id', editing.id)
      } else {
        await supabase.from('courses').insert([formData])
      }
      setEditing(null)
      setShowForm(false)
      setFormData({
        title: '',
        slug: '',
        description: '',
        short_description: '',
        image_url: '',
        order_index: 0,
        is_published: true,
      })
      loadCourses()
    } catch (err) {
      alert('Error: ' + err.message)
  async function handleDelete(id) {
    if (!confirm('Delete this course?')) return
    await supabase.from('courses').delete().eq('id', id)
  function startEdit(course) {
    setEditing(course)
    setShowForm(true)
    setFormData(course)
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-slate-50">Courses</h2>
        <button
          onClick={() => {
            setEditing(null)
            setShowForm(true)
            setFormData({
              title: '',
              slug: '',
              description: '',
              short_description: '',
              image_url: '',
              order_index: 0,
              is_published: true,
            })
          }}
          data-cursor="button"
          className="px-4 py-2 rounded-xl bg-teal-300 text-slate-950 font-semibold hover:bg-teal-200 transition-transform hover:-translate-y-0.5"
        >
          ➕ Add Course
        </button>
      </div>
      {(showForm || editing) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
          <Surface className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-50">{editing ? 'Edit' : 'Add'} Course</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value, slug: generateSlug(e.target.value) })
                    }}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
                  />
                </div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">Slug</label>
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              </div>
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
                  <label className="block text-sm font-medium text-slate-200 mb-1">Order Index</label>
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
                      slug: '',
                      description: '',
                      short_description: '',
                      image_url: '',
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-100">{course.title}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{course.slug}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{course.order_index}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        course.is_published ? 'bg-emerald-400/10 text-emerald-200 border border-emerald-400/20' : 'bg-white/[0.03] text-slate-300 border border-white/10'
                      }`}
                    >
                      {course.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => startEdit(course)}
                      data-cursor="hover"
                      className="text-teal-300 hover:text-teal-200 mr-3 font-semibold"
                      ✏️ Edit
                    </button>
                      onClick={() => handleDelete(course.id)}
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
