'use client'

import { useState, useEffect } from 'react'
import { Surface } from '../../../src/components/ui/Surface'
import { adminApiFetch } from '../../../lib/adminApiClient'
import { uploadFileAsset } from '../../../lib/storageUpload'
import { 
  Save, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  GripVertical,
  Image as ImageIcon,
  Phone,
  Mail,
  ExternalLink,
  X,
  ChevronDown,
  ChevronUp,
  Layers,
  Settings
} from 'lucide-react'

const SOCIAL_PLATFORMS = [
  { id: 'linkedin', label: 'LinkedIn', icon: 'in' },
  { id: 'twitter', label: 'Twitter', icon: '𝕏' },
  { id: 'instagram', label: 'Instagram', icon: '📷' },
  { id: 'facebook', label: 'Facebook', icon: 'f' },
  { id: 'youtube', label: 'YouTube', icon: '▶' },
  { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
]

export default function HeaderBuilderClient() {
  const [settings, setSettings] = useState({
    logo_url: '',
    logo_alt: 'Acadvizen',
    logo_link: '/',
    announcement_enabled: false,
    announcement_text: '',
    announcement_link: '',
    announcement_bg_color: '#10b981',
    announcement_text_color: '#ffffff',
    nav_items: [],
    primary_cta_enabled: true,
    primary_cta_text: 'Get Started',
    primary_cta_link: '/courses',
    primary_cta_bg_color: '#14b8a6',
    primary_cta_text_color: '#ffffff',
    secondary_cta_enabled: false,
    secondary_cta_text: 'Login',
    secondary_cta_link: '/login',
    secondary_cta_bg_color: 'transparent',
    secondary_cta_text_color: '#ffffff',
    secondary_cta_border_color: '#ffffff',
    show_phone: false,
    phone_number: '',
    phone_link: '',
    show_email: false,
    email_address: '',
    email_link: '',
    show_social: false,
    social_items: [],
    sticky_header: false,
    transparent_header: false,
    header_bg_color: '#050b12',
    header_text_color: '#ffffff',
    header_border_color: 'rgba(255,255,255,0.1)',
    mobile_menu_style: 'drawer',
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [uploading, setUploading] = useState('')
  const [activeSection, setActiveSection] = useState('logo')
  const [expandedSections, setExpandedSections] = useState(new Set(['logo']))

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const { supabase } = await import('@supabase/supabase-js')
      const supabaseClient = supabase.createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      
      const { data } = await supabaseClient
        .from('header_settings')
        .select('*')
        .single()
      
      if (data) {
        setSettings({
          ...settings,
          ...data,
          nav_items: Array.isArray(data.nav_items) ? data.nav_items : [],
          social_items: Array.isArray(data.social_items) ? data.social_items : [],
        })
      }
    } catch (error) {
      console.error('Failed to load header settings:', error)
    }
  }

  async function saveSettings() {
    setSaving(true)
    setStatus('')
    try {
      const { supabase } = await import('@supabase/supabase-js')
      const supabaseClient = supabase.createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
      )
      
      const { error } = await supabaseClient
        .from('header_settings')
        .update(settings)
        .eq('id', settings.id)
        .single()
      
      if (error) throw error
      
      setStatus('Header settings saved successfully.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpload(field, file) {
    if (!file) return
    setUploading(field)
    setStatus('')
    try {
      const asset = await uploadFileAsset(file, 'header')
      setSettings(prev => ({ ...prev, [field]: asset.url }))
      setStatus('Image uploaded successfully.')
    } catch (error) {
      setStatus(error?.message || 'Upload failed.')
    } finally {
      setUploading('')
    }
  }

  function addNavItem() {
    setSettings(prev => ({
      ...prev,
      nav_items: [...prev.nav_items, { label: '', link: '/', active: true }]
    }))
  }

  function updateNavItem(index, field, value) {
    setSettings(prev => ({
      ...prev,
      nav_items: prev.nav_items.map((item, i) => i === index ? { ...item, [field]: value } : item)
    }))
  }

  function removeNavItem(index) {
    setSettings(prev => ({
      ...prev,
      nav_items: prev.nav_items.filter((_, i) => i !== index)
    }))
  }

  function moveNavItemUp(index) {
    if (index === 0) return
    const newItems = [...settings.nav_items]
    const [removed] = newItems.splice(index, 1)
    newItems.splice(index - 1, 0, removed)
    setSettings(prev => ({ ...prev, nav_items: newItems }))
  }

  function moveNavItemDown(index) {
    if (index === settings.nav_items.length - 1) return
    const newItems = [...settings.nav_items]
    const [removed] = newItems.splice(index, 1)
    newItems.splice(index + 1, 0, removed)
    setSettings(prev => ({ ...prev, nav_items: newItems }))
  }

  function addSocialItem() {
    setSettings(prev => ({
      ...prev,
      social_items: [...prev.social_items, { platform: 'linkedin', url: '', active: true }]
    }))
  }

  function updateSocialItem(index, field, value) {
    setSettings(prev => ({
      ...prev,
      social_items: prev.social_items.map((item, i) => i === index ? { ...item, [field]: value } : item)
    }))
  }

  function removeSocialItem(index) {
    setSettings(prev => ({
      ...prev,
      social_items: prev.social_items.filter((_, i) => i !== index)
    }))
  }

  function toggleSection(section) {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Header Builder</h2>
          <p className="mt-1 text-sm text-slate-300">Customize website header, navigation, and contact info</p>
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
            onClick={saveSettings}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 disabled:opacity-50"
          >
            <Save className="w-4 h-4 inline mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {status && (
        <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-slate-300">
          {status}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Section Navigation */}
        <aside className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-100 mb-3">Sections</h3>
          {[
            { id: 'logo', label: 'Logo', icon: ImageIcon },
            { id: 'announcement', label: 'Announcement Bar', icon: Layers },
            { id: 'navigation', label: 'Navigation', icon: Layers },
            { id: 'cta', label: 'CTA Buttons', icon: ExternalLink },
            { id: 'contact', label: 'Contact Info', icon: Phone },
            { id: 'social', label: 'Social Icons', icon: Layers },
            { id: 'settings', label: 'Header Settings', icon: Settings },
          ].map(section => (
            <button
              key={section.id}
              type="button"
              onClick={() => { setActiveSection(section.id); toggleSection(section.id); }}
              className={`w-full text-left p-3 rounded-xl transition-colors flex items-center gap-3 ${
                activeSection === section.id 
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' 
                  : 'border border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.05]'
              }`}
            >
              <section.icon className="w-4 h-4" />
              <span className="text-sm">{section.label}</span>
            </button>
          ))}
        </aside>

        {/* Section Editor */}
        <main>
          {/* Logo Section */}
          {activeSection === 'logo' && expandedSections.has('logo') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <h3 className="text-base font-semibold text-slate-100">Logo Settings</h3>
              
              <label className="text-xs text-slate-400">
                Logo URL
                <input
                  type="url"
                  value={settings.logo_url}
                  onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Logo Upload
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload('logo_url', e.target.files?.[0])}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
                {uploading === 'logo_url' && <p className="mt-1 text-xs text-slate-400">Uploading...</p>}
              </label>
              
              <label className="text-xs text-slate-400">
                Alt Text
                <input
                  type="text"
                  value={settings.logo_alt}
                  onChange={(e) => setSettings({ ...settings, logo_alt: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Logo Link
                <input
                  type="text"
                  value={settings.logo_link}
                  onChange={(e) => setSettings({ ...settings, logo_link: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
            </div>
          )}

          {/* Announcement Bar */}
          {activeSection === 'announcement' && expandedSections.has('announcement') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Announcement Bar</h3>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, announcement_enabled: !settings.announcement_enabled })}
                  className={`p-2 rounded-lg ${settings.announcement_enabled ? 'bg-teal-500/20 text-teal-300' : 'bg-white/[0.03] text-slate-400'}`}
                >
                  {settings.announcement_enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              
              <label className="text-xs text-slate-400">
                Announcement Text
                <input
                  type="text"
                  value={settings.announcement_text}
                  onChange={(e) => setSettings({ ...settings, announcement_text: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="Special offer: 50% off all courses!"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Link URL (optional)
                <input
                  type="url"
                  value={settings.announcement_link}
                  onChange={(e) => setSettings({ ...settings, announcement_link: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs text-slate-400">
                  Background Color
                  <input
                    type="color"
                    value={settings.announcement_bg_color}
                    onChange={(e) => setSettings({ ...settings, announcement_bg_color: e.target.value })}
                    className="mt-1 w-full h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                  />
                </label>
                
                <label className="text-xs text-slate-400">
                  Text Color
                  <input
                    type="color"
                    value={settings.announcement_text_color}
                    onChange={(e) => setSettings({ ...settings, announcement_text_color: e.target.value })}
                    className="mt-1 w-full h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Navigation */}
          {activeSection === 'navigation' && expandedSections.has('navigation') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Navigation Menu</h3>
                <button
                  type="button"
                  onClick={addNavItem}
                  className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05] text-sm"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add Item
                </button>
              </div>
              
              {settings.nav_items.map((item, index) => (
                <div key={index} className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex items-start gap-3">
                    <GripVertical className="w-5 h-5 text-slate-500 mt-2" />
                    <div className="flex-1 space-y-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="text-xs text-slate-400">
                          Label
                          <input
                            type="text"
                            value={item.label}
                            onChange={(e) => updateNavItem(index, 'label', e.target.value)}
                            className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                          />
                        </label>
                        
                        <label className="text-xs text-slate-400">
                          Link
                          <input
                            type="text"
                            value={item.link}
                            onChange={(e) => updateNavItem(index, 'link', e.target.value)}
                            className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                          />
                        </label>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-xs text-slate-400">
                          <input
                            type="checkbox"
                            checked={item.active}
                            onChange={(e) => updateNavItem(index, 'active', e.target.checked)}
                            className="rounded border-white/10 bg-white/[0.03]"
                          />
                          Visible
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => moveNavItemUp(index)}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveNavItemDown(index)}
                        disabled={index === settings.nav_items.length - 1}
                        className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeNavItem(index)}
                        className="p-1.5 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA Buttons */}
          {activeSection === 'cta' && expandedSections.has('cta') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <h3 className="text-base font-semibold text-slate-100">CTA Buttons</h3>
              
              {/* Primary CTA */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-200">Primary CTA</span>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, primary_cta_enabled: !settings.primary_cta_enabled })}
                    className={`p-2 rounded-lg ${settings.primary_cta_enabled ? 'bg-teal-500/20 text-teal-300' : 'bg-white/[0.03] text-slate-400'}`}
                  >
                    {settings.primary_cta_enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-xs text-slate-400">
                    Button Text
                    <input
                      type="text"
                      value={settings.primary_cta_text}
                      onChange={(e) => setSettings({ ...settings, primary_cta_text: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    />
                  </label>
                  
                  <label className="text-xs text-slate-400">
                    Link
                    <input
                      type="text"
                      value={settings.primary_cta_link}
                      onChange={(e) => setSettings({ ...settings, primary_cta_link: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    />
                  </label>
                </div>
                
                <div className="grid gap-3 md:grid-cols-2 mt-3">
                  <label className="text-xs text-slate-400">
                    Background Color
                    <input
                      type="color"
                      value={settings.primary_cta_bg_color}
                      onChange={(e) => setSettings({ ...settings, primary_cta_bg_color: e.target.value })}
                      className="mt-1 w-full h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                    />
                  </label>
                  
                  <label className="text-xs text-slate-400">
                    Text Color
                    <input
                      type="color"
                      value={settings.primary_cta_text_color}
                      onChange={(e) => setSettings({ ...settings, primary_cta_text_color: e.target.value })}
                      className="mt-1 w-full h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                    />
                  </label>
                </div>
              </div>
              
              {/* Secondary CTA */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-200">Secondary CTA</span>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, secondary_cta_enabled: !settings.secondary_cta_enabled })}
                    className={`p-2 rounded-lg ${settings.secondary_cta_enabled ? 'bg-teal-500/20 text-teal-300' : 'bg-white/[0.03] text-slate-400'}`}
                  >
                    {settings.secondary_cta_enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-xs text-slate-400">
                    Button Text
                    <input
                      type="text"
                      value={settings.secondary_cta_text}
                      onChange={(e) => setSettings({ ...settings, secondary_cta_text: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    />
                  </label>
                  
                  <label className="text-xs text-slate-400">
                    Link
                    <input
                      type="text"
                      value={settings.secondary_cta_link}
                      onChange={(e) => setSettings({ ...settings, secondary_cta_link: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Contact Info */}
          {activeSection === 'contact' && expandedSections.has('contact') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <h3 className="text-base font-semibold text-slate-100">Contact Information</h3>
              
              {/* Phone */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone
                  </span>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, show_phone: !settings.show_phone })}
                    className={`p-2 rounded-lg ${settings.show_phone ? 'bg-teal-500/20 text-teal-300' : 'bg-white/[0.03] text-slate-400'}`}
                  >
                    {settings.show_phone ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                
                <label className="text-xs text-slate-400">
                  Phone Number
                  <input
                    type="tel"
                    value={settings.phone_number}
                    onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  />
                </label>
                
                <label className="text-xs text-slate-400">
                  Phone Link (tel:)
                  <input
                    type="text"
                    value={settings.phone_link}
                    onChange={(e) => setSettings({ ...settings, phone_link: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    placeholder="tel:+919876543210"
                  />
                </label>
              </div>
              
              {/* Email */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </span>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, show_email: !settings.show_email })}
                    className={`p-2 rounded-lg ${settings.show_email ? 'bg-teal-500/20 text-teal-300' : 'bg-white/[0.03] text-slate-400'}`}
                  >
                    {settings.show_email ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                
                <label className="text-xs text-slate-400">
                  Email Address
                  <input
                    type="email"
                    value={settings.email_address}
                    onChange={(e) => setSettings({ ...settings, email_address: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  />
                </label>
                
                <label className="text-xs text-slate-400">
                  Email Link (mailto:)
                  <input
                    type="text"
                    value={settings.email_link}
                    onChange={(e) => setSettings({ ...settings, email_link: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    placeholder="mailto:info@acadvizen.com"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Social Icons */}
          {activeSection === 'social' && expandedSections.has('social') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Social Icons</h3>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, show_social: !settings.show_social })}
                  className={`p-2 rounded-lg ${settings.show_social ? 'bg-teal-500/20 text-teal-300' : 'bg-white/[0.03] text-slate-400'}`}
                >
                  {settings.show_social ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              
              <button
                type="button"
                onClick={addSocialItem}
                className="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05] text-sm"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Add Social Link
              </button>
              
              {settings.social_items.map((item, index) => (
                <div key={index} className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-xs text-slate-400">
                      Platform
                      <select
                        value={item.platform}
                        onChange={(e) => updateSocialItem(index, 'platform', e.target.value)}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      >
                        {SOCIAL_PLATFORMS.map(platform => (
                          <option key={platform.id} value={platform.id}>{platform.label}</option>
                        ))}
                      </select>
                    </label>
                    
                    <label className="text-xs text-slate-400">
                      URL
                      <input
                        type="url"
                        value={item.url}
                        onChange={(e) => updateSocialItem(index, 'url', e.target.value)}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      />
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <label className="flex items-center gap-2 text-xs text-slate-400">
                      <input
                        type="checkbox"
                        checked={item.active}
                        onChange={(e) => updateSocialItem(index, 'active', e.target.checked)}
                        className="rounded border-white/10 bg-white/[0.03]"
                      />
                      Visible
                    </label>
                    
                    <button
                      type="button"
                      onClick={() => removeSocialItem(index)}
                      className="p-1.5 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Header Settings */}
          {activeSection === 'settings' && expandedSections.has('settings') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <h3 className="text-base font-semibold text-slate-100">Header Settings</h3>
              
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex items-center gap-2 text-xs text-slate-400 p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                  <input
                    type="checkbox"
                    checked={settings.sticky_header}
                    onChange={(e) => setSettings({ ...settings, sticky_header: e.target.checked })}
                    className="rounded border-white/10 bg-white/[0.03]"
                  />
                  Sticky Header
                </label>
                
                <label className="flex items-center gap-2 text-xs text-slate-400 p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                  <input
                    type="checkbox"
                    checked={settings.transparent_header}
                    onChange={(e) => setSettings({ ...settings, transparent_header: e.target.checked })}
                    className="rounded border-white/10 bg-white/[0.03]"
                  />
                  Transparent Header
                </label>
              </div>
              
              <label className="text-xs text-slate-400">
                Background Color
                <input
                  type="color"
                  value={settings.header_bg_color}
                  onChange={(e) => setSettings({ ...settings, header_bg_color: e.target.value })}
                  className="mt-1 w-full h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Text Color
                <input
                  type="color"
                  value={settings.header_text_color}
                  onChange={(e) => setSettings({ ...settings, header_text_color: e.target.value })}
                  className="mt-1 w-full h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Border Color
                <input
                  type="color"
                  value={settings.header_border_color}
                  onChange={(e) => setSettings({ ...settings, header_border_color: e.target.value })}
                  className="mt-1 w-full h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Mobile Menu Style
                <select
                  value={settings.mobile_menu_style}
                  onChange={(e) => setSettings({ ...settings, mobile_menu_style: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                >
                  <option value="drawer">Drawer (Slide-in)</option>
                  <option value="dropdown">Dropdown</option>
                </select>
              </label>
            </div>
          )}
        </main>
      </div>
    </Surface>
  )
}