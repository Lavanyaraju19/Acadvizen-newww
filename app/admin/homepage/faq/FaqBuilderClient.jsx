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
  HelpCircle
} from 'lucide-react'

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'course', label: 'Course' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'technical', label: 'Technical' },
  { value: 'career', label: 'Career' },
  { value: 'certification', label: 'Certification' },
]

export default function FaqBuilderClient() {
  const [faqs, setFaqs] = useState([])
  const [editingItem, setEditingItem] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'general',
    order_index: 0,
    is_active: true,
  })

  useEffect(() => {
    loadFaqs()
  }, [])

  async function loadFaqs() {
    setLoading(true)
    setStatus('')
    try {
      const data = await adminApiFetch('/api/cms/homepage/faq', { cache: 'no-store' })
      const items = Array.isArray(data) ? data : (data.data || [])
      setFaqs(items.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)))
    } catch (error) {
      setStatus(error?.message || 'Failed to load FAQs.')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      question: '',
      answer: '',
      category: 'general',
      order_index: faqs.length,
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
      question: item.question || '',
      answer: item.answer || '',
      category: item.category || 'general',
      order_index: item.order_index || 0,
      is_active: item.is_active !== undefined ? item.is_active : true,
    })
    setEditingItem(item)
    setIsAdding(false)
  }

  async function saveFaq(e) {
    e.preventDefault()
    setSaving(true)
    setStatus('')
    
    try {
      const payload = { ...formData }
      if (editingItem) {
        payload.id = editingItem.id
      }
      
      await adminApiFetch('/api/cms/homepage/faq', {
        method: 'POST',
        body: payload,
      })
      
      await loadFaqs()
      resetForm()
      setStatus('FAQ saved successfully.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save FAQ.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteFaq(id) {
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/homepage/faq/${id}`, {
        method: 'DELETE',
      })
      await loadFaqs()
      setShowDeleteConfirm(null)
      setStatus('FAQ deleted successfully.')
    } catch (error) {
      setStatus(error?.message || 'Failed to delete FAQ.')
    } finally {
      setSaving(false)
    }
  }

  function moveItemUp(index) {
    if (index === 0) return
    const newItems = [...faqs]
    const [removed] = newItems.splice(index, 1)
    newItems.splice(index - 1, 0, removed)
    
    const updatedItems = newItems.map((item, i) => ({ ...item, order_index: i }))
    setFaqs(updatedItems)
    saveOrder(updatedItems)
  }

  function moveItemDown(index) {
    if (index === faqs.length - 1) return
    const newItems = [...faqs]
    const [removed] = newItems.splice(index, 1)
    newItems.splice(index + 1, 0, removed)
    
    const updatedItems = newItems.map((item, i) => ({ ...item, order_index: i }))
    setFaqs(updatedItems)
    saveOrder(updatedItems)
  }

  async function saveOrder(items) {
    try {
      for (const item of items) {
        await adminApiFetch('/api/cms/homepage/faq', {
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
        <div className="text-center text-slate-400">Loading FAQs...</div>
      </Surface>
    )
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">FAQ Builder</h2>
          <p className="mt-1 text-sm text-slate-300">Manage homepage frequently asked questions</p>
        </div>
        <button
          type="button"
          onClick={startAdd}
          className="px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Add FAQ
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
          <h3 className="text-base font-semibold text-slate-100">All FAQs ({faqs.length})</h3>
          
          {faqs.length === 0 ? (
            <div className="p-8 rounded-xl border border-white/10 bg-white/[0.03] text-center text-slate-400">
              No FAQs yet. Click "Add FAQ" to create one.
            </div>
          ) : (
            faqs.map((item, index) => (
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <HelpCircle className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-200 line-clamp-1">{item.question}</span>
                      {item.is_active ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-teal-500/20 text-teal-300">Active</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-500/20 text-slate-400">Inactive</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-2">{item.answer}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                        {item.category}
                      </span>
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
                      disabled={index === faqs.length - 1}
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
                {isAdding ? 'Add New FAQ' : 'Edit FAQ'}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={saveFaq} className="space-y-4">
              <label className="text-xs text-slate-400">
                Question *
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="e.g., What is the course duration?"
                  required
                />
              </label>

              <label className="text-xs text-slate-400">
                Answer *
                <textarea
                  rows={4}
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="Provide a detailed answer..."
                  required
                />
              </label>

              <label className="text-xs text-slate-400">
                Category
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                >
                  {CATEGORY_OPTIONS.map(option => (
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
                  {saving ? 'Saving...' : 'Save FAQ'}
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
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Delete FAQ?</h3>
              <p className="text-sm text-slate-400 mb-6">
                This action cannot be undone. Are you sure you want to delete this FAQ?
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
                  onClick={() => deleteFaq(showDeleteConfirm)}
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
