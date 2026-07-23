'use client'

import { useState, useEffect } from 'react'
import { Surface } from '../../../src/components/ui/Surface'
import { adminApiFetch } from '../../../lib/adminApiClient'
import { 
  Plus, 
  Save, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Layers,
  ChevronUp,
  ChevronDown,
  Lock,
  Unlock
} from 'lucide-react'

const HOMEPAGE_SECTIONS = [
  { id: 'hero', label: 'Hero Section', icon: '🚀', description: 'Main hero banner with CTA' },
  { id: 'about', label: 'About Section', icon: 'ℹ️', description: 'Company overview and mission' },
  { id: 'stats', label: 'Statistics', icon: '📊', description: 'Key metrics and achievements' },
  { id: 'courses', label: 'Courses', icon: '📚', description: 'Featured courses list' },
  { id: 'placements', label: 'Placements', icon: '🏢', description: 'Hiring companies showcase' },
  { id: 'testimonials', label: 'Testimonials', icon: '⭐', description: 'Student reviews' },
  { id: 'gallery', label: 'Gallery', icon: '🖼️', description: 'Image gallery' },
  { id: 'faq', label: 'FAQ', icon: '❓', description: 'Frequently asked questions' },
  { id: 'contact', label: 'Contact', icon: '📞', description: 'Contact form and info' },
  { id: 'footer', label: 'Footer', icon: '📋', description: 'Footer links and copyright' },
]

