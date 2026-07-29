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
  Wrench,
  ExternalLink
} from 'lucide-react'

const CATEGORY_OPTIONS = [
  { value: 'development', label: 'Development' },
  { value: 'design', label: 'Design' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'ai', label: 'AI & ML' },
  { value: 'data', label: 'Data' },
  { value: 'collaboration', label: 'Collaboration' },
  { value: 'other', label: 'Other' },
]

export default function ToolsBuilderClient() {
  const [tools, setTools] = useState([])
  const [editingItem, setEditingItem] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    description: '',
    category: 'development',
    link: '',
    order_index: 0,
    is_active: true,
  })

  useEffect(() => {
    loadTools()
  }, [])

  async function loadTools() {
    setLoading(true)
    setStatus('')
    try {
      const data = await adminApiFetch('/api/cms/homepage/tools', { cache: 'no-store' })
      const items = Array.isArray(data) ? data : (data.data || [])
      setTools(items.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)))
    } catch (error) {
      setStatus(error?.message || 'Failed to load tools.')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      logo_url: '',
      description: '',
      category: 'development',
      link: '',
      order_index: tools.length,
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
      logo_url: item.logo_url || '',
      description: item.description || '',
      category: item.category || 'development',
      link: item.link || '',
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
      setFormData(prev => ({ ...prev, logo_url: asset.url }))
      setStatus('Logo uploaded successfully.')
    } catch (error) {
      setStatus(error?.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function saveTool(e) {
    e.preventDefault()
    setSaving(true)
    setStatus('')
    
    try {
      const payload = { ...formData }
      if (editingItem) {
        payload.id = editingItem.id
      }
      
      await adminApiFetch('/api/cms/homepage/tools', {
        method: 'POST',
        body: payload,
      })
      
      await loadTools()
      resetForm()
      setStatus('Tool saved successfully.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save tool.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteTool(id) {
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/homepage/tools/${id}`, {
        method: 'DELETE',
      })
      await loadTools()
      setShowDeleteConfirm(null)
      setStatus('Tool deleted successfully.')
    } catch (error) {
      setStatus(error?.message || 'Failed to delete tool.')
    } finally {
      setSaving(false)
    }
  }

  function moveItemUp(index) {
    if (index === 0) return
    const newItems = [...tools]
    const [removed] = newItems.splice(index, 1)
    newItems.splice(index - 1, 0, removed)
    
    const updatedItems = newItems.map((item, i) => ({ ...item, order_index: i }))
    setTools(updatedItems)
    saveOrder(updatedItems)
  }

  function moveItemDown(index) {
    if (index === tools.length - 1) return
    const newItems = [...tools]
    const [removed] = newItems.splice(index, 1)
    newItems.splice(index + 1, 0, removed)
    
    const updatedItems = newItems.map((item, i) => ({ ...item, order_index: i }))
    setTools(updatedItems)
    saveOrder(updatedItems)
  }

  async function saveOrder(items) {
    try {
      for (const item of items) {
        await adminApiFetch('/api/cms/homepage/tools', {
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
        <div className="text-center text-slate-400">Loading tools...</div>
      </Surface>
    )
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Tools Builder</h2>
          <p className="mt-1 text-sm text-slate-300">Manage homepage tools showcase</p>
        </div>
        <button
          type="button"
          onClick={startAdd}
          className="px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Add Tool
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
          <h3 className="text-base font-semibold text-slate-100">All Tools ({tools.length})</h3>
          
          {tools.length === 0 ? (
            <div className="p-8 rounded-xl border border-white/10 bg-white/[0.03] text-center text-slate-400">
              No tools yet. Click &quot;Add Tool&quot; to create one.
            </div>
          ) : (
            tools.map((item, index) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-colors ${
                  editingItem?.id === item.id
                    ? 'border-teal-500/50 bg-teal-500/10'
                    : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-slate-500" />
                  {item.logo_url && (
                    /* eslint-disable-next-line @next/next/no-img-element -- Builder list previews must support arbitrary uploaded tool logos without remote image config. */
                    <img 
                      src={item.logo_url} 
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-contain bg-white/5 p-2 border border-white/10"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-200 truncate">{item.name}</span>
                      {item.is_active ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-teal-500/20 text-teal-300">Active</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-500/20 text-slate-400">Inactive</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1 mb-1">{item.description}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                        {item.category}
                      </span>
                      <span>•</span>
                      <span>Order: {item.order_index}</span>
                      {item.link && <span>• Has Link</span>}
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
                      disabled={index === tools.length - 1}
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
                {isAdding ? 'Add New Tool' : 'Edit Tool'}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={saveTool} className="space-y-4">
              <label className="text-xs text-slate-400">
                Tool Name *
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="e.g., VS Code"
                  required
                />
              </label>

              <label className="text-xs text-slate-400">
                Description *
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="Brief description of the tool..."
                  required
                />
              </label>

              <label className="text-xs text-slate-400">
                Logo URL
                <input
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="https://..."
                />
              </label>

              <label className="text-xs text-slate-400">
                Upload Logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload(e.target.files?.[0])}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
                {uploading && <p className="mt-1 text-xs text-slate-400">Uploading...</p>}
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
                Tool Link
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="https://..."
                />
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
                  {saving ? 'Saving...' : 'Save Tool'}
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
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Delete Tool?</h3>
              <p className="text-sm text-slate-400 mb-6">
                This action cannot be undone. Are you sure you want to delete this tool?
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
                  onClick={() => deleteTool(showDeleteConfirm)}
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
