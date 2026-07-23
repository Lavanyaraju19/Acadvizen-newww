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
  Layers,
  Copy,
  Folder
} from 'lucide-react'

const CATEGORIES = ['hero', 'cta', 'testimonials', 'faq', 'gallery', 'contact', 'pricing', 'features', 'general']

export default function ReusableSectionsClient() {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    section_type: 'hero',
    category: 'general',
    section_data: {},
  })

  useEffect(() => {
    loadSections()
  }, [])

  async function loadSections() {
    setLoading(true)
    try {
      const { supabase } = await import('@supabase/supabase-js')
      const supabaseClient = supabase.createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
      )
      
      const { data } = await supabaseClient
        .from('reusable_sections')
        .select('*')
        .order('created_at', { ascending: false })
      
      setSections(data || [])
    } catch (error) {
      setStatus(error?.message || 'Failed to load sections.')
    } finally {
      setLoading(false)
    }
  }

  async function saveSection(event) {
    event.preventDefault()
    if (!formData.name || !formData.section_type) {
      setStatus('Name and section type are required.')
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
      
      if (editingSection) {
        const { error } = await supabaseClient
          .from('reusable_sections')
          .update(formData)
          .eq('id', editingSection.id)
        if (error) throw error
      } else {
        const { error } = await supabaseClient
          .from('reusable_sections')
          .insert(formData)
        if (error) throw error
      }
      
      setShowModal(false)
      setEditingSection(null)
      setFormData({ name: '', description: '', section_type: 'hero', category: 'general', section_data: {} })
      await loadSections()
      setStatus('Section saved successfully.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save section.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteSection(id) {
    if (!window.confirm('Delete this reusable section?')) return
    setSaving(true)
    setStatus('')
    try {
      const { supabase } = await import('@supabase/supabase-js')
      const supabaseClient = supabase.createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
      )
      
      await supabaseClient.from('reusable_sections').delete().eq('id', id)
      await loadSections()
      setStatus('Section deleted.')
    } catch (error) {
      setStatus(error?.message || 'Failed to delete section.')
    } finally {
      setSaving(false)
    }
  }

  async function duplicateSection(section) {
    setSaving(true)
    setStatus('')
    try {
      const { supabase } = await import('@supabase/supabase-js')
      const supabaseClient = supabase.createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
      )
      
      const { error } = await supabaseClient
        .from('reusable_sections')
        .insert({
          ...section,
          id: undefined,
          name: `${section.name} (Copy)`,
          created_at: undefined,
          updated_at: undefined,
        })
      if (error) throw error
      
      await loadSections()
      setStatus('Section duplicated.')
    } catch (error) {
      setStatus(error?.message || 'Failed to duplicate section.')
    } finally {
      setSaving(false)
    }
  }

  function openEditModal(section = null) {
    if (section) {
      setEditingSection(section)
      setFormData({
        name: section.name,
        description: section.description || '',
        section_type: section.section_type,
        category: section.category || 'general',
        section_data: section.section_data || {},
      })
    } else {
      setEditingSection(null)
      setFormData({ name: '', description: '', section_type: 'hero', category: 'general', section_data: {} })
    }
    setShowModal(true)
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Reusable Sections</h2>
          <p className="mt-1 text-sm text-slate-300">Save and reuse sections across multiple pages</p>
        </div>
        <button
          type="button"
          onClick={() => openEditModal()}
          className="px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Create Section
        </button>
      </div>

      {status && (
        <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-slate-300">
          {status}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading sections...</div>
        ) : sections.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No reusable sections yet</p>
            <p className="text-sm mt-1 opacity-70">Create your first reusable section to use across pages</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {sections.map((section) => (
              <div key={section.id} className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs capitalize">
                      {section.category}
                    </span>
                    <h3 className="font-medium text-slate-100">{section.name}</h3>
                  </div>
                  {section.description && (
                    <p className="text-sm text-slate-400 mt-1">{section.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                    <span className="capitalize">{section.section_type}</span>
                    <span>•</span>
                    <span>{new Date(section.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => duplicateSection(section)}
                    className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(section)}
                    className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSection(section.id)}
                    className="p-2 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="rounded-2xl border border-white/10 bg-[#050b12] p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-100">
                {editingSection ? 'Edit Section' : 'Create Section'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={saveSection} className="space-y-4">
              <label className="text-xs text-slate-400">
                Section Name
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
                Section Type
                <select
                  value={formData.section_type}
                  onChange={(e) => setFormData({ ...formData, section_type: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                >
                  <option value="hero">Hero</option>
                  <option value="cta">CTA</option>
                  <option value="testimonials">Testimonials</option>
                  <option value="faq">FAQ</option>
                  <option value="gallery">Gallery</option>
                  <option value="contact">Contact</option>
                  <option value="pricing">Pricing</option>
                  <option value="features">Features</option>
                </select>
              </label>

              <label className="text-xs text-slate-400">
                Category
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="capitalize">{cat}</option>
                  ))}
                </select>
              </label>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editingSection ? 'Update' : 'Create')}
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