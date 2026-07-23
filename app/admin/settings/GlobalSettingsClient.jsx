'use client'

import { useState, useEffect } from 'react'
import { Surface } from '../../../src/components/ui/Surface'
import { adminApiFetch } from '../../../lib/adminApiClient'
import { uploadFileAsset } from '../../../lib/storageUpload'
import { 
  Save, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  Clock,
  Facebook,
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  MessageSquare,
  Code,
  Settings as SettingsIcon,
  Shield,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

export default function GlobalSettingsClient() {
  const [settings, setSettings] = useState({
    business_name: '',
    tagline: '',
    description: '',
    logo_url: '',
    logo_alt: '',
    favicon_url: '',
    phone: '',
    phone_formatted: '',
    email: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    linkedin_url: '',
    twitter_url: '',
    instagram_url: '',
    facebook_url: '',
    youtube_url: '',
    whatsapp_url: '',
    maintenance_mode: false,
    maintenance_message: 'Site is under maintenance. Please check back soon.',
    maintenance_allowed_ips: [],
    google_maps_enabled: true,
    google_maps_api_key: '',
    google_maps_embed_url: '',
    business_hours: {
      monday: '9:00 AM - 6:00 PM',
      tuesday: '9:00 AM - 6:00 PM',
      wednesday: '9:00 AM - 6:00 PM',
      thursday: '9:00 AM - 6:00 PM',
      friday: '9:00 AM - 6:00 PM',
      saturday: '10:00 AM - 4:00 PM',
      sunday: 'Closed',
    },
    google_analytics_id: '',
    google_tag_manager_id: '',
    facebook_pixel_id: '',
    meta_pixel_id: '',
    smtp_enabled: false,
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_from_email: '',
    smtp_from_name: '',
    default_meta_title: '',
    default_meta_description: '',
    default_og_image_url: '',
    cookie_banner_enabled: true,
    cookie_banner_text: '',
    copyright_text: '',
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [uploading, setUploading] = useState('')
  const [activeSection, setActiveSection] = useState('business')
  const [expandedSections, setExpandedSections] = useState(new Set(['business']))

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
        .from('global_settings')
        .select('*')
        .single()
      
      if (data) {
        setSettings({
          ...settings,
          ...data,
          business_hours: typeof data.business_hours === 'string' 
            ? JSON.parse(data.business_hours) 
            : data.business_hours || settings.business_hours,
          maintenance_allowed_ips: data.maintenance_allowed_ips || [],
        })
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
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
        .from('global_settings')
        .update(settings)
        .eq('id', settings.id)
        .single()
      
      if (error) throw error
      
      setStatus('Settings saved successfully.')
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
      const asset = await uploadFileAsset(file, 'global-settings')
      setSettings(prev => ({ ...prev, [field]: asset.url }))
      setStatus('Image uploaded successfully.')
    } catch (error) {
      setStatus(error?.message || 'Upload failed.')
    } finally {
      setUploading('')
    }
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

  function updateBusinessHours(day, value) {
    setSettings(prev => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: value,
      }
    }))
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Global Settings</h2>
          <p className="mt-1 text-sm text-slate-300">Manage site-wide configuration and business information</p>
        </div>
        <button
          type="button"
          onClick={saveSettings}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 disabled:opacity-50"
        >
          <Save className="w-4 h-4 inline mr-2" />
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      {status && (
        <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-slate-300">
          {status}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Section Navigation */}
        <aside className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-100 mb-3">Settings Sections</h3>
          {[
            { id: 'business', label: 'Business Info', icon: Building2 },
            { id: 'branding', label: 'Branding', icon: ImageIcon },
            { id: 'contact', label: 'Contact', icon: Phone },
            { id: 'social', label: 'Social Media', icon: Globe },
            { id: 'maps', label: 'Google Maps', icon: MapPin },
            { id: 'hours', label: 'Business Hours', icon: Clock },
            { id: 'analytics', label: 'Analytics', icon: Code },
            { id: 'smtp', label: 'Email/SMTP', icon: Mail },
            { id: 'seo', label: 'Default SEO', icon: SettingsIcon },
            { id: 'site', label: 'Site Settings', icon: Shield },
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
          {/* Business Info */}
          {activeSection === 'business' && expandedSections.has('business') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <h3 className="text-base font-semibold text-slate-100">Business Information</h3>
              
              <label className="text-xs text-slate-400">
                Business Name
                <input
                  type="text"
                  value={settings.business_name}
                  onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Tagline
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Description
                <textarea
                  value={settings.description}
                  onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
            </div>
          )}

          {/* Branding */}
          {activeSection === 'branding' && expandedSections.has('branding') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <h3 className="text-base font-semibold text-slate-100">Branding</h3>
              
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
                Logo Alt Text
                <input
                  type="text"
                  value={settings.logo_alt}
                  onChange={(e) => setSettings({ ...settings, logo_alt: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Favicon URL
                <input
                  type="url"
                  value={settings.favicon_url}
                  onChange={(e) => setSettings({ ...settings, favicon_url: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
            </div>
          )}

          {/* Contact */}
          {activeSection === 'contact' && expandedSections.has('contact') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <h3 className="text-base font-semibold text-slate-100">Contact Information</h3>
              
              <label className="text-xs text-slate-400">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                <MapPin className="w-4 h-4 inline mr-1" />
                Address
                <textarea
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  rows={2}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs text-slate-400">
                  City
                  <input
                    type="text"
                    value={settings.city}
                    onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  />
                </label>
                
                <label className="text-xs text-slate-400">
                  State
                  <input
                    type="text"
                    value={settings.state}
                    onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  />
                </label>
                
                <label className="text-xs text-slate-400">
                  Country
                  <input
                    type="text"
                    value={settings.country}
                    onChange={(e) => setSettings({ ...settings, country: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  />
                </label>
                
                <label className="text-xs text-slate-400">
                  Postal Code
                  <input
                    type="text"
                    value={settings.postal_code}
                    onChange={(e) => setSettings({ ...settings, postal_code: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Social Media */}
          {activeSection === 'social' && expandedSections.has('social') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <h3 className="text-base font-semibold text-slate-100">Social Media</h3>
              
              <label className="text-xs text-slate-400">
                <Linkedin className="w-4 h-4 inline mr-1" />
                LinkedIn URL
                <input
                  type="url"
                  value={settings.linkedin_url}
                  onChange={(e) => setSettings({ ...settings, linkedin_url: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                <Twitter className="w-4 h-4 inline mr-1" />
                Twitter URL
                <input
                  type="url"
                  value={settings.twitter_url}
                  onChange={(e) => setSettings({ ...settings, twitter_url: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                <Instagram className="w-4 h-4 inline mr-1" />
                Instagram URL
                <input
                  type="url"
                  value={settings.instagram_url}
                  onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                <Facebook className="w-4 h-4 inline mr-1" />
                Facebook URL
                <input
                  type="url"
                  value={settings.facebook_url}
                  onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                <Youtube className="w-4 h-4 inline mr-1" />
                YouTube URL
                <input
                  type="url"
                  value={settings.youtube_url}
                  onChange={(e) => setSettings({ ...settings, youtube_url: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                <MessageSquare className="w-4 h-4 inline mr-1" />
                WhatsApp URL
                <input
                  type="url"
                  value={settings.whatsapp_url}
                  onChange={(e) => setSettings({ ...settings, whatsapp_url: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
            </div>
          )}

          {/* Google Maps */}
          {activeSection === 'maps' && expandedSections.has('maps') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Google Maps</h3>
                <label className="flex items-center gap-2 text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={settings.google_maps_enabled}
                    onChange={(e) => setSettings({ ...settings, google_maps_enabled: e.target.checked })}
                    className="rounded border-white/10 bg-white/[0.03]"
                  />
                  Enabled
                </label>
              </div>
              
              <label className="text-xs text-slate-400">
                API Key
                <input
                  type="text"
                  value={settings.google_maps_api_key}
                  onChange={(e) => setSettings({ ...settings, google_maps_api_key: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Embed URL
                <input
                  type="url"
                  value={settings.google_maps_embed_url}
                  onChange={(e) => setSettings({ ...settings, google_maps_embed_url: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="https://www.google.com/maps/embed?pb=..."
                />
              </label>
            </div>
          )}

          {/* Business Hours */}
          {activeSection === 'hours' && expandedSections.has('hours') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <h3 className="text-base font-semibold text-slate-100">Business Hours</h3>
              
              {Object.entries(settings.business_hours).map(([day, hours]) => (
                <label key={day} className="text-xs text-slate-400 capitalize">
                  {day}
                  <input
                    type="text"
                    value={hours}
                    onChange={(e) => updateBusinessHours(day, e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    placeholder="9:00 AM - 6:00 PM or Closed"
                  />
                </label>
              ))}
            </div>
          )}

          {/* Analytics */}
          {activeSection === 'analytics' && expandedSections.has('analytics') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <h3 className="text-base font-semibold text-slate-100">Analytics & Tracking</h3>
              
              <label className="text-xs text-slate-400">
                Google Analytics ID
                <input
                  type="text"
                  value={settings.google_analytics_id}
                  onChange={(e) => setSettings({ ...settings, google_analytics_id: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="G-XXXXXXXXXX"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Google Tag Manager ID
                <input
                  type="text"
                  value={settings.google_tag_manager_id}
                  onChange={(e) => setSettings({ ...settings, google_tag_manager_id: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="GTM-XXXXXX"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Facebook Pixel ID
                <input
                  type="text"
                  value={settings.facebook_pixel_id}
                  onChange={(e) => setSettings({ ...settings, facebook_pixel_id: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="XXXXXXXXXXXXXXXX"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Meta Pixel ID
                <input
                  type="text"
                  value={settings.meta_pixel_id}
                  onChange={(e) => setSettings({ ...settings, meta_pixel_id: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="XXXXXXXXXXXXXXXX"
                />
              </label>
            </div>
          )}

          {/* SMTP */}
          {activeSection === 'smtp' && expandedSections.has('smtp') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Email/SMTP Configuration</h3>
                <label className="flex items-center gap-2 text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={settings.smtp_enabled}
                    onChange={(e) => setSettings({ ...settings, smtp_enabled: e.target.checked })}
                    className="rounded border-white/10 bg-white/[0.03]"
                  />
                  Enabled
                </label>
              </div>
              
              <label className="text-xs text-slate-400">
                SMTP Host
                <input
                  type="text"
                  value={settings.smtp_host}
                  onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                SMTP Port
                <input
                  type="number"
                  value={settings.smtp_port}
                  onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) || 587 })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Username
                <input
                  type="text"
                  value={settings.smtp_username}
                  onChange={(e) => setSettings({ ...settings, smtp_username: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Password
                <input
                  type="password"
                  value={settings.smtp_password}
                  onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                From Email
                <input
                  type="email"
                  value={settings.smtp_from_email}
                  onChange={(e) => setSettings({ ...settings, smtp_from_email: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                From Name
                <input
                  type="text"
                  value={settings.smtp_from_name}
                  onChange={(e) => setSettings({ ...settings, smtp_from_name: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
            </div>
          )}

          {/* Default SEO */}
          {activeSection === 'seo' && expandedSections.has('seo') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <h3 className="text-base font-semibold text-slate-100">Default SEO Settings</h3>
              
              <label className="text-xs text-slate-400">
                Default Meta Title
                <input
                  type="text"
                  value={settings.default_meta_title}
                  onChange={(e) => setSettings({ ...settings, default_meta_title: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Default Meta Description
                <textarea
                  value={settings.default_meta_description}
                  onChange={(e) => setSettings({ ...settings, default_meta_description: e.target.value })}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Default OG Image URL
                <input
                  type="url"
                  value={settings.default_og_image_url}
                  onChange={(e) => setSettings({ ...settings, default_og_image_url: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
            </div>
          )}

          {/* Site Settings */}
          {activeSection === 'site' && expandedSections.has('site') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <h3 className="text-base font-semibold text-slate-100">Site Settings</h3>
              
              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10">
                <label className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                  <input
                    type="checkbox"
                    checked={settings.maintenance_mode}
                    onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                    className="rounded border-white/10 bg-white/[0.03]"
                  />
                  <span className="font-medium text-rose-300">Maintenance Mode</span>
                </label>
                <p className="text-xs text-slate-400 mb-3">
                  When enabled, the website will show a maintenance page to all visitors except admins.
                </p>
                
                <label className="text-xs text-slate-400">
                  Maintenance Message
                  <textarea
                    value={settings.maintenance_message}
                    onChange={(e) => setSettings({ ...settings, maintenance_message: e.target.value })}
                    rows={2}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    placeholder="Site is under maintenance. Please check back soon."
                  />
                </label>
                
                <label className="text-xs text-slate-400 mt-3">
                  Allowed IP Addresses (one per line)
                  <textarea
                    value={(settings.maintenance_allowed_ips || []).join('\n')}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      maintenance_allowed_ips: e.target.value.split('\n').filter(ip => ip.trim()) 
                    })}
                    rows={3}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100 font-mono"
                    placeholder="192.168.1.1&#10;10.0.0.1"
                  />
                  <p className="text-xs text-slate-500 mt-1">Leave empty to allow only admins during maintenance.</p>
                </label>
              </div>
              
              <label className="flex items-center gap-2 text-xs text-slate-400 p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                <input
                  type="checkbox"
                  checked={settings.cookie_banner_enabled}
                  onChange={(e) => setSettings({ ...settings, cookie_banner_enabled: e.target.checked })}
                  className="rounded border-white/10 bg-white/[0.03]"
                />
                Cookie Banner
              </label>
              
              <label className="text-xs text-slate-400">
                Cookie Banner Text
                <textarea
                  value={settings.cookie_banner_text}
                  onChange={(e) => setSettings({ ...settings, cookie_banner_text: e.target.value })}
                  rows={2}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Copyright Text
                <input
                  type="text"
                  value={settings.copyright_text}
                  onChange={(e) => setSettings({ ...settings, copyright_text: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
            </div>
          )}
        </main>
      </div>
    </Surface>
  )
}