'use client'

import { useState, useEffect } from 'react'
import { Surface } from '../../../../src/components/ui/Surface'
import { adminApiFetch } from '../../../../lib/adminApiClient'
import { uploadFileAsset } from '../../../../lib/storageUpload'
import { 
  Plus, 
  Trash2, 
  Save, 
  Edit,
  GripVertical,
  ChevronUp,
  ChevronDown,
  X,
  Star,
  Check
} from 'lucide-react'

const ICON_OPTIONS = [
  { value: 'book-open', label: 'Book Open' },
  { value: 'graduation-cap', label: 'Graduation Cap' },
  { value: 'award', label: 'Award' },
  { value: 'target', label: 'Target' },
  { value: 'zap', label: 'Lightning' },
  { value: 'rocket', label: 'Rocket' },
  { value: 'users', label: 'Users' },
  { value: 'briefcase', label: 'Briefcase' },
  { value: 'code', label: 'Code' },
  { value: 'database', label: 'Database' },
  { value: 'shield', label: 'Shield' },
  { value: 'trending-up', label: 'Trending Up' },
]

export default function CourseHighlightsBuilderClient() {
  const [highlights, setHighlights] = useState([])
  const [editingItem, setEditingItem] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'star',
    order_index: 0,
    is_active: true,
  })

  useEffect(() => {
    loadHighlights()
  }, [])

  async function loadHighlights() {
    setLoading(true)
    setStatus('')
    try {
      const data = await adminApiFetch('/api/cms/homepage/course-highlights', { cache: 'no-store' })
      const items = Array.isArray(data) ? data : (data.data || [])
      setHighlights(items.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)))
    } catch (error) {
      setStatus(error?.message || 'Failed to load course highlights.')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      description: '',
      icon: 'star',
      order_index: highlights.length,
      is_active: true,
    })
    setEditingItem(null)
    setIsAdding(false)
  }

  function startAdd() {
    resetForm()
    setIsAdding(true)
  }

  function startEdit(item) {
    setFormData({
      title: item.title || '',
      description: item.description || '',
      icon: item.icon || 'star',
      order_index: item.order_index || 0,
      is_active: item.is_active !== undefined ? item.is_active : true,
    })
    setEditingItem(item)
    setIsAdding(false)
  }

  async function saveHighlight(e) {
    e.preventDefault()
    setSaving(true)
    setStatus('')
    
    try {
      const payload = { ...formData }
      if (editingItem) {
        payload.id = editingItem.id
      }
      
      await adminApiFetch('/api/cms/homepage/course-highlights', {
        method: 'POST',
        body: payload,
      })
      
      await loadHighlights()
      resetForm()
      setStatus('Course highlight saved successfully.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save course highlight.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteHighlight(id) {
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/homepage/course-highlights/${id}`, {
        method: 'DELETE',
      })
      await loadHighlights()
      setShowDeleteConfirm(null)
      setStatus('Course highlight deleted successfully.')
    } catch (error) {
      setStatus(error?.message || 'Failed to delete course highlight.')
    } finally {
      setSaving(false)
    }
  }

  function moveItemUp(index) {
    if (index === 0) return
    const newItems = [...highlights]
    const [removed] = newItems.splice(index, 1)
    newItems.splice(index - 1, 0, removed)
    
    const updatedItems = newItems.map((item, i) => ({ ...item, order_index: i }))
    setHighlights(updatedItems)
    saveOrder(updatedItems)
  }

  function moveItemDown(index) {
    if (index === highlights.length - 1) return
    const newItems = [...highlights]
    const [removed] = newItems.splice(index, 1)
    newItems.splice(index + 1, 0, removed)
    
    const updatedItems = newItems.map((item, i) => ({ ...item, order_index: i }))
    setHighlights(updatedItems)
    saveOrder(updatedItems)
  }

  async function saveOrder(items) {
    try {
      for (const item of items) {
        await adminApiFetch('/api/cms/homepage/course-highlights', {
          method: 'POST',
          body: { ...item, order_index: item.order_index },
        })
      }
    } catch (error) {
      console.error('Failed to save order:', error)
    }
  }

  if (loading) {
    return (
      <Surface className="p-6 md:p-8">
        <div className="text-center text-slate-400">Loading course highlights...</div>
      </Surface>
    )
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Course Highlights Builder</h2>
          <p className="mt-1 text-sm text-slate-300">Manage homepage course highlights</p>
        </div>
        <button
          type="button"
          onClick={startAdd}
          className="px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Add Highlight
        </button>
      </div>

      {status && (
        <div className={`mb-4 p-3 rounded-xl border text-sm ${
          status.includes('success') || status.includes('saved')
            ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {status}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* List View */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-slate-100">All Highlights ({highlights.length})</h3>
          
          {highlights.length === 0 ? (
            <div className="p-8 rounded-xl border border-white/10 bg-white/[0.03] text-center text-slate-400">
              No course highlights yet. Click &quot;Add Highlight&quot; to create one.
            </div>
          ) : (
            highlights.map((item, index) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-colors ${
                  editingItem?.id === item.id
                    ? 'border-teal-500/50 bg-teal-500/10'
                    : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <GripVertical className="w-5 h-5 text-slate-500 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-200">{item.title}</span>
                      {item.is_active ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-teal-500/20 text-teal-300">Active</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-500/20 text-slate-400">Inactive</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      <span>Icon: {item.icon}</span>
                      <span>•</span>
                      <span>Order: {item.order_index}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => moveItemUp(index)}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItemDown(index)}
                      disabled={index === highlights.length - 1}
                      className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(item.id)}
                      className="p-1.5 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Form */}
        {(isAdding || editingItem) && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-100">
                {isAdding ? 'Add New Highlight' : 'Edit Highlight'}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={saveHighlight} className="space-y-4">
              <label className="text-xs text-slate-400">
                Title *
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="e.g., Industry Expert Instructors"
                  required
                />
              </label>

              <label className="text-xs text-slate-400">
                Description *
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="Describe this highlight..."
                  required
                />
              </label>

              <label className="text-xs text-slate-400">
                Icon
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                >
                  {ICON_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-slate-400">
                Order Index
                <input
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  min="0"
                />
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-400 p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-white/10 bg-white/[0.03]"
                />
                Active (show on homepage)
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 disabled:opacity-50 text-sm font-medium"
                >
                  {saving ? 'Saving...' : 'Save Highlight'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/[0.05] text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Delete Highlight?</h3>
              <p className="text-sm text-slate-400 mb-6">
                This action cannot be undone. Are you sure you want to delete this course highlight?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/[0.05]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => deleteHighlight(showDeleteConfirm)}
                  disabled={saving}
                  className="flex-1 px-4 py-2 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 disabled:opacity-50"
                >
                  {saving ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Surface>
  )
}
