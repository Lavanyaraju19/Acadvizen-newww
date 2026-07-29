'use client'

import { useState, useEffect } from 'react'
import { Surface } from '../../../../src/components/ui/Surface'
import { adminApiFetch } from '../../../../lib/adminApiClient'
import { uploadFileAsset } from '../../../../lib/storageUpload'
import { 
  Plus, 
  Trash2, 
  Edit,
  GripVertical,
  ChevronUp,
  ChevronDown,
  X,
  Star,
  User,
  Building2
} from 'lucide-react'

export default function TestimonialsBuilderClient() {
  const [testimonials, setTestimonials] = useState([])
  const [editingItem, setEditingItem] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    quote: '',
    image_url: '',
    company: '',
    rating: 5,
    order_index: 0,
    is_active: true,
  })

  useEffect(() => {
    loadTestimonials()
  }, [])

  async function loadTestimonials() {
    setLoading(true)
    setStatus('')
    try {
      const data = await adminApiFetch('/api/cms/homepage/testimonials', { cache: 'no-store' })
      const items = Array.isArray(data) ? data : (data.data || [])
      setTestimonials(items.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)))
    } catch (error) {
      setStatus(error?.message || 'Failed to load testimonials.')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      role: '',
      quote: '',
      image_url: '',
      company: '',
      rating: 5,
      order_index: testimonials.length,
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
      name: item.name || '',
      role: item.role || '',
      quote: item.quote || '',
      image_url: item.image_url || '',
      company: item.company || '',
      rating: item.rating || 5,
      order_index: item.order_index || 0,
      is_active: item.is_active !== undefined ? item.is_active : true,
    })
    setEditingItem(item)
    setIsAdding(false)
  }

  async function handleUpload(file) {
    if (!file) return
    setUploading(true)
    setStatus('')
    try {
      const asset = await uploadFileAsset(file, 'homepage')
      setFormData(prev => ({ ...prev, image_url: asset.url }))
      setStatus('Image uploaded successfully.')
    } catch (error) {
      setStatus(error?.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function saveTestimonial(e) {
    e.preventDefault()
    setSaving(true)
    setStatus('')
    
    try {
      const payload = { ...formData }
      if (editingItem) {
        payload.id = editingItem.id
      }
      
      await adminApiFetch('/api/cms/homepage/testimonials', {
        method: 'POST',
        body: payload,
      })
      
      await loadTestimonials()
      resetForm()
      setStatus('Testimonial saved successfully.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save testimonial.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteTestimonial(id) {
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/homepage/testimonials/${id}`, {
        method: 'DELETE',
      })
      await loadTestimonials()
      setShowDeleteConfirm(null)
      setStatus('Testimonial deleted successfully.')
    } catch (error) {
      setStatus(error?.message || 'Failed to delete testimonial.')
    } finally {
      setSaving(false)
    }
  }

  function moveItemUp(index) {
    if (index === 0) return
    const newItems = [...testimonials]
    const [removed] = newItems.splice(index, 1)
    newItems.splice(index - 1, 0, removed)
    
    const updatedItems = newItems.map((item, i) => ({ ...item, order_index: i }))
    setTestimonials(updatedItems)
    saveOrder(updatedItems)
  }

  function moveItemDown(index) {
    if (index === testimonials.length - 1) return
    const newItems = [...testimonials]
    const [removed] = newItems.splice(index, 1)
    newItems.splice(index + 1, 0, removed)
    
    const updatedItems = newItems.map((item, i) => ({ ...item, order_index: i }))
    setTestimonials(updatedItems)
    saveOrder(updatedItems)
  }

  async function saveOrder(items) {
    try {
      for (const item of items) {
        await adminApiFetch('/api/cms/homepage/testimonials', {
          method: 'POST',
          body: { ...item, order_index: item.order_index },
        })
      }
    } catch (error) {
      console.error('Failed to save order:', error)
    }
  }

  function renderStars(rating) {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`}
      />
    ))
  }

  if (loading) {
    return (
      <Surface className="p-6 md:p-8">
        <div className="text-center text-slate-400">Loading testimonials...</div>
      </Surface>
    )
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Testimonials Builder</h2>
          <p className="mt-1 text-sm text-slate-300">Manage homepage testimonials</p>
        </div>
        <button
          type="button"
          onClick={startAdd}
          className="px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Add Testimonial
        </button>
      </div>

      {status && (
        <div className={`mb-4 p-3 rounded-xl border text-sm ${
          status.includes('success') || status.includes('saved') || status.includes('uploaded')
            ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {status}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* List View */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-slate-100">All Testimonials ({testimonials.length})</h3>
          
          {testimonials.length === 0 ? (
            <div className="p-8 rounded-xl border border-white/10 bg-white/[0.03] text-center text-slate-400">
              No testimonials yet. Click &quot;Add Testimonial&quot; to create one.
            </div>
          ) : (
            testimonials.map((item, index) => (
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
                  {item.image_url && (
                    /* eslint-disable-next-line @next/next/no-img-element -- Builder list previews render arbitrary testimonial avatars from CMS storage. */
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-12 h-12 rounded-full object-cover border border-white/10"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-200">{item.name}</span>
                      {item.is_active ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-teal-500/20 text-teal-300">Active</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-500/20 text-slate-400">Inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex">{renderStars(item.rating)}</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                      <span>{item.role}</span>
                      {item.company && (
                        <>
                          <span>•</span>
                          <Building2 className="w-3 h-3" />
                          <span>{item.company}</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{item.quote}</p>
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
                      disabled={index === testimonials.length - 1}
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
                {isAdding ? 'Add New Testimonial' : 'Edit Testimonial'}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={saveTestimonial} className="space-y-4">
              <label className="text-xs text-slate-400">
                Name *
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="e.g., Jane Smith"
                  required
                />
              </label>

              <label className="text-xs text-slate-400">
                Role *
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="e.g., Product Manager"
                  required
                />
              </label>

              <label className="text-xs text-slate-400">
                Company
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="e.g., Microsoft"
                />
              </label>

              <label className="text-xs text-slate-400">
                Quote *
                <textarea
                  rows={3}
                  value={formData.quote}
                  onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="What they said about the course..."
                  required
                />
              </label>

              <label className="text-xs text-slate-400">
                Image URL
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="https://..."
                />
              </label>

              <label className="text-xs text-slate-400">
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload(e.target.files?.[0])}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
                {uploading && <p className="mt-1 text-xs text-slate-400">Uploading...</p>}
              </label>

              <label className="text-xs text-slate-400">
                Rating
                <div className="mt-2 flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="p-1"
                    >
                      <Star
                        className={`w-6 h-6 ${star <= formData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`}
                      />
                    </button>
                  ))}
                  <span className="text-sm text-slate-400 ml-2">{formData.rating} / 5</span>
                </div>
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
                  {saving ? 'Saving...' : 'Save Testimonial'}
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
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Delete Testimonial?</h3>
              <p className="text-sm text-slate-400 mb-6">
                This action cannot be undone. Are you sure you want to delete this testimonial?
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
                  onClick={() => deleteTestimonial(showDeleteConfirm)}
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
