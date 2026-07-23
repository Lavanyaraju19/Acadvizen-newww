'use client'

import { useState, useEffect } from 'react'
import { Surface } from '../../../src/components/ui/Surface'
import { adminApiFetch } from '../../../lib/adminApiClient'
import { 
  RefreshCw, 
  Download, 
  Globe, 
  CheckCircle,
  FileText,
  BookOpen,
  GraduationCap,
  MapPin,
  Clock,
  BarChart3
} from 'lucide-react'

export default function SitemapManagerClient() {
  const [settings, setSettings] = useState({
    include_pages: true,
    include_blogs: true,
    include_courses: true,
    include_cities: true,
    changefreq_pages: 'weekly',
    changefreq_blogs: 'weekly',
    changefreq_courses: 'monthly',
    changefreq_cities: 'monthly',
    priority_pages: 0.8,
    priority_blogs: 0.6,
    priority_courses: 0.7,
    priority_cities: 0.5,
    last_generated: null,
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setLoading(true)
    try {
      const { supabase } = await import('@supabase/supabase-js')
      const supabaseClient = supabase.createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
      )
      
      const { data } = await supabaseClient
        .from('sitemap_settings')
        .select('*')
        .single()
      
      if (data) {
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to load sitemap settings:', error)
    } finally {
      setLoading(false)
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
        .from('sitemap_settings')
        .update(settings)
        .eq('id', settings.id)
        .single()
      
      if (error) throw error
      
      setStatus('Sitemap settings saved successfully.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save sitemap settings.')
    } finally {
      setSaving(false)
    }
  }

  async function generateSitemap() {
    setGenerating(true)
    setStatus('')
    try {
      const response = await fetch('/api/cms/sitemap/generate')
      if (!response.ok) throw new Error('Failed to generate sitemap')
      
      setStatus('Sitemap generated successfully.')
      await loadSettings()
    } catch (error) {
      setStatus(error?.message || 'Failed to generate sitemap.')
    } finally {
      setGenerating(false)
    }
  }

  async function downloadSitemap() {
    try {
      const response = await fetch('/api/cms/sitemap/generate')
      if (!response.ok) throw new Error('Failed to download sitemap')
      
      const xml = await response.text()
      const blob = new Blob([xml], { type: 'application/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'sitemap.xml'
      a.click()
      setStatus('Sitemap downloaded successfully.')
    } catch (error) {
      setStatus(error?.message || 'Failed to download sitemap.')
    }
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">XML Sitemap Manager</h2>
          <p className="mt-1 text-sm text-slate-300">Configure and generate your website sitemap for search engines</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={downloadSitemap}
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]"
          >
            <Download className="w-4 h-4 inline mr-2" />
            Download
          </button>
          <button
            type="button"
            onClick={generateSitemap}
            disabled={generating}
            className="px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 inline mr-2 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Generating...' : 'Generate Now'}
          </button>
        </div>
      </div>

      {status && (
        <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-slate-300">
          {status}
        </div>
      )}

      {/* Last Generated */}
      {settings.last_generated && (
        <div className="mb-6 p-4 rounded-xl border border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Clock className="w-4 h-4" />
            <span>Last generated: {new Date(settings.last_generated).toLocaleString()}</span>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Content Types */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-teal-400" />
            Content Types
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-200">Pages</span>
              </div>
              <input
                type="checkbox"
                checked={settings.include_pages}
                onChange={(e) => setSettings({ ...settings, include_pages: e.target.checked })}
                className="rounded border-white/10 bg-white/[0.03]"
              />
            </label>
            
            <label className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-200">Blogs</span>
              </div>
              <input
                type="checkbox"
                checked={settings.include_blogs}
                onChange={(e) => setSettings({ ...settings, include_blogs: e.target.checked })}
                className="rounded border-white/10 bg-white/[0.03]"
              />
            </label>
            
            <label className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-200">Courses</span>
              </div>
              <input
                type="checkbox"
                checked={settings.include_courses}
                onChange={(e) => setSettings({ ...settings, include_courses: e.target.checked })}
                className="rounded border-white/10 bg-white/[0.03]"
              />
            </label>
            
            <label className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-200">City Pages</span>
              </div>
              <input
                type="checkbox"
                checked={settings.include_cities}
                onChange={(e) => setSettings({ ...settings, include_cities: e.target.checked })}
                className="rounded border-white/10 bg-white/[0.03]"
              />
            </label>
          </div>
        </div>

        {/* Change Frequency */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-400" />
            Change Frequency
          </h3>
          
          <div className="space-y-4">
            <label className="text-xs text-slate-400">
              Pages
              <select
                value={settings.changefreq_pages}
                onChange={(e) => setSettings({ ...settings, changefreq_pages: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
              >
                <option value="always">Always</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="never">Never</option>
              </select>
            </label>
            
            <label className="text-xs text-slate-400">
              Blogs
              <select
                value={settings.changefreq_blogs}
                onChange={(e) => setSettings({ ...settings, changefreq_blogs: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
              >
                <option value="always">Always</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="never">Never</option>
              </select>
            </label>
            
            <label className="text-xs text-slate-400">
              Courses
              <select
                value={settings.changefreq_courses}
                onChange={(e) => setSettings({ ...settings, changefreq_courses: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
              >
                <option value="always">Always</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="never">Never</option>
              </select>
            </label>
            
            <label className="text-xs text-slate-400">
              City Pages
              <select
                value={settings.changefreq_cities}
                onChange={(e) => setSettings({ ...settings, changefreq_cities: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
              >
                <option value="always">Always</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="never">Never</option>
              </select>
            </label>
          </div>
        </div>

        {/* Priority */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-400" />
            Priority (0.0 - 1.0)
          </h3>
          
          <div className="space-y-4">
            <label className="text-xs text-slate-400">
              Pages
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={settings.priority_pages}
                onChange={(e) => setSettings({ ...settings, priority_pages: parseFloat(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
              />
            </label>
            
            <label className="text-xs text-slate-400">
              Blogs
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={settings.priority_blogs}
                onChange={(e) => setSettings({ ...settings, priority_blogs: parseFloat(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
              />
            </label>
            
            <label className="text-xs text-slate-400">
              Courses
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={settings.priority_courses}
                onChange={(e) => setSettings({ ...settings, priority_courses: parseFloat(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
              />
            </label>
            
            <label className="text-xs text-slate-400">
              City Pages
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={settings.priority_cities}
                onChange={(e) => setSettings({ ...settings, priority_cities: parseFloat(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
              />
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-base font-semibold text-slate-100 mb-4">Actions</h3>
          
          <div className="space-y-3">
            <button
              type="button"
              onClick={saveSettings}
              disabled={saving}
              className="w-full px-4 py-3 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            
            <div className="p-3 rounded-lg bg-white/[0.02]">
              <p className="text-xs text-slate-400 mb-2">Sitemap URL:</p>
              <code className="text-xs text-teal-300 break-all">
                {process.env.NEXT_PUBLIC_SITE_URL || 'https://acadvizen.com'}/api/cms/sitemap/generate
              </code>
            </div>
            
            <div className="p-3 rounded-lg bg-white/[0.02]">
              <p className="text-xs text-slate-400 mb-2">Submit to Google Search Console:</p>
              <p className="text-xs text-slate-300">
                After generating, submit your sitemap URL to Google Search Console for better indexing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Surface>
  )
}