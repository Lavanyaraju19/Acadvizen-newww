'use client'

import { useState, useEffect } from 'react'
import { Surface } from '../../../src/components/ui/Surface'
import { adminApiFetch } from '../../../lib/adminApiClient'
import RichTextEditor from '../../../components/admin/RichTextEditor'
import { 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  Clock,
  Target,
  X
} from 'lucide-react'

const TRIGGER_TYPES = [
  { value: 'immediate', label: 'Immediate (on page load)' },
  { value: 'delay', label: 'Time Delay' },
  { value: 'scroll', label: 'Scroll Percentage' },
  { value: 'exit_intent', label: 'Exit Intent' },
  { value: 'click', label: 'Click Trigger' },
]

const DISPLAY_TYPES = [
  { value: 'modal', label: 'Modal Popup' },
  { value: 'slide_in', label: 'Slide-in Panel' },
  { value: 'bar', label: 'Top/Bottom Bar' },
  { value: 'corner', label: 'Corner Popup' },
]

function createEmptyPopup() {
  return {
    id: '',
    name: '',
    type: 'modal',
    trigger_type: 'delay',
    trigger_value: 5, // seconds or percentage
    content: '',
    html_content: '',
    image_url: '',
    close_button: true,
    overlay: true,
    mobile_enabled: true,
    tablet_enabled: true,
    desktop_enabled: true,
    show_frequency: 'session', // session, always, once_per_visitor, custom
    custom_frequency_days: 7,
    start_date: '',
    end_date: '',
    target_pages: [], // empty = all pages
    exclude_pages: [],
    is_active: true,
    status: 'draft',
  }
}

