'use client'

import { useState, useEffect } from 'react'
import { Surface } from '../../../../src/components/ui/Surface'
import { adminApiFetch } from '../../../../lib/adminApiClient'
import { 
  Save, 
  Eye, 
  EyeOff, 
  Check,
  X
} from 'lucide-react'

export default function CtaBuilderClient() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    button_text: '',
    button_link: '',
    background_color: '#14b8a6',
    text_color: '#ffffff',
    is_active: true,
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    loadCtaData()
  }, [])

  async function loadCtaData() {
    setLoading(true)
    setStatus('')
    try {
      const data = await adminApiFetch('/api/cms/homepage/cta', { cache: 'no-store' })
      if (data) {
        setFormData(prev => ({
          ...prev,
          ...data,
          background_color: data.background_color || '#14b8a6',
          text_color: data.text_color || '#ffffff',
          is_active: data.is_active !== undefined ? data.is_active : true,
        }))
      }
    } catch (error) {
      setStatus(error?.message || 'Failed to load CTA data.')
    } finally {
      setLoading(false)
    }
  }

  async function saveCta() {
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch('/api/cms/homepage/cta', {
        method: 'POST',
        body: formData,
      })
      setStatus('CTA section saved successfully.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save CTA section.')
    } finally {
      setSaving(false)
    }
  }

  function validateForm() {
    if (!formData.title.trim()) {
      setStatus('Title is required.')
      return false
    }
    if (!formData.button_text.trim()) {
      setStatus('Button text is required.')
      return false
    }
    if (!formData.button_link.trim()) {
      setStatus('Button link is required.')
      return false
    }
    return true
  }

  function handleSave(e) {
    e.preventDefault()
    if (!validateForm()) return
    saveCta()
  }

  if (loading) {
    return (
      <Surface className="p-6 md:p-8">
        <div className="text-center text-slate-400">Loading CTA data...</div>
      </Surface>
    )
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">CTA Section Builder</h2>
          <p className="mt-1 text-sm text-slate-300">Customize the homepage call-to-action section</p>
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
          status.includes('success') || status.includes('saved')
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
                <p className="text-xs text-slate-400 mt-1">Show or hide the CTA section</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                className={`p-2 rounded-lg ${formData.is_active ? 'bg-teal-500/20 text-teal-300' : 'bg-white/[0.03] text-slate-400'}`}
              >
                {formData.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-100">Content</h3>
            
            <label className="text-xs text-slate-400">
              Title *
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                placeholder="Ready to Start Your Journey?"
                required
              />
            </label>
            
            <label className="text-xs text-slate-400">
              Description
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                placeholder="Join thousands of students who have transformed their careers..."
              />
            </label>
          </div>

          {/* CTA Button */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-100">CTA Button</h3>
            
            <label className="text-xs text-slate-400">
              Button Text *
              <input
                type="text"
                value={formData.button_text}
                onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                placeholder="Get Started Now"
                required
              />
            </label>
            
            <label className="text-xs text-slate-400">
              Button Link *
              <input
                type="text"
                value={formData.button_link}
                onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                placeholder="/courses"
                required
              />
            </label>
          </div>

          {/* Styling */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-100">Styling</h3>
            
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs text-slate-400">
                Background Color
                <div className="mt-1 flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    className="w-20 h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                  />
                  <input
                    type="text"
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  />
                </div>
              </label>
              
              <label className="text-xs text-slate-400">
                Text Color
                <div className="mt-1 flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.text_color}
                    onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                    className="w-20 h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                  />
                  <input
                    type="text"
                    value={formData.text_color}
                    onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  />
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-base font-semibold text-slate-100 mb-4">Preview</h3>
            <div 
              className="rounded-xl p-8 text-center min-h-[300px] flex flex-col items-center justify-center"
              style={{ 
                backgroundColor: formData.background_color,
                color: formData.text_color 
              }}
            >
              <h2 className="text-2xl font-bold mb-3">
                {formData.title || 'CTA Title Preview'}
              </h2>
              
              {formData.description && (
                <p className="mb-6 opacity-90">
                  {formData.description}
                </p>
              )}
              
              {formData.button_text && (
                <button 
                  className="px-6 py-3 rounded-lg font-medium transition-colors"
                  style={{ 
                    backgroundColor: formData.text_color,
                    color: formData.background_color
                  }}
                  disabled
                >
                  {formData.button_text}
                </button>
              )}
            </div>
          </div>

          {/* Quick Info */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
            <h3 className="text-base font-semibold text-slate-100">Quick Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span>Status</span>
                <span className={formData.is_active ? 'text-teal-400' : 'text-rose-400'}>
                  {formData.is_active ? 'Visible' : 'Hidden'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Background</span>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border border-white/20"
                    style={{ backgroundColor: formData.background_color }}
                  />
                  <span className="text-xs">{formData.background_color}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Text Color</span>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border border-white/20"
                    style={{ backgroundColor: formData.text_color }}
                  />
                  <span className="text-xs">{formData.text_color}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Button Configured</span>
                <span className={(formData.button_text && formData.button_link) ? 'text-teal-400' : 'text-slate-500'}>
                  {(formData.button_text && formData.button_link) ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Color Contrast Check */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-base font-semibold text-slate-100 mb-3">Color Contrast</h3>
            <div className="text-sm text-slate-400">
              <p className="mb-2">Preview the color combination:</p>
              <div 
                className="rounded-lg p-4 text-center"
                style={{ 
                  backgroundColor: formData.background_color,
                  color: formData.text_color 
                }}
              >
                <span className="font-medium">Sample Text</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Surface>
  )
}
