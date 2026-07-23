'use client'

import { useState, useEffect } from 'react'
import { Surface } from '../../../src/components/ui/Surface'
import { adminApiFetch } from '../../../lib/adminApiClient'
import { 
  Plus, 
  Save, 
  Trash2, 
  Edit2, 
  X,
  Search,
  ArrowRight,
  Download,
  Upload,
  ExternalLink
} from 'lucide-react'

export default function RedirectManagerClient() {
  const [redirects, setRedirects] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingRedirect, setEditingRedirect] = useState(null)
  const [formData, setFormData] = useState({
    old_url: '',
    new_url: '',
    redirect_type: 301,
    is_active: true,
  })

  useEffect(() => {
    loadRedirects()
  }, [search])

  async function loadRedirects() {
    setLoading(true)
    try {
      const url = search 
        ? `/api/cms/redirects?search=${encodeURIComponent(search)}&limit=100`
        : '/api/cms/redirects?limit=100'
      const json = await adminApiFetch(url, { cache: 'no-store' })
      setRedirects(Array.isArray(json.data) ? json.data : [])
    } catch (error) {
      setStatus(error?.message || 'Failed to load redirects.')
    } finally {
      setLoading(false)
    }
  }

  async function saveRedirect(event) {
    event.preventDefault()
    if (!formData.old_url || !formData.new_url) {
      setStatus('Old URL and New URL are required.')
      return
    }

    setSaving(true)
    setStatus('')
    try {
      if (editingRedirect) {
        await adminApiFetch(`/api/cms/redirects/${editingRedirect.id}`, {
          method: 'PUT',
          body: formData,
        })
        setStatus('Redirect updated successfully.')
      } else {
        await adminApiFetch('/api/cms/redirects', {
          method: 'POST',
          body: formData,
        })
        setStatus('Redirect created successfully.')
      }
      setShowModal(false)
      setEditingRedirect(null)
      setFormData({ old_url: '', new_url: '', redirect_type: 301, is_active: true })
      await loadRedirects()
    } catch (error) {
      setStatus(error?.message || 'Failed to save redirect.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteRedirect(id) {
    if (!window.confirm('Delete this redirect?')) return
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/redirects/${id}`, { method: 'DELETE' })
      setStatus('Redirect deleted successfully.')
      await loadRedirects()
    } catch (error) {
      setStatus(error?.message || 'Failed to delete redirect.')
    } finally {
      setSaving(false)
    }
  }

  function openEditModal(redirect = null) {
    if (redirect) {
      setEditingRedirect(redirect)
      setFormData({
        old_url: redirect.old_url,
        new_url: redirect.new_url,
        redirect_type: redirect.redirect_type,
        is_active: redirect.is_active,
      })
    } else {
      setEditingRedirect(null)
      setFormData({ old_url: '', new_url: '', redirect_type: 301, is_active: true })
    }
    setShowModal(true)
  }

  async function exportRedirects() {
    try {
      const json = await adminApiFetch('/api/cms/redirects?limit=1000', { cache: 'no-store' })
      const csv = [
        'Old URL,New URL,Type,Active,Hits,Created At',
        ...json.data.map(r => 
          `"${r.old_url}","${r.new_url}",${r.redirect_type},${r.is_active},${r.hits},"${r.created_at}"`
        )
      ].join('\n')
      
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'redirects.csv'
      a.click()
      setStatus('Redirects exported successfully.')
    } catch (error) {
      setStatus(error?.message || 'Failed to export redirects.')
    }
  }

  async function importRedirects(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setStatus('Importing redirects...')
    try {
      const text = await file.text()
      const lines = text.split('\n').slice(1) // Skip header
      let success = 0
      let failed = 0

      for (const line of lines) {
        if (!line.trim()) continue
        const parts = line.match(/"(.*?)","(.*?)",(\d+),(true|false),(\d+),"(.*)"/)
        if (parts) {
          try {
            await adminApiFetch('/api/cms/redirects', {
              method: 'POST',
              body: {
                old_url: parts[1],
                new_url: parts[2],
                redirect_type: parseInt(parts[3]),
                is_active: parts[4] === 'true',
              },
            })
            success++
          } catch {
            failed++
          }
        }
      }

      setStatus(`Imported ${success} redirects. ${failed} failed.`)
      await loadRedirects()
    } catch (error) {
      setStatus(error?.message || 'Failed to import redirects.')
    }
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Redirect Manager</h2>
          <p className="mt-1 text-sm text-slate-300">Manage 301 and 302 redirects for your website</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportRedirects}
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]"
          >
            <Download className="w-4 h-4 inline mr-2" />
            Export
          </button>
          <label className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05] cursor-pointer">
            <Upload className="w-4 h-4 inline mr-2" />
            Import
            <input type="file" accept=".csv" onChange={importRedirects} className="hidden" />
          </label>
          <button
            type="button"
            onClick={() => openEditModal()}
            className="px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Redirect
          </button>
        </div>
      </div>

      {status && (
        <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-slate-300">
          {status}
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search redirects..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-100 placeholder-slate-500"
          />
        </div>
      </div>

      {/* Redirects List */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading redirects...</div>
        ) : redirects.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <p className="font-medium">No redirects found</p>
            <p className="text-sm mt-1 opacity-70">Click "Add Redirect" to create your first redirect</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {redirects.map((redirect) => (
              <div
                key={redirect.id}
                className={`p-4 flex items-center gap-4 transition-colors ${
                  !redirect.is_active ? 'opacity-50' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm text-slate-300 truncate">{redirect.old_url}</code>
                    <ArrowRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <code className="text-sm text-slate-300 truncate">{redirect.new_url}</code>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className={`px-2 py-0.5 rounded ${
                      redirect.redirect_type === 301 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {redirect.redirect_type}
                    </span>
                    <span>{redirect.hits} hits</span>
                    <span>{new Date(redirect.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => window.open(redirect.old_url, '_blank')}
                    className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                    title="Test Redirect"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(redirect)}
                    className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteRedirect(redirect.id)}
                    className="p-2 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="rounded-2xl border border-white/10 bg-[#050b12] p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-100">
                {editingRedirect ? 'Edit Redirect' : 'Add Redirect'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={saveRedirect} className="space-y-4">
              <label className="text-xs text-slate-400">
                Old URL (From)
                <input
                  type="url"
                  value={formData.old_url}
                  onChange={(e) => setFormData({ ...formData, old_url: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="/old-page"
                  required
                />
              </label>

              <label className="text-xs text-slate-400">
                New URL (To)
                <input
                  type="url"
                  value={formData.new_url}
                  onChange={(e) => setFormData({ ...formData, new_url: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="/new-page"
                  required
                />
              </label>

              <label className="text-xs text-slate-400">
                Redirect Type
                <select
                  value={formData.redirect_type}
                  onChange={(e) => setFormData({ ...formData, redirect_type: parseInt(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                >
                  <option value={301}>301 - Permanent</option>
                  <option value={302}>302 - Temporary</option>
                </select>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-white/10 bg-white/[0.03]"
                />
                Active
              </label>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editingRedirect ? 'Update' : 'Create')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/[0.05]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Surface>
  )
}