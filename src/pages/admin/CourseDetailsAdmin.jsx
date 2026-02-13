import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { motion } from 'framer-motion'
import { Surface } from '../../components/ui/Surface'

const emptyForm = {
  course_id: '',
  section_title: '',
  content: '',
  order_index: 0,
}

export function CourseDetailsAdmin() {
  const [details, setDetails] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState(emptyForm)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [{ data: detailsData }, { data: coursesData }] = await Promise.all([
      supabase.from('course_details').select('*, courses(title)').order('order_index', { ascending: true }),
      supabase.from('courses').select('id, title').order('order_index', { ascending: true }),
    ])
    if (detailsData) setDetails(detailsData)
    if (coursesData) setCourses(coursesData)
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = { ...formData, course_id: formData.course_id || null }

    try {
      if (editing) {
        await supabase.from('course_details').update(payload).eq('id', editing.id)
      } else {
        await supabase.from('course_details').insert([payload])
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
    if (!confirm('Delete this course detail?')) return
    await supabase.from('course_details').delete().eq('id', id)
    loadData()
  }

  function startEdit(detail) {
    setEditing(detail)
    setShowForm(true)
    setFormData({
      course_id: detail.course_id || '',
      section_title: detail.section_title || '',
      content: detail.content || '',
      order_index: detail.order_index ?? 0,
    })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-slate-50">Course Details</h2>
        <button
          onClick={() => {
            setEditing(null)
            setShowForm(true)
            setFormData(emptyForm)
          }}
          data-cursor="button"
          className="px-4 py-2 rounded-xl bg-teal-300 text-slate-950 font-semibold hover:bg-teal-200 transition-transform hover:-translate-y-0.5"
        >
          + Add Detail
        </button>
      </div>

      {(showForm || editing) && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Surface className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-50">{editing ? 'Edit' : 'Add'} Detail</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">Course *</label>
                <select
                  required
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
                >
                  <option value="">Select course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id} className="bg-[#050b12]">
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">Section Title</label>
                <input
                  type="text"
                  value={formData.section_title}
                  onChange={(e) => setFormData({ ...formData, section_title: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">Content</label>
                <textarea
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Section</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {details.map((detail) => (
                  <tr key={detail.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-100">{detail.courses?.title || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{detail.section_title || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{detail.order_index}</td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => startEdit(detail)}
                        data-cursor="hover"
                        className="text-teal-300 hover:text-teal-200 mr-3 font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(detail.id)}
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
