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
  MapPin,
  X,
  ChevronDown,
  ChevronUp,
  Layers,
  LayoutList
} from 'lucide-react'

const SOCIAL_PLATFORMS = [
  { id: 'linkedin', label: 'LinkedIn', icon: 'in' },
  { id: 'twitter', label: 'Twitter', icon: '𝕏' },
  { id: 'instagram', label: 'Instagram', icon: '📷' },
  { id: 'facebook', label: 'Facebook', icon: 'f' },
  { id: 'youtube', label: 'YouTube', icon: '▶' },
  { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
]

export default function FooterBuilderClient() {
  const [settings, setSettings] = useState({
    logo_url: '',
    logo_alt: 'Acadvizen',
    column1_title: 'Quick Links',
    column1_links: [],
    column2_title: 'Courses',
    column2_links: [],
    column3_title: 'Company',
    column3_links: [],
    column4_title: 'Contact',
    column4_links: [],
    show_contact: true,
    contact_phone: '',
    contact_email: '',
    contact_address: '',
    show_social: true,
    social_items: [],
    show_newsletter: false,
    newsletter_title: 'Subscribe to our newsletter',
    newsletter_placeholder: 'Enter your email',
    copyright_text: '© 2024 Acadvizen. All rights reserved.',
    show_legal: true,
    privacy_policy_link: '/privacy',
    terms_link: '/terms',
    cookie_policy_link: '/cookies',
    footer_bg_color: '#050b12',
    footer_text_color: '#ffffff',
    footer_link_color: '#94a3b8',
    footer_border_color: 'rgba(255,255,255,0.1)',
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [uploading, setUploading] = useState('')
  const [activeSection, setActiveSection] = useState('columns')
  const [expandedSections, setExpandedSections] = useState(new Set(['columns']))

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
        .from('footer_settings')
        .select('*')
        .single()
      
      if (data) {
        setSettings({
          ...settings,
          ...data,
          column1_links: Array.isArray(data.column1_links) ? data.column1_links : [],
          column2_links: Array.isArray(data.column2_links) ? data.column2_links : [],
          column3_links: Array.isArray(data.column3_links) ? data.column3_links : [],
          column4_links: Array.isArray(data.column4_links) ? data.column4_links : [],
          social_items: Array.isArray(data.social_items) ? data.social_items : [],
        })
      }
    } catch (error) {
      console.error('Failed to load footer settings:', error)
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
        .from('footer_settings')
        .update(settings)
        .eq('id', settings.id)
        .single()
      
      if (error) throw error
      
      setStatus('Footer settings saved successfully.')
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
      const asset = await uploadFileAsset(file, 'footer')
      setSettings(prev => ({ ...prev, [field]: asset.url }))
      setStatus('Image uploaded successfully.')
    } catch (error) {
      setStatus(error?.message || 'Upload failed.')
    } finally {
      setUploading('')
    }
  }

  function addLink(column) {
    setSettings(prev => ({
      ...prev,
      [`${column}_links`]: [...prev[`${column}_links`], { label: '', link: '/', active: true }]
    }))
  }

  function updateLink(column, index, field, value) {
    setSettings(prev => ({
      ...prev,
      [`${column}_links`]: prev[`${column}_links`].map((item, i) => i === index ? { ...item, [field]: value } : item)
    }))
  }

  function removeLink(column, index) {
    setSettings(prev => ({
      ...prev,
      [`${column}_links`]: prev[`${column}_links`].filter((_, i) => i !== index)
    }))
  }

  function moveLinkUp(column, index) {
    if (index === 0) return
    const newLinks = [...settings[`${column}_links`]]
    const [removed] = newLinks.splice(index, 1)
    newLinks.splice(index - 1, 0, removed)
    setSettings(prev => ({ ...prev, [`${column}_links`]: newLinks }))
  }

  function moveLinkDown(column, index) {
    if (index === settings[`${column}_links`].length - 1) return
    const newLinks = [...settings[`${column}_links`]]
    const [removed] = newLinks.splice(index, 1)
    newLinks.splice(index + 1, 0, removed)
    setSettings(prev => ({ ...prev, [`${column}_links`]: newLinks }))
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
          <h2 className="text-2xl font-semibold text-slate-50">Footer Builder</h2>
          <p className="mt-1 text-sm text-slate-300">Customize footer columns, links, and contact info</p>
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
            { id: 'columns', label: 'Footer Columns', icon: LayoutList },
            { id: 'contact', label: 'Contact Info', icon: Phone },
            { id: 'social', label: 'Social Icons', icon: Layers },
            { id: 'newsletter', label: 'Newsletter', icon: Mail },
            { id: 'legal', label: 'Legal & Copyright', icon: Layers },
            { id: 'settings', label: 'Footer Settings', icon: Layers },
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
              <h3 className="text-base font-semibold text-slate-100">Footer Logo</h3>
              
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
            </div>
          )}

          {/* Footer Columns */}
          {activeSection === 'columns' && expandedSections.has('columns') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-6">
              <h3 className="text-base font-semibold text-slate-100">Footer Columns</h3>
              
              {[1, 2, 3, 4].map(colNum => {
                const columnKey = `column${colNum}`
                const titleKey = `${columnKey}_title`
                const linksKey = `${columnKey}_links`
                
                return (
                  <div key={colNum} className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs text-slate-400">
                        Column {colNum} Title
                        <input
                          type="text"
                          value={settings[titleKey]}
                          onChange={(e) => setSettings({ ...settings, [titleKey]: e.target.value })}
                          className="mt-1 px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => addLink(columnKey)}
                        className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05] text-sm"
                      >
                        <Plus className="w-4 h-4 inline mr-1" />
                        Add Link
                      </button>
                    </div>
                    
                    {settings[linksKey].map((link, index) => (
                      <div key={index} className="p-3 rounded-lg border border-white/10 bg-white/[0.02] mb-2">
                        <div className="flex items-start gap-3">
                          <GripVertical className="w-5 h-5 text-slate-500 mt-1" />
                          <div className="flex-1 space-y-2">
                            <div className="grid gap-2 md:grid-cols-2">
                              <input
                                type="text"
                                value={link.label}
                                onChange={(e) => updateLink(columnKey, index, 'label', e.target.value)}
                                placeholder="Link Label"
                                className="px-3 py-1.5 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                              />
                              <input
                                type="text"
                                value={link.link}
                                onChange={(e) => updateLink(columnKey, index, 'link', e.target.value)}
                                placeholder="Link URL"
                                className="px-3 py-1.5 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                              />
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => moveLinkUp(columnKey, index)}
                              disabled={index === 0}
                              className="p-1 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] disabled:opacity-30"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveLinkDown(columnKey, index)}
                              disabled={index === settings[linksKey].length - 1}
                              className="p-1 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] disabled:opacity-30"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeLink(columnKey, index)}
                              className="p-1 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}

          {/* Contact Info */}
          {activeSection === 'contact' && expandedSections.has('contact') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Contact Information</h3>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, show_contact: !settings.show_contact })}
                  className={`p-2 rounded-lg ${settings.show_contact ? 'bg-teal-500/20 text-teal-300' : 'bg-white/[0.03] text-slate-400'}`}
                >
                  {settings.show_contact ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              
              <label className="text-xs text-slate-400">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone Number
                <input
                  type="tel"
                  value={settings.contact_phone}
                  onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                <Mail className="w-4 h-4 inline mr-1" />
                Email Address
                <input
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                <MapPin className="w-4 h-4 inline mr-1" />
                Address
                <textarea
                  value={settings.contact_address}
                  onChange={(e) => setSettings({ ...settings, contact_address: e.target.value })}
                  rows={2}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
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

          {/* Newsletter */}
          {activeSection === 'newsletter' && expandedSections.has('newsletter') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Newsletter</h3>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, show_newsletter: !settings.show_newsletter })}
                  className={`p-2 rounded-lg ${settings.show_newsletter ? 'bg-teal-500/20 text-teal-300' : 'bg-white/[0.03] text-slate-400'}`}
                >
                  {settings.show_newsletter ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              
              <label className="text-xs text-slate-400">
                Title
                <input
                  type="text"
                  value={settings.newsletter_title}
                  onChange={(e) => setSettings({ ...settings, newsletter_title: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Placeholder Text
                <input
                  type="text"
                  value={settings.newsletter_placeholder}
                  onChange={(e) => setSettings({ ...settings, newsletter_placeholder: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
            </div>
          )}

          {/* Legal & Copyright */}
          {activeSection === 'legal' && expandedSections.has('legal') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Legal & Copyright</h3>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, show_legal: !settings.show_legal })}
                  className={`p-2 rounded-lg ${settings.show_legal ? 'bg-teal-500/20 text-teal-300' : 'bg-white/[0.03] text-slate-400'}`}
                >
                  {settings.show_legal ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              
              <label className="text-xs text-slate-400">
                Copyright Text
                <input
                  type="text"
                  value={settings.copyright_text}
                  onChange={(e) => setSettings({ ...settings, copyright_text: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <div className="grid gap-3 md:grid-cols-3">
                <label className="text-xs text-slate-400">
                  Privacy Policy Link
                  <input
                    type="text"
                    value={settings.privacy_policy_link}
                    onChange={(e) => setSettings({ ...settings, privacy_policy_link: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  />
                </label>
                
                <label className="text-xs text-slate-400">
                  Terms Link
                  <input
                    type="text"
                    value={settings.terms_link}
                    onChange={(e) => setSettings({ ...settings, terms_link: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  />
                </label>
                
                <label className="text-xs text-slate-400">
                  Cookie Policy Link
                  <input
                    type="text"
                    value={settings.cookie_policy_link}
                    onChange={(e) => setSettings({ ...settings, cookie_policy_link: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Footer Settings */}
          {activeSection === 'settings' && expandedSections.has('settings') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <h3 className="text-base font-semibold text-slate-100">Footer Styling</h3>
              
              <label className="text-xs text-slate-400">
                Background Color
                <input
                  type="color"
                  value={settings.footer_bg_color}
                  onChange={(e) => setSettings({ ...settings, footer_bg_color: e.target.value })}
                  className="mt-1 w-full h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Text Color
                <input
                  type="color"
                  value={settings.footer_text_color}
                  onChange={(e) => setSettings({ ...settings, footer_text_color: e.target.value })}
                  className="mt-1 w-full h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Link Color
                <input
                  type="color"
                  value={settings.footer_link_color}
                  onChange={(e) => setSettings({ ...settings, footer_link_color: e.target.value })}
                  className="mt-1 w-full h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Border Color
                <input
                  type="color"
                  value={settings.footer_border_color}
                  onChange={(e) => setSettings({ ...settings, footer_border_color: e.target.value })}
                  className="mt-1 w-full h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                />
              </label>
            </div>
          )}
        </main>
      </div>
    </Surface>
  )
}