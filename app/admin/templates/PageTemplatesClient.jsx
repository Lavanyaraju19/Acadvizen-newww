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
  FileText,
  Home,
  MapPin,
  GraduationCap,
  BookOpen,
  MessageSquare,
  User,
  HelpCircle,
  Shield,
  Layers,
  Copy
} from 'lucide-react'

const TEMPLATE_TYPES = [
  { id: 'homepage', label: 'Homepage', icon: Home },
  { id: 'landing', label: 'Landing Page', icon: Layers },
  { id: 'city', label: 'City Page', icon: MapPin },
  { id: 'course', label: 'Course Page', icon: GraduationCap },
  { id: 'blog', label: 'Blog Post', icon: BookOpen },
  { id: 'contact', label: 'Contact', icon: MessageSquare },
  { id: 'about', label: 'About', icon: User },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
  { id: 'privacy', label: 'Privacy Policy', icon: Shield },
  { id: 'terms', label: 'Terms of Service', icon: FileText },
]

export default function PageTemplatesClient() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_type: 'landing',
    template_data: {},
    is_default: false,
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    setLoading(true)
    try {
      const { supabase } = await import('@supabase/supabase-js')
      const supabaseClient = supabase.createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
      )
      
      const { data } = await supabaseClient
        .from('page_templates')
        .select('*')
        .order('created_at', { ascending: false })
      
      setTemplates(data || [])
    } catch (error) {
      setStatus(error?.message || 'Failed to load templates.')
    } finally {
      setLoading(false)
    }
  }

  async function saveTemplate(event) {
    event.preventDefault()
    if (!formData.name || !formData.template_type) {
      setStatus('Name and template type are required.')
      return
    }

    setSaving(true)
    setStatus('')
    try {
      const { supabase } = await import('@supabase/supabase-js')
      const supabaseClient = supabase.createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
      )
      
      if (editingTemplate) {
        const { error } = await supabaseClient
          .from('page_templates')
          .update(formData)
          .eq('id', editingTemplate.id)
        if (error) throw error
      } else {
        const { error } = await supabaseClient
          .from('page_templates')
          .insert(formData)
        if (error) throw error
      }
      
      setShowModal(false)
      setEditingTemplate(null)
      setFormData({ name: '', description: '', template_type: 'landing', template_data: {}, is_default: false })
      await loadTemplates()
      setStatus('Template saved successfully.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save template.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteTemplate(id) {
    if (!window.confirm('Delete this template?')) return
    setSaving(true)
    setStatus('')
    try {
      const { supabase } = await import('@supabase/supabase-js')
      const supabaseClient = supabase.createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
      )
      
      await supabaseClient.from('page_templates').delete().eq('id', id)
      await loadTemplates()
      setStatus('Template deleted.')
    } catch (error) {
      setStatus(error?.message || 'Failed to delete template.')
    } finally {
      setSaving(false)
    }
  }

  async function duplicateTemplate(template) {
    setSaving(true)
    setStatus('')
    try {
      const { supabase } = await import('@supabase/supabase-js')
      const supabaseClient = supabase.createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
      )
      
      const { error } = await supabaseClient
        .from('page_templates')
        .insert({
          ...template,
          id: undefined,
          name: `${template.name} (Copy)`,
          is_default: false,
          created_at: undefined,
          updated_at: undefined,
        })
      if (error) throw error
      
      await loadTemplates()
      setStatus('Template duplicated.')
    } catch (error) {
      setStatus(error?.message || 'Failed to duplicate template.')
    } finally {
      setSaving(false)
    }
  }

  function openEditModal(template = null) {
    if (template) {
      setEditingTemplate(template)
      setFormData({
        name: template.name,
        description: template.description || '',
        template_type: template.template_type,
        template_data: template.template_data || {},
        is_default: template.is_default || false,
      })
    } else {
      setEditingTemplate(null)
      setFormData({ name: '', description: '', template_type: 'landing', template_data: {}, is_default: false })
    }
    setShowModal(true)
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Page Templates</h2>
          <p className="mt-1 text-sm text-slate-300">Pre-built templates for common page types</p>
        </div>
        <button
          type="button"
          onClick={() => openEditModal()}
          className="px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Create Template
        </button>
      </div>

      {status && (
        <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-slate-300">
          {status}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No templates yet</p>
            <p className="text-sm mt-1 opacity-70">Create your first template to speed up page creation</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {templates.map((template) => {
              const TypeIcon = TEMPLATE_TYPES.find(t => t.id === template.template_type)?.icon || FileText
              return (
                <div key={template.id} className="p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <TypeIcon className="w-4 h-4 text-slate-400" />
                      <h3 className="font-medium text-slate-100">{template.name}</h3>
                      {template.is_default && (
                        <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs">Default</span>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-sm text-slate-400 mt-1">{template.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      <span className="capitalize">{template.template_type}</span>
                      <span>•</span>
                      <span>{new Date(template.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => duplicateTemplate(template)}
                      className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(template)}
                      className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTemplate(template.id)}
                      className="p-2 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="rounded-2xl border border-white/10 bg-[#050b12] p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-100">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={saveTemplate} className="space-y-4">
              <label className="text-xs text-slate-400">
                Template Name
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  required
                />
              </label>

              <label className="text-xs text-slate-400">
                Description
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>

              <label className="text-xs text-slate-400">
                Template Type
                <select
                  value={formData.template_type}
                  onChange={(e) => setFormData({ ...formData, template_type: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                >
                  {TEMPLATE_TYPES.map(type => (
                    <option key={type.id} value={type.id} className="capitalize">{type.label}</option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="rounded border-white/10 bg-white/[0.03]"
                />
                Set as default for this type
              </label>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editingTemplate ? 'Update' : 'Create')}
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