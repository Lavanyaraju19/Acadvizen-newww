'use client'

import { useState, useEffect } from 'react'
import { Surface } from '../../../../src/components/ui/Surface'
import { adminApiFetch } from '../../../../lib/adminApiClient'
import { uploadFileAsset } from '../../../../lib/storageUpload'
import { 
  Save, 
  Eye, 
  EyeOff, 
  Image as ImageIcon,
  Play,
  Link as LinkIcon,
  Video,
  Check,
  X
} from 'lucide-react'

export default function HeroBuilderClient() {
  const [formData, setFormData] = useState({
    heading: '',
    subheading: '',
    video_url: '',
    video_title: '',
    video_autoplay: false,
    background_image: '',
    mobile_background_image: '',
    cta_text: '',
    cta_link: '',
    secondary_cta_text: '',
    secondary_cta_link: '',
    badge_text: '',
    badge_color: '#14b8a6',
    show_hero: true,
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [uploading, setUploading] = useState('')

  useEffect(() => {
    loadHeroData()
  }, [])

  async function loadHeroData() {
    setLoading(true)
    setStatus('')
    try {
      const data = await adminApiFetch('/api/cms/homepage/hero', { cache: 'no-store' })
      if (data) {
        setFormData(prev => ({
          ...prev,
          ...data,
          video_autoplay: data.video_autoplay || false,
          show_hero: data.show_hero !== undefined ? data.show_hero : true,
        }))
      }
    } catch (error) {
      setStatus(error?.message || 'Failed to load hero data.')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(field, file) {
    if (!file) return
    setUploading(field)
    setStatus('')
    try {
      const asset = await uploadFileAsset(file, 'homepage')
      setFormData(prev => ({ ...prev, [field]: asset.url }))
      setStatus('Image uploaded successfully.')
    } catch (error) {
      setStatus(error?.message || 'Upload failed.')
    } finally {
      setUploading('')
    }
  }

  async function saveHero() {
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch('/api/cms/homepage/hero', {
        method: 'POST',
        body: formData,
      })
      setStatus('Hero section saved successfully.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save hero section.')
    } finally {
      setSaving(false)
    }
  }

  function validateForm() {
    if (!formData.heading.trim()) {
      setStatus('Heading is required.')
      return false
    }
    if (!formData.subheading.trim()) {
      setStatus('Subheading is required.')
      return false
    }
    return true
  }

  function handleSave(e) {
    e.preventDefault()
    if (!validateForm()) return
    saveHero()
  }

  if (loading) {
    return (
      <Surface className="p-6 md:p-8">
        <div className="text-center text-slate-400">Loading hero data...</div>
      </Surface>
    )
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Hero Section Builder</h2>
          <p className="mt-1 text-sm text-slate-300">Customize the homepage hero section</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.open('/', '_blank')}
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05]"
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Preview
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 disabled:opacity-50"
          >
            <Save className="w-4 h-4 inline mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {status && (
        <div className={`mb-4 p-3 rounded-xl border text-sm ${
          status.includes('success') || status.includes('uploaded')
            ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {status}
        </div>
      )}

      <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-2">
        {/* Form Section */}
        <div className="space-y-6">
          {/* Visibility Toggle */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-100">Section Visibility</h3>
                <p className="text-xs text-slate-400 mt-1">Show or hide the hero section</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, show_hero: !formData.show_hero })}
                className={`p-2 rounded-lg ${formData.show_hero ? 'bg-teal-500/20 text-teal-300' : 'bg-white/[0.03] text-slate-400'}`}
              >
                {formData.show_hero ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-100">Content</h3>
            
            <label className="text-xs text-slate-400">
              Heading *
              <input
                type="text"
                value={formData.heading}
                onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                placeholder="Transform Your Career with AI"
                required
              />
            </label>
            
            <label className="text-xs text-slate-400">
              Subheading *
              <textarea
                rows={3}
                value={formData.subheading}
                onChange={(e) => setFormData({ ...formData, subheading: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                placeholder="Learn cutting-edge skills from industry experts"
                required
              />
            </label>
          </div>

          {/* Badge */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-100">Badge</h3>
            
            <label className="text-xs text-slate-400">
              Badge Text
              <input
                type="text"
                value={formData.badge_text}
                onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                placeholder="New Course Available"
              />
            </label>
            
            <label className="text-xs text-slate-400">
              Badge Color
              <div className="mt-1 flex items-center gap-3">
                <input
                  type="color"
                  value={formData.badge_color}
                  onChange={(e) => setFormData({ ...formData, badge_color: e.target.value })}
                  className="w-20 h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                />
                <input
                  type="text"
                  value={formData.badge_color}
                  onChange={(e) => setFormData({ ...formData, badge_color: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </div>
            </label>
          </div>

          {/* Video */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-100">Video</h3>
            
            <label className="text-xs text-slate-400">
              Video URL
              <input
                type="url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                placeholder="https://www.youtube.com/embed/..."
              />
            </label>
            
            <label className="text-xs text-slate-400">
              Video Title
              <input
                type="text"
                value={formData.video_title}
                onChange={(e) => setFormData({ ...formData, video_title: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                placeholder="Course Introduction Video"
              />
            </label>
            
            <label className="flex items-center gap-2 text-xs text-slate-400 p-3 rounded-lg border border-white/10 bg-white/[0.02]">
              <input
                type="checkbox"
                checked={formData.video_autoplay}
                onChange={(e) => setFormData({ ...formData, video_autoplay: e.target.checked })}
                className="rounded border-white/10 bg-white/[0.03]"
              />
              Autoplay Video
            </label>
          </div>

          {/* CTA Buttons */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-100">CTA Buttons</h3>
            
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs text-slate-400">
                Primary CTA Text
                <input
                  type="text"
                  value={formData.cta_text}
                  onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="Get Started"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Primary CTA Link
                <input
                  type="text"
                  value={formData.cta_link}
                  onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="/courses"
                />
              </label>
            </div>
            
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs text-slate-400">
                Secondary CTA Text
                <input
                  type="text"
                  value={formData.secondary_cta_text}
                  onChange={(e) => setFormData({ ...formData, secondary_cta_text: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="Learn More"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Secondary CTA Link
                <input
                  type="text"
                  value={formData.secondary_cta_link}
                  onChange={(e) => setFormData({ ...formData, secondary_cta_link: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="/about"
                />
              </label>
            </div>
          </div>

          {/* Images */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-100">Background Images</h3>
            
            <label className="text-xs text-slate-400">
              Background Image URL
              <input
                type="url"
                value={formData.background_image}
                onChange={(e) => setFormData({ ...formData, background_image: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                placeholder="https://..."
              />
            </label>
            
            <label className="text-xs text-slate-400">
              Upload Background Image
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUpload('background_image', e.target.files?.[0])}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
              />
              {uploading === 'background_image' && <p className="mt-1 text-xs text-slate-400">Uploading...</p>}
            </label>
            
            <label className="text-xs text-slate-400">
              Mobile Background Image URL
              <input
                type="url"
                value={formData.mobile_background_image}
                onChange={(e) => setFormData({ ...formData, mobile_background_image: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                placeholder="https://..."
              />
            </label>
            
            <label className="text-xs text-slate-400">
              Upload Mobile Background Image
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUpload('mobile_background_image', e.target.files?.[0])}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
              />
              {uploading === 'mobile_background_image' && <p className="mt-1 text-xs text-slate-400">Uploading...</p>}
            </label>
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-base font-semibold text-slate-100 mb-4">Preview</h3>
            <div className="rounded-xl overflow-hidden border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-8 min-h-[400px] relative">
              {formData.background_image && (
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-30"
                  style={{ backgroundImage: `url(${formData.background_image})` }}
                />
              )}
              
              <div className="relative z-10">
                {formData.badge_text && (
                  <div 
                    className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-4"
                    style={{ backgroundColor: formData.badge_color, color: '#fff' }}
                  >
                    {formData.badge_text}
                  </div>
                )}
                
                <h1 className="text-3xl font-bold text-white mb-3">
                  {formData.heading || 'Heading Preview'}
                </h1>
                
                <p className="text-slate-300 mb-6">
                  {formData.subheading || 'Subheading preview text will appear here...'}
                </p>
                
                <div className="flex gap-3">
                  {formData.cta_text && (
                    <button 
                      className="px-4 py-2 rounded-lg bg-teal-500 text-white text-sm font-medium"
                      disabled
                    >
                      {formData.cta_text}
                    </button>
                  )}
                  {formData.secondary_cta_text && (
                    <button 
                      className="px-4 py-2 rounded-lg border border-white/20 text-white text-sm font-medium"
                      disabled
                    >
                      {formData.secondary_cta_text}
                    </button>
                  )}
                </div>
                
                {formData.video_url && (
                  <div className="mt-6 p-4 rounded-lg bg-white/10 border border-white/10">
                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                      <Video className="w-4 h-4" />
                      <span>Video: {formData.video_title || 'Video Preview'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
            <h3 className="text-base font-semibold text-slate-100">Quick Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span>Status</span>
                <span className={formData.show_hero ? 'text-teal-400' : 'text-rose-400'}>
                  {formData.show_hero ? 'Visible' : 'Hidden'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Video</span>
                <span className={formData.video_url ? 'text-teal-400' : 'text-slate-500'}>
                  {formData.video_url ? 'Configured' : 'Not Set'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Background</span>
                <span className={formData.background_image ? 'text-teal-400' : 'text-slate-500'}>
                  {formData.background_image ? 'Set' : 'Not Set'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>CTA Buttons</span>
                <span className={(formData.cta_text || formData.secondary_cta_text) ? 'text-teal-400' : 'text-slate-500'}>
                  {(formData.cta_text || formData.secondary_cta_text) ? 'Configured' : 'Not Set'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Surface>
  )
}