export default function PopupManagerClient() {
  const [popups, setPopups] = useState([])
  const [selectedPopupId, setSelectedPopupId] = useState('')
  const [popupForm, setPopupForm] = useState(createEmptyPopup())
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const selectedPopup = popups.find(p => p.id === selectedPopupId)

  useEffect(() => {
    loadPopups()
  }, [])

  async function loadPopups() {
    try {
      const json = await adminApiFetch('/api/cms/popups?include_drafts=1&limit=100', { cache: 'no-store' })
      setPopups(Array.isArray(json.data) ? json.data : [])
    } catch (error) {
      setStatus(error?.message || 'Failed to load popups.')
    }
  }

  function selectPopup(popup) {
    setSelectedPopupId(popup?.id || '')
    if (popup) {
      setPopupForm({
        id: popup.id || '',
        name: popup.name || '',
        type: popup.type || 'modal',
        trigger_type: popup.trigger_type || 'delay',
        trigger_value: popup.trigger_value || 5,
        content: popup.content || '',
        html_content: popup.html_content || '',
        image_url: popup.image_url || '',
        close_button: popup.close_button !== false,
        overlay: popup.overlay !== false,
        mobile_enabled: popup.mobile_enabled !== false,
        tablet_enabled: popup.tablet_enabled !== false,
        desktop_enabled: popup.desktop_enabled !== false,
        show_frequency: popup.show_frequency || 'session',
        custom_frequency_days: popup.custom_frequency_days || 7,
        start_date: popup.start_date || '',
        end_date: popup.end_date || '',
        target_pages: popup.target_pages || [],
        exclude_pages: popup.exclude_pages || [],
        is_active: popup.is_active !== false,
        status: popup.status || 'draft',
      })
    } else {
      setPopupForm(createEmptyPopup())
    }
  }

  async function savePopup(event) {
    event.preventDefault()
    if (!popupForm.name.trim()) {
      setStatus('Popup name is required.')
      return
    }

    setSaving(true)
    setStatus('')
    try {
      const payload = {
        ...popupForm,
        target_pages: typeof popupForm.target_pages === 'string' 
          ? popupForm.target_pages.split('\n').map(p => p.trim()).filter(Boolean)
          : popupForm.target_pages,
        exclude_pages: typeof popupForm.exclude_pages === 'string'
          ? popupForm.exclude_pages.split('\n').map(p => p.trim()).filter(Boolean)
          : popupForm.exclude_pages,
      }
      
      const method = popupForm.id ? 'PUT' : 'POST'
      const endpoint = popupForm.id ? `/api/cms/popups/${popupForm.id}` : '/api/cms/popups'
      
      await adminApiFetch(endpoint, { method, body: payload })
      await loadPopups()
      setStatus('Popup saved successfully.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save popup.')
    } finally {
      setSaving(false)
    }
  }

  async function deletePopup(id) {
    if (!window.confirm('Delete this popup?')) return
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/popups/${id}`, { method: 'DELETE' })
      if (selectedPopupId === id) {
        setSelectedPopupId('')
        setPopupForm(createEmptyPopup())
      }
      await loadPopups()
      setStatus('Popup deleted.')
    } catch (error) {
      setStatus(error?.message || 'Failed to delete popup.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(popup) {
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/popups/${popup.id}`, {
        method: 'PATCH',
        body: { is_active: !popup.is_active }
      })
      await loadPopups()
      setStatus(`Popup ${popup.is_active ? 'disabled' : 'enabled'}.`)
    } catch (error) {
      setStatus(error?.message || 'Failed to update popup.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Popup Manager</h2>
          <p className="mt-1 text-sm text-slate-300">Create and manage website popups and overlays</p>
        </div>
        <button
          type="button"
          onClick={() => { selectPopup(null); setSelectedPopupId(''); }}
          className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05]"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          New Popup
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Popups List */}
        <aside className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-100">Your Popups</h3>
          <div className="space-y-2">
            {popups.map(popup => (
              <button
                key={popup.id}
                type="button"
                onClick={() => selectPopup(popup)}
                className={`w-full text-left p-3 rounded-xl transition-colors ${
                  selectedPopupId === popup.id 
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' 
                    : 'border border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{popup.name || 'Untitled Popup'}</span>
                  <span className={`w-2 h-2 rounded-full ${popup.is_active ? 'bg-green-400' : 'bg-slate-500'}`} />
                </div>
                <div className="text-xs opacity-70 mt-1">
                  {popup.type} • {popup.status || 'draft'}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Popup Editor */}
        <main>
          {!previewMode ? (
            <form onSubmit={savePopup} className="space-y-6">
              {/* Basic Settings */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="text-base font-semibold text-slate-100 mb-4">Basic Settings</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-xs text-slate-400 md:col-span-2">
                    Popup Name
                    <input
                      type="text"
                      value={popupForm.name}
                      onChange={(e) => setPopupForm({ ...popupForm, name: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    />
                  </label>
                  
                  <label className="text-xs text-slate-400">
                    Display Type
                    <select
                      value={popupForm.type}
                      onChange={(e) => setPopupForm({ ...popupForm, type: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    >
                      {DISPLAY_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </label>
                  
                  <label className="text-xs text-slate-400">
                    Trigger Type
                    <select
                      value={popupForm.trigger_type}
                      onChange={(e) => setPopupForm({ ...popupForm, trigger_type: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    >
                      {TRIGGER_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </label>
                  
                  {(popupForm.trigger_type === 'delay' || popupForm.trigger_type === 'scroll') && (
                    <label className="text-xs text-slate-400">
                      {popupForm.trigger_type === 'delay' ? 'Delay (seconds)' : 'Scroll Percentage (%)'}
                      <input
                        type="number"
                        value={popupForm.trigger_value}
                        onChange={(e) => setPopupForm({ ...popupForm, trigger_value: parseInt(e.target.value) || 0 })}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="text-base font-semibold text-slate-100 mb-4">Content</h3>
                <div className="space-y-4">
                  <label className="text-xs text-slate-400">
                    Image URL (optional)
                    <input
                      type="url"
                      value={popupForm.image_url}
                      onChange={(e) => setPopupForm({ ...popupForm, image_url: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    />
                  </label>
                  
                  <label className="text-xs text-slate-400">
                    Popup Content
                    <RichTextEditor
                      content={popupForm.content}
                      onChange={(content) => setPopupForm({ ...popupForm, content })}
                      placeholder="Enter your popup content..."
                      maxLength={5000}
                    />
                  </label>
                </div>
              </div>

              {/* Display Settings */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="text-base font-semibold text-slate-100 mb-4">Display Settings</h3>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4">
                    <label className="text-xs text-slate-400 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={popupForm.close_button}
                        onChange={(e) => setPopupForm({ ...popupForm, close_button: e.target.checked })}
                        className="rounded border-white/10 bg-white/[0.03]"
                      />
                      Show Close Button
                    </label>
                    
                    <label className="text-xs text-slate-400 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={popupForm.overlay}
                        onChange={(e) => setPopupForm({ ...popupForm, overlay: e.target.checked })}
                        className="rounded border-white/10 bg-white/[0.03]"
                      />
                      Show Overlay
                    </label>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    <label className="text-xs text-slate-400 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={popupForm.mobile_enabled}
                        onChange={(e) => setPopupForm({ ...popupForm, mobile_enabled: e.target.checked })}
                        className="rounded border-white/10 bg-white/[0.03]"
                      />
                      Mobile
                    </label>
                    
                    <label className="text-xs text-slate-400 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={popupForm.tablet_enabled}
                        onChange={(e) => setPopupForm({ ...popupForm, tablet_enabled: e.target.checked })}
                        className="rounded border-white/10 bg-white/[0.03]"
                      />
                      Tablet
                    </label>
                    
                    <label className="text-xs text-slate-400 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={popupForm.desktop_enabled}
                        onChange={(e) => setPopupForm({ ...popupForm, desktop_enabled: e.target.checked })}
                        className="rounded border-white/10 bg-white/[0.03]"
                      />
                      Desktop
                    </label>
                  </div>
                  
                  <label className="text-xs text-slate-400">
                    Show Frequency
                    <select
                      value={popupForm.show_frequency}
                      onChange={(e) => setPopupForm({ ...popupForm, show_frequency: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    >
                      <option value="session">Once per session</option>
                      <option value="always">Always show</option>
                      <option value="once_per_visitor">Once per visitor</option>
                      <option value="custom">Custom frequency</option>
                    </select>
                  </label>
                  
                  {popupForm.show_frequency === 'custom' && (
                    <label className="text-xs text-slate-400">
                      Show every X days
                      <input
                        type="number"
                        value={popupForm.custom_frequency_days}
                        onChange={(e) => setPopupForm({ ...popupForm, custom_frequency_days: parseInt(e.target.value) || 7 })}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Targeting */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="text-base font-semibold text-slate-100 mb-4">Targeting</h3>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-xs text-slate-400">
                      Start Date (optional)
                      <input
                        type="datetime-local"
                        value={popupForm.start_date}
                        onChange={(e) => setPopupForm({ ...popupForm, start_date: e.target.value })}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      />
                    </label>
                    
                    <label className="text-xs text-slate-400">
                      End Date (optional)
                      <input
                        type="datetime-local"
                        value={popupForm.end_date}
                        onChange={(e) => setPopupForm({ ...popupForm, end_date: e.target.value })}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      />
                    </label>
                  </div>
                  
                  <label className="text-xs text-slate-400">
                    Target Pages (one per line, empty = all pages)
                    <textarea
                      value={Array.isArray(popupForm.target_pages) ? popupForm.target_pages.join('\n') : popupForm.target_pages}
                      onChange={(e) => setPopupForm({ ...popupForm, target_pages: e.target.value })}
                      rows={4}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      placeholder="/about&#10;/contact&#10;/courses"
                    />
                  </label>
                  
                  <label className="text-xs text-slate-400">
                    Exclude Pages (one per line)
                    <textarea
                      value={Array.isArray(popupForm.exclude_pages) ? popupForm.exclude_pages.join('\n') : popupForm.exclude_pages}
                      onChange={(e) => setPopupForm({ ...popupForm, exclude_pages: e.target.value })}
                      rows={3}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      placeholder="/admin&#10;/dashboard"
                    />
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  {saving ? 'Saving...' : 'Save Popup'}
                </button>
                
                {selectedPopupId && (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleActive(selectedPopup)}
                      disabled={saving}
                      className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05]"
                    >
                      {selectedPopup?.is_active ? <EyeOff className="w-4 h-4 inline mr-2" /> : <Eye className="w-4 h-4 inline mr-2" />}
                      {selectedPopup?.is_active ? 'Disable' : 'Enable'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => deletePopup(selectedPopupId)}
                      disabled={saving}
                      className="px-4 py-2 rounded-xl border border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4 inline mr-2" />
                      Delete
                    </button>
                  </>
                )}
                
                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05]"
                >
                  <Target className="w-4 h-4 inline mr-2" />
                  {previewMode ? 'Edit' : 'Preview'}
                </button>
              </div>

              {status && (
                <div className="text-sm text-slate-300">{status}</div>
              )}
            </form>
          ) : (
            /* Preview Mode */
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-100">Popup Preview</h3>
                <button
                  type="button"
                  onClick={() => setPreviewMode(false)}
                  className="p-2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="relative bg-slate-900 rounded-xl p-6 border border-white/10">
                {popupForm.overlay && (
                  <div className="absolute inset-0 bg-black/50 rounded-xl" />
                )}
                
                <div className="relative bg-white rounded-lg p-6 max-w-md mx-auto">
                  {popupForm.close_button && (
                    <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                  
                  {popupForm.image_url && (
                    <img 
                      src={popupForm.image_url} 
                      alt="Popup" 
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  
                  <div 
                    className="prose prose-sm"
                    dangerouslySetInnerHTML={{ __html: popupForm.content }}
                  />
                </div>
              </div>
              
              <div className="mt-4 text-sm text-slate-400">
                <p><strong>Type:</strong> {popupForm.type}</p>
                <p><strong>Trigger:</strong> {TRIGGER_TYPES.find(t => t.value === popupForm.trigger_type)?.label}</p>
                <p><strong>Devices:</strong> {[
                  popupForm.mobile_enabled && 'Mobile',
                  popupForm.tablet_enabled && 'Tablet',
                  popupForm.desktop_enabled && 'Desktop'
                ].filter(Boolean).join(', ')}</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </Surface>
  )
}