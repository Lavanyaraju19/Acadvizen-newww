'use client'

import { useState, useEffect } from 'react'
import { Surface } from '../../../src/components/ui/Surface'
import { adminApiFetch } from '../../../lib/adminApiClient'
import { uploadFileAsset } from '../../../lib/storageUpload'
import { 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  Monitor,
  Smartphone,
  Tablet,
  ArrowUp,
  ArrowDown,
  Calendar,
  Clock
} from 'lucide-react'

const BANNER_TYPES = [
  { value: 'hero', label: 'Hero Banner' },
  { value: 'sidebar', label: 'Sidebar Banner' },
  { value: 'footer', label: 'Footer Banner' },
  { value: 'popup', label: 'Popup Banner' },
  { value: 'floating', label: 'Floating Banner' },
]

function createEmptyBanner() {
  return {
    id: '',
    name: '',
    type: 'hero',
    desktop_image: '',
    tablet_image: '',
    mobile_image: '',
    link_url: '',
    alt_text: '',
    title: '',
    description: '',
    button_text: '',
    button_color: '#5eead4',
    text_color: '#ffffff',
    background_color: '#050b12',
    is_active: true,
    show_button: true,
    start_date: '',
    end_date: '',
    priority: 0,
    device_targeting: {
      desktop: true,
      tablet: true,
      mobile: true,
    },
    page_targeting: [], // empty = all pages
    status: 'draft',
  }
}

