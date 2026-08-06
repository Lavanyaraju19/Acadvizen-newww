'use client'

import { useEffect, useState } from 'react'
import { Surface } from '../../../src/components/ui/Surface'
import { adminApiFetch } from '../../../lib/adminApiClient'
import { renderDynamicSections } from '../../../components/sections/DynamicSectionRenderer'
import {
  Plus,
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
  Copy,
  Search,
  Eye,
  Sparkles,
  History,
  RotateCcw,
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

const EMPTY_FORM = { name: '', description: '', template_type: 'landing', parent_template_id: '', is_default: false }

export default function PageTemplatesClient() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)

  const [previewTemplate, setPreviewTemplate] = useState(null)
  const [previewData, setPreviewData] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const [applyTemplate, setApplyTemplate] = useState(null)
  const [applyTitle, setApplyTitle] = useState('')
  const [applying, setApplying] = useState(false)

  const [versionsTemplate, setVersionsTemplate] = useState(null)
  const [versions, setVersions] = useState([])
  const [versionsLoading, setVersionsLoading] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [search, category])

  async function loadTemplates() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('search', search.trim())
      if (category) params.set('category', category)
      const json = await adminApiFetch(`/api/cms/templates${params.toString() ? `?${params}` : ''}`, { cache: 'no-store' })
      setTemplates(Array.isArray(json.data) ? json.data : [])
    } catch (error) {
      setStatus(error?.message || 'Failed to load templates.')
    } finally {
      setLoading(false)
    }
  }

  async function saveTemplate(event) {
    event.preventDefault()
    if (!formData.name.trim()) {
      setStatus('Template name is required.')
      return
    }
    setSaving(true)
    setStatus('')
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description,
        template_type: formData.template_type,
        parent_template_id: formData.parent_template_id || null,
        is_default: formData.is_default,
      }
      if (editingTemplate) {
        await adminApiFetch(`/api/cms/templates/${editingTemplate.id}`, { method: 'PATCH', body: payload })
      } else {
        await adminApiFetch('/api/cms/templates', { method: 'POST', body: payload })
      }
      setShowModal(false)
      setEditingTemplate(null)
      setFormData(EMPTY_FORM)
      await loadTemplates()
      setStatus('Template saved.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save template.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteTemplate(id) {
    if (!window.confirm('Delete this template? Pages already created from it are unaffected.')) return
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/templates/${id}`, { method: 'DELETE' })
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
      await adminApiFetch('/api/cms/templates', {
        method: 'POST',
        body: {
          name: `${template.name} (Copy)`,
          description: template.description,
          template_type: template.template_type,
          parent_template_id: template.parent_template_id || null,
          template_data: template.template_data || {},
        },
      })
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
        parent_template_id: template.parent_template_id || '',
        is_default: template.is_default || false,
      })
    } else {
      setEditingTemplate(null)
      setFormData(EMPTY_FORM)
    }
    setShowModal(true)
  }

  async function openPreview(template) {
    setPreviewTemplate(template)
    setPreviewData(null)
    setPreviewLoading(true)
    try {
      const json = await adminApiFetch(`/api/cms/templates/${template.id}/resolved`, { cache: 'no-store' })
      setPreviewData(json.data)
    } catch (error) {
      setPreviewData({ error: error?.message || 'Failed to load preview.' })
    } finally {
      setPreviewLoading(false)
    }
  }

  function openApply(template) {
    setApplyTemplate(template)
    setApplyTitle(template.name)
  }

  async function submitApply() {
    if (!applyTemplate || !applyTitle.trim()) return
    setApplying(true)
    setStatus('')
    try {
      const json = await adminApiFetch(`/api/cms/templates/${applyTemplate.id}/apply`, {
        method: 'POST',
        body: { title: applyTitle.trim() },
      })
      setApplyTemplate(null)
      if (json?.data?.id) {
        window.location.href = `/admin/pages?page=${json.data.id}`
      }
    } catch (error) {
      setStatus(error?.message || 'Failed to apply template.')
      setApplying(false)
    }
  }

  async function openVersions(template) {
    setVersionsTemplate(template)
    setVersions([])
    setVersionsLoading(true)
    try {
      const json = await adminApiFetch(`/api/cms/templates/${template.id}/versions`, { cache: 'no-store' })
      setVersions(Array.isArray(json.data) ? json.data : [])
    } catch (error) {
      setStatus(error?.message || 'Failed to load version history.')
    } finally {
      setVersionsLoading(false)
    }
  }

  async function restoreVersion(versionId) {
    if (!versionsTemplate) return
    if (!window.confirm('Restore this version? This becomes the template\'s current content as a new version.')) return
    setSaving(true)
    try {
      await adminApiFetch(`/api/cms/templates/${versionsTemplate.id}/versions/${versionId}/restore`, { method: 'POST' })
      setVersionsTemplate(null)
      await loadTemplates()
      setStatus('Template restored to selected version.')
    } catch (error) {
      setStatus(error?.message || 'Failed to restore version.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Page Templates</h2>
          <p className="mt-1 text-sm text-slate-300">Reusable page starting points - build a page, then &quot;Save as Template&quot; from the Page Builder</p>
        </div>
        <button
          type="button"
          onClick={() => openEditModal()}
          className="px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          New Template
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
          />
        </div>
        <select
          aria-label="Filter by category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
        >
          <option value="">All Categories</option>
          {TEMPLATE_TYPES.map((type) => (
            <option key={type.id} value={type.id}>{type.label}</option>
          ))}
        </select>
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
            <p className="font-medium">No templates {search || category ? 'match your filters' : 'yet'}</p>
            <p className="text-sm mt-1 opacity-70">
              {search || category ? 'Try a different search or category.' : 'Build a page in the Page Builder, then use "Save as Template" to create your first one.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {templates.map((template) => {
              const TypeIcon = TEMPLATE_TYPES.find((t) => t.id === template.template_type)?.icon || FileText
              const parent = templates.find((t) => t.id === template.parent_template_id)
              return (
                <div key={template.id} className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <TypeIcon className="w-4 h-4 text-slate-400" />
                      <h3 className="font-medium text-slate-100">{template.name}</h3>
                      {template.is_default && (
                        <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs">Default</span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-400 text-xs">v{template.version || 1}</span>
                      {parent && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-xs">Extends {parent.name}</span>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-sm text-slate-400 mt-1">{template.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      <span className="capitalize">{template.template_type}</span>
                      <span>•</span>
                      <span>{Array.isArray(template.template_data?.sections) ? template.template_data.sections.length : 0} sections</span>
                      <span>•</span>
                      <span>Updated {new Date(template.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button type="button" onClick={() => openApply(template)} className="p-2 rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20" title="Apply to New Page">
                      <Sparkles className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => openPreview(template)} className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]" title="Preview">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => openVersions(template)} className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]" title="Version History">
                      <History className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => duplicateTemplate(template)} className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]" title="Duplicate">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => openEditModal(template)} className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => deleteTemplate(template.id)} className="p-2 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20" title="Delete">
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
              <h3 className="text-lg font-semibold text-slate-100">{editingTemplate ? 'Edit Template' : 'Create Template'}</h3>
              <button type="button" onClick={() => setShowModal(false)} className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200">
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
                Category
                <select
                  value={formData.template_type}
                  onChange={(e) => setFormData({ ...formData, template_type: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                >
                  {TEMPLATE_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-slate-400">
                Extends (inherits sections from)
                <select
                  value={formData.parent_template_id}
                  onChange={(e) => setFormData({ ...formData, parent_template_id: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                >
                  <option value="">None (standalone)</option>
                  {templates.filter((t) => t.id !== editingTemplate?.id).map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">If this template has no sections of its own yet, it inherits the parent&apos;s.</p>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="rounded border-white/10 bg-white/[0.03]"
                />
                Set as default for this category
              </label>

              <div className="flex gap-2 pt-4">
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 disabled:opacity-50">
                  {saving ? 'Saving...' : (editingTemplate ? 'Update' : 'Create')}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/[0.05]">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="rounded-2xl border border-white/10 bg-[#050b12] p-6 max-w-4xl w-full max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">Preview - {previewTemplate.name}</h3>
                {previewData?.chain?.length > 1 && (
                  <p className="text-xs text-slate-500 mt-1">Inheritance chain: {previewData.chain.map((t) => t.name).join(' -> ')}</p>
                )}
              </div>
              <button type="button" onClick={() => setPreviewTemplate(null)} className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            {previewLoading ? (
              <div className="p-8 text-center text-slate-400">Loading preview...</div>
            ) : previewData?.error ? (
              <div className="p-8 text-center text-rose-400">{previewData.error}</div>
            ) : !previewData?.data?.sections?.length ? (
              <div className="p-8 text-center text-slate-400">This template has no sections yet.</div>
            ) : (
              <div className="rounded-xl border border-white/10 overflow-hidden bg-white">
                {renderDynamicSections(previewData.data.sections)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {applyTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="rounded-2xl border border-white/10 bg-[#050b12] p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-100">Apply &quot;{applyTemplate.name}&quot;</h3>
              <button type="button" onClick={() => setApplyTemplate(null)} className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-400 mb-4">Creates a new draft page pre-filled with this template&apos;s sections. You&apos;ll land in the Page Builder to finish it.</p>
            <label className="text-xs text-slate-400">
              New Page Title
              <input
                type="text"
                value={applyTitle}
                onChange={(e) => setApplyTitle(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                autoFocus
              />
            </label>
            <div className="flex gap-2 pt-4">
              <button type="button" onClick={submitApply} disabled={applying || !applyTitle.trim()} className="flex-1 px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 disabled:opacity-50">
                {applying ? 'Creating page...' : 'Create Page'}
              </button>
              <button type="button" onClick={() => setApplyTemplate(null)} className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/[0.05]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {versionsTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="rounded-2xl border border-white/10 bg-[#050b12] p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-100">Version History - {versionsTemplate.name}</h3>
              <button type="button" onClick={() => setVersionsTemplate(null)} className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            {versionsLoading ? (
              <div className="p-8 text-center text-slate-400">Loading versions...</div>
            ) : versions.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No saved versions yet.</div>
            ) : (
              <div className="space-y-2">
                {versions.map((version) => (
                  <div key={version.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div>
                      <p className="text-sm text-slate-200">Version {version.version_number}</p>
                      <p className="text-xs text-slate-500">{new Date(version.created_at).toLocaleString()}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => restoreVersion(version.id)}
                      disabled={saving}
                      className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/[0.05] text-xs flex items-center gap-1 disabled:opacity-50"
                    >
                      <RotateCcw className="w-3 h-3" /> Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Surface>
  )
}