export default function HomepageBuilderClient() {
  const [homepage, setHomepage] = useState(null)
  const [sections, setSections] = useState([])
  const [settings, setSettings] = useState({
    hero_enabled: true,
    about_enabled: true,
    stats_enabled: true,
    courses_enabled: true,
    placements_enabled: true,
    testimonials_enabled: true,
    gallery_enabled: true,
    faq_enabled: true,
    contact_enabled: true,
    footer_enabled: true,
    section_order: HOMEPAGE_SECTIONS.map(s => s.id),
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [editingSection, setEditingSection] = useState(null)

  useEffect(() => {
    loadHomepage()
    loadSettings()
  }, [])

  async function loadHomepage() {
    try {
      const json = await adminApiFetch('/api/cms/pages?include_drafts=1&include_sections=1&limit=1', { cache: 'no-store' })
      const pages = Array.isArray(json.data) ? json.data : []
      const homePage = pages.find(p => p.slug === 'home')
      
      if (homePage) {
        setHomepage(homePage)
        setSections(Array.isArray(homePage.sections) ? homePage.sections : [])
      } else {
        setStatus('Homepage not found. Creating new homepage...')
        await createHomepage()
      }
    } catch (error) {
      setStatus(error?.message || 'Failed to load homepage.')
    }
  }

  async function loadSettings() {
    try {
      const { supabase } = await import('@supabase/supabase-js')
      const supabaseClient = supabase.createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      
      const { data } = await supabaseClient
        .from('homepage_settings')
        .select('*')
        .single()
      
      if (data) {
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to load homepage settings:', error)
    }
  }

  async function createHomepage() {
    try {
      const payload = {
        title: 'Home',
        slug: 'home',
        description: 'Acadvizen Homepage',
        status: 'published',
      }
      
      await adminApiFetch('/api/cms/pages', { method: 'POST', body: payload })
      await loadHomepage()
      setStatus('Homepage created successfully.')
    } catch (error) {
      setStatus(error?.message || 'Failed to create homepage.')
    }
  }

  async function saveSettings() {
    setLoading(true)
    setStatus('')
    try {
      const { supabase } = await import('@supabase/supabase-js')
      const supabaseClient = supabase.createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
      )
      
      const { error } = await supabaseClient
        .from('homepage_settings')
        .update(settings)
        .eq('id', settings.id)
        .single()
      
      if (error) throw error
      
      setStatus('Homepage settings saved.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save settings.')
    } finally {
      setLoading(false)
    }
  }

  async function toggleSectionVisibility(sectionId) {
    const settingKey = `${sectionId}_enabled`
    setSettings(prev => ({ ...prev, [settingKey]: !prev[settingKey] }))
    await saveSettings()
  }

  function moveSectionUp(index) {
    if (index === 0) return
    const newOrder = [...settings.section_order]
    const [removed] = newOrder.splice(index, 1)
    newOrder.splice(index - 1, 0, removed)
    setSettings(prev => ({ ...prev, section_order: newOrder }))
    saveSettings()
  }

  function moveSectionDown(index) {
    if (index === settings.section_order.length - 1) return
    const newOrder = [...settings.section_order]
    const [removed] = newOrder.splice(index, 1)
    newOrder.splice(index + 1, 0, removed)
    setSettings(prev => ({ ...prev, section_order: newOrder }))
    saveSettings()
  }

  function handleEditSection(section) {
    setEditingSection(section)
    // This would open the section editor - for now we redirect to pages
    window.location.href = `/admin/pages?id=${homepage.id}`
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Homepage Builder</h2>
          <p className="mt-1 text-sm text-slate-300">Manage homepage sections and their visibility</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.location.href = `/admin/pages?id=${homepage?.id}`}
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05]"
          >
            <Layers className="w-4 h-4 inline mr-2" />
            Edit Content
          </button>
          <button
            type="button"
            onClick={() => window.open('/', '_blank')}
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05]"
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Preview
          </button>
        </div>
      </div>

      {status && (
        <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-slate-300">
          {status}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Section Visibility */}
        <aside className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-100">Section Visibility</h3>
          <div className="space-y-2">
            {HOMEPAGE_SECTIONS.map(section => {
              const settingKey = `${section.id}_enabled`
              const isEnabled = settings[settingKey] !== false
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => toggleSectionVisibility(section.id)}
                  className={`w-full text-left p-3 rounded-xl transition-colors flex items-center justify-between ${
                    isEnabled 
                      ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30' 
                      : 'border border-white/10 bg-white/[0.02] text-slate-400'
                  }`}
                >
                  <span className="text-sm">
                    <span className="mr-2">{section.icon}</span>
                    {section.label}
                  </span>
                  {isEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              )
            })}
          </div>
        </aside>

        {/* Section Order */}
        <main>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-100">Section Order</h3>
                <p className="mt-1 text-xs text-slate-400">Drag sections to reorder homepage layout</p>
              </div>
              <button
                type="button"
                onClick={() => { setSettings({ ...settings, section_order: HOMEPAGE_SECTIONS.map(s => s.id) }); saveSettings() }}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05] text-sm disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4 inline mr-1" />
                Reset
              </button>
            </div>

            <div className="space-y-2">
              {settings.section_order.map((sectionId, index) => {
                const section = HOMEPAGE_SECTIONS.find(s => s.id === sectionId)
                const settingKey = `${sectionId}_enabled`
                const isEnabled = settings[settingKey] !== false
                
                if (!section) return null
                
                return (
                  <div
                    key={sectionId}
                    className={`p-4 rounded-xl border transition-all ${
                      !isEnabled ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{section.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-slate-100">{section.label}</div>
                        <div className="text-xs text-slate-400">{section.description}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveSectionUp(index)}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] disabled:opacity-30"
                          title="Move Up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSectionDown(index)}
                          disabled={index === settings.section_order.length - 1}
                          className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] disabled:opacity-30"
                          title="Move Down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditSection(section)}
                          className="p-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20"
                          title="Edit Content"
                        >
                          <Unlock className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-base font-semibold text-slate-100 mb-4">Quick Actions</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => window.location.href = `/admin/pages?id=${homepage?.id}`}
                className="p-4 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05] text-left"
              >
                <Layers className="w-5 h-5 mb-2 text-teal-400" />
                <div className="font-medium">Edit Homepage Content</div>
                <div className="text-xs text-slate-400">Edit sections, text, images, and CTAs</div>
              </button>
              
              <button
                type="button"
                onClick={() => window.open('/', '_blank')}
                className="p-4 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05] text-left"
              >
                <Eye className="w-5 h-5 mb-2 text-teal-400" />
                <div className="font-medium">Preview Homepage</div>
                <div className="text-xs text-slate-400">View changes in real-time</div>
              </button>
            </div>
          </div>

          {/* Status Info */}
          <div className="mt-6 p-4 rounded-xl border border-white/10 bg-white/[0.03]">
            <h4 className="text-sm font-semibold text-slate-100 mb-3">Homepage Status</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-slate-200">{homepage?.status || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sections:</span>
                <span className="text-slate-200">{sections.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Visible Sections:</span>
                <span className="text-slate-200">
                  {settings.section_order.filter(id => settings[`${id}_enabled`] !== false).length}
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Surface>
  )
}