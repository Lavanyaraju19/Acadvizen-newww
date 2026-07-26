'use client'

import { useState, useEffect } from 'react'
import { Surface } from '../../../../src/components/ui/Surface'
import { adminApiFetch } from '../../../../lib/adminApiClient'
import { 
  Plus, 
  Trash2, 
  Edit,
  GripVertical,
  ChevronUp,
  ChevronDown,
  X,
  Minus,
  Plus as AddIcon
} from 'lucide-react'

export default function CurriculumBuilderClient() {
  const [curriculumItems, setCurriculumItems] = useState([])
  const [editingItem, setEditingItem] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    items: [],
    order_index: 0,
    is_active: true,
  })

  useEffect(() => {
    loadCurriculum()
  }, [])

  async function loadCurriculum() {
    setLoading(true)
    setStatus('')
    try {
      const data = await adminApiFetch('/api/cms/homepage/curriculum', { cache: 'no-store' })
      const items = Array.isArray(data) ? data : (data.data || [])
      setCurriculumItems(items.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)))
    } catch (error) {
      setStatus(error?.message || 'Failed to load curriculum items.')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      description: '',
      items: [],
      order_index: curriculumItems.length,
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
      items: Array.isArray(item.items) ? item.items : [],
      order_index: item.order_index || 0,
      is_active: item.is_active !== undefined ? item.is_active : true,
    })
    setEditingItem(item)
    setIsAdding(false)
  }

  async function saveCurriculumItem(e) {
    e.preventDefault()
    setSaving(true)
    setStatus('')
    
    try {
      const payload = { ...formData }
      if (editingItem) {
        payload.id = editingItem.id
      }
      
      await adminApiFetch('/api/cms/homepage/curriculum', {
        method: 'POST',
        body: payload,
      })
      
      await loadCurriculum()
      resetForm()
      setStatus('Curriculum item saved successfully.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save curriculum item.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteCurriculumItem(id) {
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/homepage/curriculum/${id}`, {
        method: 'DELETE',
      })
      await loadCurriculum()
      setShowDeleteConfirm(null)
      setStatus('Curriculum item deleted successfully.')
    } catch (error) {
      setStatus(error?.message || 'Failed to delete curriculum item.')
    } finally {
      setSaving(false)
    }
  }

  function moveItemUp(index) {
    if (index === 0) return
    const newItems = [...curriculumItems]
    const [removed] = newItems.splice(index, 1)
    newItems.splice(index - 1, 0, removed)
    
    const updatedItems = newItems.map((item, i) => ({ ...item, order_index: i }))
    setCurriculumItems(updatedItems)
    saveOrder(updatedItems)
  }

  function moveItemDown(index) {
    if (index === curriculumItems.length - 1) return
    const newItems = [...curriculumItems]
    const [removed] = newItems.splice(index, 1)
    newItems.splice(index + 1, 0, removed)
    
    const updatedItems = newItems.map((item, i) => ({ ...item, order_index: i }))
    setCurriculumItems(updatedItems)
    saveOrder(updatedItems)
  }

  async function saveOrder(items) {
    try {
      for (const item of items) {
        await adminApiFetch('/api/cms/homepage/curriculum', {
          method: 'POST',
          body: { ...item, order_index: item.order_index },
        })
      }
    } catch (error) {
      console.error('Failed to save order:', error)
    }
  }

  function addCurriculumItem() {
    setFormData({ ...formData, items: [...formData.items, ''] })
  }

  function updateCurriculumItem(index, value) {
    const newItems = [...formData.items]
    newItems[index] = value
    setFormData({ ...formData, items: newItems })
  }

  function removeCurriculumItem(index) {
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) })
  }

  if (loading) {
    return (
      <Surface className="p-6 md:p-8">
        <div className="text-center text-slate-400">Loading curriculum...</div>
      </Surface>
    )
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Curriculum Builder</h2>
          <p className="mt-1 text-sm text-slate-300">Manage homepage curriculum sections</p>
        </div>
        <button
          type="button"
          onClick={startAdd}
          className="px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Add Section
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
          <h3 className="text-base font-semibold text-slate-100">All Sections ({curriculumItems.length})</h3>
          
          {curriculumItems.length === 0 ? (
            <div className="p-8 rounded-xl border border-white/10 bg-white/[0.03] text-center text-slate-400">
              No curriculum sections yet. Click "Add Section" to create one.
            </div>
          ) : (
            curriculumItems.map((item, index) => (
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
                    <p className="text-xs text-slate-400 mb-2 line-clamp-2">{item.description}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>Items: {Array.isArray(item.items) ? item.items.length : 0}</span>
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
                      disabled={index === curriculumItems.length - 1}
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
                {isAdding ? 'Add New Section' : 'Edit Section'}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={saveCurriculumItem} className="space-y-4">
              <label className="text-xs text-slate-400">
                Title *
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="e.g., Module 1: Introduction"
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
                  placeholder="Describe this curriculum section..."
                  required
                />
              </label>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-400">Curriculum Items</label>
                  <button
                    type="button"
                    onClick={addCurriculumItem}
                    className="p-1 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                  >
                    <AddIcon className="w-3 h-3" />
                  </button>
                </div>
                
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateCurriculumItem(index, e.target.value)}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      placeholder={`Item ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeCurriculumItem(index)}
                      className="p-2 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {formData.items.length === 0 && (
                  <p className="text-xs text-slate-500">No items added yet.</p>
                )}
              </div>

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
                  {saving ? 'Saving...' : 'Save Section'}
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
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Delete Section?</h3>
              <p className="text-sm text-slate-400 mb-6">
                This action cannot be undone. Are you sure you want to delete this curriculum section?
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
                  onClick={() => deleteCurriculumItem(showDeleteConfirm)}
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