export default function BannerManagerClient() {
  const [banners, setBanners] = useState([])
  const [selectedBannerId, setSelectedBannerId] = useState('')
  const [bannerForm, setBannerForm] = useState(createEmptyBanner())
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState('')
  const [previewMode, setPreviewMode] = useState(false)

  const selectedBanner = banners.find(b => b.id === selectedBannerId)

  useEffect(() => {
    loadBanners()
  }, [])

  async function loadBanners() {
    try {
      const json = await adminApiFetch('/api/cms/banners?include_drafts=1&limit=100', { cache: 'no-store' })
      setBanners(Array.isArray(json.data) ? json.data : [])
    } catch (error) {
      setStatus(error?.message || 'Failed to load banners.')
    }
  }

  function selectBanner(banner) {
    setSelectedBannerId(banner?.id || '')
    if (banner) {
      setBannerForm({
        id: banner.id || '',
        name: banner.name || '',
        type: banner.type || 'hero',
        desktop_image: banner.desktop_image || '',
        tablet_image: banner.tablet_image || '',
        mobile_image: banner.mobile_image || '',
        link_url: banner.link_url || '',
        alt_text: banner.alt_text || '',
        title: banner.title || '',
        description: banner.description || '',
        button_text: banner.button_text || '',
        button_color: banner.button_color || '#5eead4',
        text_color: banner.text_color || '#ffffff',
        background_color: banner.background_color || '#050b12',
        is_active: banner.is_active !== false,
        show_button: banner.show_button !== false,
        start_date: banner.start_date || '',
        end_date: banner.end_date || '',
        priority: banner.priority || 0,
        device_targeting: {
          desktop: banner.device_targeting?.desktop !== false,
          tablet: banner.device_targeting?.tablet !== false,
          mobile: banner.device_targeting?.mobile !== false,
        },
        page_targeting: banner.page_targeting || [],
        status: banner.status || 'draft',
      })
    } else {
      setBannerForm(createEmptyBanner())
    }
  }

  async function handleUpload(field, file) {
    if (!file) return
    setUploading(field)
    setStatus('')
    try {
      const asset = await uploadFileAsset(file, 'banners')
      setBannerForm(prev => ({ ...prev, [field]: asset.url }))
      setStatus('Image uploaded successfully.')
    } catch (error) {
      setStatus(error?.message || 'Upload failed.')
    } finally {
      setUploading('')
    }
  }

  async function saveBanner(event) {
    event.preventDefault()
    if (!bannerForm.name.trim()) {
      setStatus('Banner name is required.')
      return
    }

    setSaving(true)
    setStatus('')
    try {
      const payload = {
        ...bannerForm,
        page_targeting: typeof bannerForm.page_targeting === 'string' 
          ? bannerForm.page_targeting.split('\n').map(p => p.trim()).filter(Boolean)
          : bannerForm.page_targeting,
      }
      
      const method = bannerForm.id ? 'PUT' : 'POST'
      const endpoint = bannerForm.id ? `/api/cms/banners/${bannerForm.id}` : '/api/cms/banners'
      
      await adminApiFetch(endpoint, { method, body: payload })
      await loadBanners()
      setStatus('Banner saved successfully.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save banner.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteBanner(id) {
    if (!window.confirm('Delete this banner?')) return
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/banners/${id}`, { method: 'DELETE' })
      if (selectedBannerId === id) {
        setSelectedBannerId('')
        setBannerForm(createEmptyBanner())
      }
      await loadBanners()
      setStatus('Banner deleted.')
    } catch (error) {
      setStatus(error?.message || 'Failed to delete banner.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(banner) {
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/banners/${banner.id}`, {
        method: 'PATCH',
        body: { is_active: !banner.is_active }
      })
      await loadBanners()
      setStatus(`Banner ${banner.is_active ? 'disabled' : 'enabled'}.`)
    } catch (error) {
      setStatus(error?.message || 'Failed to update banner.')
    } finally {
      setSaving(false)
    }
  }

  async function moveBanner(banner, direction) {
    const currentIndex = banners.findIndex(b => b.id === banner.id)
    const newIndex = currentIndex + direction
    if (newIndex < 0 || newIndex >= banners.length) return

    const newBanners = [...banners]
    const [removed] = newBanners.splice(currentIndex, 1)
    newBanners.splice(newIndex, 0, removed)

    // Update priorities
    const updates = newBanners.map((b, index) => 
      adminApiFetch(`/api/cms/banners/${b.id}`, {
        method: 'PATCH',
        body: { priority: index }
      })
    )

    setSaving(true)
    try {
      await Promise.all(updates)
      await loadBanners()
      setStatus('Banner order updated.')
    } catch (error) {
      setStatus(error?.message || 'Failed to reorder banners.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Banner Manager</h2>
          <p className="mt-1 text-sm text-slate-300">Manage responsive banners for different devices and locations</p>
        </div>
        <button
          type="button"
          onClick={() => { selectBanner(null); setSelectedBannerId(''); }}
          className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05]"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          New Banner
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Banners List */}
        <aside className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-100">Your Banners</h3>
          <div className="space-y-2">
            {banners.map(banner => (
              <button
                key={banner.id}
                type="button"
                onClick={() => selectBanner(banner)}
                className={`w-full text-left p-3 rounded-xl transition-colors ${
                  selectedBannerId === banner.id 
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' 
                    : 'border border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{banner.name || 'Untitled Banner'}</span>
                  <span className={`w-2 h-2 rounded-full ${banner.is_active ? 'bg-green-400' : 'bg-slate-500'}`} />
                </div>
                <div className="text-xs opacity-70 mt-1">
                  {banner.type} • Priority: {banner.priority}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Banner Editor */}
        <main>
          {!previewMode ? (
            <form onSubmit={saveBanner} className="space-y-6">
              {/* Basic Settings */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="text-base font-semibold text-slate-100 mb-4">Basic Settings</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-xs text-slate-400 md:col-span-2">
                    Banner Name
                    <input
                      type="text"
                      value={bannerForm.name}
                      onChange={(e) => setBannerForm({ ...bannerForm, name: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    />
                  </label>
                  
                  <label className="text-xs text-slate-400">
                    Banner Type
                    <select
                      value={bannerForm.type}
                      onChange={(e) => setBannerForm({ ...bannerForm, type: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    >
                      {BANNER_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </label>
                  
                  <label className="text-xs text-slate-400">
                    Priority (lower = higher priority)
                    <input
                      type="number"
                      value={bannerForm.priority}
                      onChange={(e) => setBannerForm({ ...bannerForm, priority: parseInt(e.target.value) || 0 })}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    />
                  </label>
                </div>
              </div>

              {/* Images */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="text-base font-semibold text-slate-100 mb-4">Responsive Images</h3>
                <div className="space-y-4">
                  <label className="text-xs text-slate-400">
                    <Monitor className="w-4 h-4 inline mr-2" />
                    Desktop Image
                    <input
                      type="url"
                      value={bannerForm.desktop_image}
                      onChange={(e) => setBannerForm({ ...bannerForm, desktop_image: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUpload('desktop_image', e.target.files?.[0])}
                      className="mt-2 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    />
                    {uploading === 'desktop_image' && <p className="mt-1 text-xs text-slate-400">Uploading...</p>}
                  </label>
                  
                  <label className="text-xs text-slate-400">
                    <Tablet className="w-4 h-4 inline mr-2" />
                    Tablet Image
                    <input
                      type="url"
                      value={bannerForm.tablet_image}
                      onChange={(e) => setBannerForm({ ...bannerForm, tablet_image: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUpload('tablet_image', e.target.files?.[0])}
                      className="mt-2 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    />
                    {uploading === 'tablet_image' && <p className="mt-1 text-xs text-slate-400">Uploading...</p>}
                  </label>
                  
                  <label className="text-xs text-slate-400">
                    <Smartphone className="w-4 h-4 inline mr-2" />
                    Mobile Image
                    <input
                      type="url"
                      value={bannerForm.mobile_image}
                      onChange={(e) => setBannerForm({ ...bannerForm, mobile_image: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUpload('mobile_image', e.target.files?.[0])}
                      className="mt-2 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    />
                    {uploading === 'mobile_image' && <p className="mt-1 text-xs text-slate-400">Uploading...</p>}
                  </label>
                </div>
              </div>

              {/* Content */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="text-base font-semibold text-slate-100 mb-4">Content & Styling</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-xs text-slate-400 md:col-span-2">
                    Title
                    <input
                      type="text"
                      value={bannerForm.title}
                      onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    />
                  </label>
                  
                  <label className="text-xs text-slate-400 md:col-span-2">
                    Description
                    <textarea
                      value={bannerForm.description}
                      onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })}
                      rows={2}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    />
                  </label>
                  
                  <label className="text-xs text-slate-400">
                    Link URL
                    <input
                      type="url"
                      value={bannerForm.link_url}
                      onChange={(e) => setBannerForm({ ...bannerForm, link_url: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    />
                  </label>
                  
                  <label className="text-xs text-slate-400">
                    Alt Text
                    <input
                      type="text"
                      value={bannerForm.alt_text}
                      onChange={(e) => setBannerForm({ ...bannerForm, alt_text: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    />
                  </label>
                  
                  <label className="text-xs text-slate-400">
                    Button Text
                    <input
                      type="text"
                      value={bannerForm.button_text}
                      onChange={(e) => setBannerForm({ ...bannerForm, button_text: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    />
                  </label>
                  
                  <label className="text-xs text-slate-400">
                    Button Color
                    <input
                      type="color"
                      value={bannerForm.button_color}
                      onChange={(e) => setBannerForm({ ...bannerForm, button_color: e.target.value })}
                      className="mt-1 w-full h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                    />
                  </label>
                  
                  <label className="text-xs text-slate-400">
                    Text Color
                    <input
                      type="color"
                      value={bannerForm.text_color}
                      onChange={(e) => setBannerForm({ ...bannerForm, text_color: e.target.value })}
                      className="mt-1 w-full h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                    />
                  </label>
                  
                  <label className="text-xs text-slate-400">
                    Background Color
                    <input
                      type="color"
                      value={bannerForm.background_color}
                      onChange={(e) => setBannerForm({ ...bannerForm, background_color: e.target.value })}
                      className="mt-1 w-full h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                    />
                  </label>
                  
                  <label className="text-xs text-slate-400 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={bannerForm.show_button}
                      onChange={(e) => setBannerForm({ ...bannerForm, show_button: e.target.checked })}
                      className="rounded border-white/10 bg-white/[0.03]"
                    />
                    Show Button
                  </label>
                </div>
              </div>

              {/* Targeting */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="text-base font-semibold text-slate-100 mb-4">Targeting</h3>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4">
                    <label className="text-xs text-slate-400 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={bannerForm.device_targeting.desktop}
                        onChange={(e) => setBannerForm({ 
                          ...bannerForm, 
                          device_targeting: { ...bannerForm.device_targeting, desktop: e.target.checked }
                        })}
                        className="rounded border-white/10 bg-white/[0.03]"
                      />
                      <Monitor className="w-4 h-4" />
                      Desktop
                    </label>
                    
                    <label className="text-xs text-slate-400 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={bannerForm.device_targeting.tablet}
                        onChange={(e) => setBannerForm({ 
                          ...bannerForm, 
                          device_targeting: { ...bannerForm.device_targeting, tablet: e.target.checked }
                        })}
                        className="rounded border-white/10 bg-white/[0.03]"
                      />
                      <Tablet className="w-4 h-4" />
                      Tablet
                    </label>
                    
                    <label className="text-xs text-slate-400 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={bannerForm.device_targeting.mobile}
                        onChange={(e) => setBannerForm({ 
                          ...bannerForm, 
                          device_targeting: { ...bannerForm.device_targeting, mobile: e.target.checked }
                        })}
                        className="rounded border-white/10 bg-white/[0.03]"
                      />
                      <Smartphone className="w-4 h-4" />
                      Mobile
                    </label>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-xs text-slate-400">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Start Date (optional)
                      <input
                        type="datetime-local"
                        value={bannerForm.start_date}
                        onChange={(e) => setBannerForm({ ...bannerForm, start_date: e.target.value })}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      />
                    </label>
                    
                    <label className="text-xs text-slate-400">
                      <Clock className="w-4 h-4 inline mr-2" />
                      End Date (optional)
                      <input
                        type="datetime-local"
                        value={bannerForm.end_date}
                        onChange={(e) => setBannerForm({ ...bannerForm, end_date: e.target.value })}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      />
                    </label>
                  </div>
                  
                  <label className="text-xs text-slate-400">
                    Target Pages (one per line, empty = all pages)
                    <textarea
                      value={Array.isArray(bannerForm.page_targeting) ? bannerForm.page_targeting.join('\n') : bannerForm.page_targeting}
                      onChange={(e) => setBannerForm({ ...bannerForm, page_targeting: e.target.value })}
                      rows={3}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      placeholder="/about&#10;/contact&#10;/courses"
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
                  {saving ? 'Saving...' : 'Save Banner'}
                </button>
                
                {selectedBannerId && (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleActive(selectedBanner)}
                      disabled={saving}
                      className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05]"
                    >
                      {selectedBanner?.is_active ? <EyeOff className="w-4 h-4 inline mr-2" /> : <Eye className="w-4 h-4 inline mr-2" />}
                      {selectedBanner?.is_active ? 'Disable' : 'Enable'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => moveBanner(selectedBanner, -1)}
                      disabled={saving}
                      className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05]"
                    >
                      <ArrowUp className="w-4 h-4 inline mr-2" />
                      Move Up
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => moveBanner(selectedBanner, 1)}
                      disabled={saving}
                      className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05]"
                    >
                      <ArrowDown className="w-4 h-4 inline mr-2" />
                      Move Down
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => deleteBanner(selectedBannerId)}
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
                  <Eye className="w-4 h-4 inline mr-2" />
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
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Banner Preview</h3>
              
              <div 
                className="rounded-xl p-8 text-center"
                style={{ 
                  backgroundColor: bannerForm.background_color,
                  color: bannerForm.text_color 
                }}
              >
                {bannerForm.desktop_image && (
                  <img 
                    src={bannerForm.desktop_image} 
                    alt={bannerForm.alt_text || 'Banner'} 
                    className="w-full h-64 object-cover rounded-lg mb-4 mx-auto"
                  />
                )}
                
                {bannerForm.title && (
                  <h2 className="text-2xl font-bold mb-2">{bannerForm.title}</h2>
                )}
                
                {bannerForm.description && (
                  <p className="mb-4">{bannerForm.description}</p>
                )}
                
                {bannerForm.show_button && bannerForm.button_text && (
                  <button
                    className="px-6 py-2 rounded-lg font-semibold"
                    style={{ backgroundColor: bannerForm.button_color }}
                  >
                    {bannerForm.button_text}
                  </button>
                )}
              </div>
              
              <div className="mt-4 text-sm text-slate-400">
                <p><strong>Type:</strong> {bannerForm.type}</p>
                <p><strong>Devices:</strong> {[
                  bannerForm.device_targeting.desktop && 'Desktop',
                  bannerForm.device_targeting.tablet && 'Tablet',
                  bannerForm.device_targeting.mobile && 'Mobile'
                ].filter(Boolean).join(', ')}</p>
                <p><strong>Priority:</strong> {bannerForm.priority}</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </Surface>
  )
}