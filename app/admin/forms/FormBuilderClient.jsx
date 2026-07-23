'use client'

import { useState, useEffect } from 'react'
import { Surface } from '../../../src/components/ui/Surface'
import { adminApiFetch } from '../../../lib/adminApiClient'
import RichTextEditor from '../../../components/admin/RichTextEditor'
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  ChevronUp, 
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  Save,
  Play,
  Download
} from 'lucide-react'

const FIELD_TYPES = [
  { type: 'text', label: 'Text Input', icon: 'T' },
  { type: 'email', label: 'Email', icon: '@' },
  { type: 'phone', label: 'Phone', icon: '#' },
  { type: 'number', label: 'Number', icon: '123' },
  { type: 'textarea', label: 'Text Area', icon: '¶' },
  { type: 'select', label: 'Dropdown', icon: '▼' },
  { type: 'checkbox', label: 'Checkbox', icon: '☐' },
  { type: 'radio', label: 'Radio Group', icon: '●' },
  { type: 'date', label: 'Date', icon: '📅' },
  { type: 'file', label: 'File Upload', icon: '📎' },
  { type: 'hidden', label: 'Hidden Field', icon: '🔒' },
  { type: 'html', label: 'Custom HTML', icon: '</>' },
]

function createEmptyField(type = 'text') {
  return {
    id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    label: '',
    placeholder: '',
    required: false,
    options: type === 'select' || type === 'radio' ? [''] : [],
    defaultValue: '',
    validation: {
      minLength: type === 'text' || type === 'textarea' ? 0 : undefined,
      maxLength: type === 'text' || type === 'textarea' ? 500 : undefined,
      pattern: type === 'email' ? '^[^@]+@[^@]+\\.[^@]+$' : undefined,
      min: type === 'number' ? undefined : undefined,
      max: type === 'number' ? undefined : undefined,
    },
    conditional: {
      enabled: false,
      fieldId: '',
      operator: 'equals',
      value: '',
    },
    styling: {
      width: 'full',
      cssClass: '',
    },
  }
}

export default function FormBuilderClient() {
  const [forms, setForms] = useState([])
  const [selectedFormId, setSelectedFormId] = useState('')
  const [formFields, setFormFields] = useState([])
  const [formSettings, setFormSettings] = useState({
    id: '',
    name: '',
    description: '',
    successMessage: 'Thank you for your submission!',
    errorMessage: 'Please fix the errors and try again.',
    redirectUrl: '',
    sendEmail: false,
    emailTo: '',
    emailSubject: '',
    storeSubmissions: true,
    status: 'draft',
  })
  const [draggedFieldId, setDraggedFieldId] = useState('')
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [expandedFields, setExpandedFields] = useState(new Set())

  const selectedForm = forms.find(f => f.id === selectedFormId)

  useEffect(() => {
    loadForms()
  }, [])

  async function loadForms() {
    try {
      const json = await adminApiFetch('/api/cms/forms?include_drafts=1&limit=100', { cache: 'no-store' })
      setForms(Array.isArray(json.data) ? json.data : [])
    } catch (error) {
      setStatus(error?.message || 'Failed to load forms.')
    }
  }

  function selectForm(form) {
    setSelectedFormId(form?.id || '')
    if (form) {
      setFormFields(Array.isArray(form.fields) ? form.fields : [])
      setFormSettings({
        id: form.id || '',
        name: form.name || '',
        description: form.description || '',
        successMessage: form.success_message || 'Thank you for your submission!',
        errorMessage: form.error_message || 'Please fix the errors and try again.',
        redirectUrl: form.redirect_url || '',
        sendEmail: form.send_email || false,
        emailTo: form.email_to || '',
        emailSubject: form.email_subject || '',
        storeSubmissions: form.store_submissions !== false,
        status: form.status || 'draft',
      })
    } else {
      resetForm()
    }
  }

  function resetForm() {
    setFormFields([])
    setFormSettings({
      id: '',
      name: '',
      description: '',
      successMessage: 'Thank you for your submission!',
      errorMessage: 'Please fix the errors and try again.',
      redirectUrl: '',
      sendEmail: false,
      emailTo: '',
      emailSubject: '',
      storeSubmissions: true,
      status: 'draft',
    })
  }

  function addField(type) {
    const newField = createEmptyField(type)
    setFormFields([...formFields, newField])
    setExpandedFields(prev => new Set([...prev, newField.id]))
  }

  function updateField(fieldId, updates) {
    setFormFields(formFields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ))
  }

  function deleteField(fieldId) {
    setFormFields(formFields.filter(field => field.id !== fieldId))
    setExpandedFields(prev => {
      const next = new Set(prev)
      next.delete(fieldId)
      return next
    })
  }

  function duplicateField(fieldId) {
    const field = formFields.find(f => f.id === fieldId)
    if (field) {
      const newField = {
        ...field,
        id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        label: `${field.label} (copy)`,
      }
      const index = formFields.findIndex(f => f.id === fieldId)
      setFormFields([
        ...formFields.slice(0, index + 1),
        newField,
        ...formFields.slice(index + 1)
      ])
      setExpandedFields(prev => new Set([...prev, newField.id]))
    }
  }

  function moveField(fieldId, direction) {
    const index = formFields.findIndex(f => f.id === fieldId)
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= formFields.length) return

    const newFields = [...formFields]
    const [removed] = newFields.splice(index, 1)
    newFields.splice(newIndex, 0, removed)
    setFormFields(newFields)
  }

  function toggleFieldExpanded(fieldId) {
    setExpandedFields(prev => {
      const next = new Set(prev)
      if (next.has(fieldId)) {
        next.delete(fieldId)
      } else {
        next.add(fieldId)
      }
      return next
    })
  }

  async function saveForm() {
    if (!formSettings.name.trim()) {
      setStatus('Form name is required.')
      return
    }

    setSaving(true)
    setStatus('')
    try {
      const payload = {
        ...formSettings,
        fields: formFields,
      }
      
      const method = formSettings.id ? 'PUT' : 'POST'
      const endpoint = formSettings.id ? `/api/cms/forms/${formSettings.id}` : '/api/cms/forms'
      
      await adminApiFetch(endpoint, { method, body: payload })
      await loadForms()
      setStatus('Form saved successfully.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save form.')
    } finally {
      setSaving(false)
    }
  }

  async function exportSubmissions() {
    if (!selectedFormId) return
    
    try {
      const json = await adminApiFetch(`/api/cms/forms/${selectedFormId}/submissions?format=csv`, { cache: 'no-store' })
      
      // Create blob and download
      const blob = new Blob([json.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${formSettings.name || 'form'}-submissions.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setStatus('Submissions exported.')
    } catch (error) {
      setStatus(error?.message || 'Failed to export submissions.')
    }
  }

  function FieldEditor({ field, index }) {
    const isExpanded = expandedFields.has(field.id)
    
    return (
      <div className="border border-white/10 rounded-xl bg-white/[0.02] overflow-hidden">
        <div className="flex items-center gap-2 p-3 bg-white/[0.03]">
          <button
            type="button"
            className="cursor-grab text-slate-400 hover:text-slate-200"
            draggable
            onDragStart={() => setDraggedFieldId(field.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (draggedFieldId && draggedFieldId !== field.id) {
                const fromIndex = formFields.findIndex(f => f.id === draggedFieldId)
                const toIndex = index
                const newFields = [...formFields]
                const [removed] = newFields.splice(fromIndex, 1)
                newFields.splice(toIndex, 0, removed)
                setFormFields(newFields)
                setDraggedFieldId('')
              }
            }}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          
          <span className="text-xs font-medium text-slate-300">
            {FIELD_TYPES.find(t => t.type === field.type)?.label || field.type}
          </span>
          
          <input
            type="text"
            value={field.label}
            onChange={(e) => updateField(field.id, { label: e.target.value })}
            placeholder="Field label"
            className="flex-1 px-2 py-1 text-sm rounded border border-white/10 bg-white/[0.03] text-slate-100 focus:outline-none focus:border-teal-500/50"
          />
          
          <button
            type="button"
            onClick={() => toggleFieldExpanded(field.id)}
            className="p-1 text-slate-400 hover:text-slate-200"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          <button
            type="button"
            onClick={() => duplicateField(field.id)}
            className="p-1 text-slate-400 hover:text-slate-200"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={() => moveField(field.id, -1)}
            disabled={index === 0}
            className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={() => moveField(field.id, 1)}
            disabled={index === formFields.length - 1}
            className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={() => deleteField(field.id)}
            className="p-1 text-red-400 hover:text-red-300"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        
        {isExpanded && (
          <div className="p-4 space-y-4 border-t border-white/10">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-xs text-slate-400">
                Placeholder
                <input
                  type="text"
                  value={field.placeholder}
                  onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => updateField(field.id, { required: e.target.checked })}
                  className="rounded border-white/10 bg-white/[0.03]"
                />
                Required field
              </label>
            </div>
            
            {(field.type === 'select' || field.type === 'radio') && (
              <label className="text-xs text-slate-400">
                Options (one per line)
                <textarea
                  value={field.options.join('\n')}
                  onChange={(e) => updateField(field.id, { options: e.target.value.split('\n').filter(Boolean) })}
                  rows={4}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
            )}
            
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-xs text-slate-400">
                Default Value
                <input
                  type="text"
                  value={field.defaultValue}
                  onChange={(e) => updateField(field.id, { defaultValue: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                CSS Class
                <input
                  type="text"
                  value={field.styling.cssClass}
                  onChange={(e) => updateField(field.id, { styling: { ...field.styling, cssClass: e.target.value } })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
            </div>
            
            {field.validation && (
              <div className="p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                <h4 className="text-xs font-semibold text-slate-300 mb-3">Validation Rules</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {(field.type === 'text' || field.type === 'textarea') && (
                    <>
                      <label className="text-xs text-slate-400">
                        Min Length
                        <input
                          type="number"
                          value={field.validation.minLength || ''}
                          onChange={(e) => updateField(field.id, { validation: { ...field.validation, minLength: parseInt(e.target.value) || 0 } })}
                          className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                        />
                      </label>
                      <label className="text-xs text-slate-400">
                        Max Length
                        <input
                          type="number"
                          value={field.validation.maxLength || ''}
                          onChange={(e) => updateField(field.id, { validation: { ...field.validation, maxLength: parseInt(e.target.value) || 500 } })}
                          className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                        />
                      </label>
                    </>
                  )}
                  
                  {field.type === 'number' && (
                    <>
                      <label className="text-xs text-slate-400">
                        Min Value
                        <input
                          type="number"
                          value={field.validation.min || ''}
                          onChange={(e) => updateField(field.id, { validation: { ...field.validation, min: parseFloat(e.target.value) } })}
                          className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                        />
                      </label>
                      <label className="text-xs text-slate-400">
                        Max Value
                        <input
                          type="number"
                          value={field.validation.max || ''}
                          onChange={(e) => updateField(field.id, { validation: { ...field.validation, max: parseFloat(e.target.value) } })}
                          className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                        />
                      </label>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Form Builder</h2>
          <p className="mt-1 text-sm text-slate-300">Create custom forms with drag-and-drop fields</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { resetForm(); setSelectedFormId(''); }}
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05]"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            New Form
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Forms List */}
        <aside className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-100">Your Forms</h3>
          <div className="space-y-2">
            {forms.map(form => (
              <button
                key={form.id}
                type="button"
                onClick={() => selectForm(form)}
                className={`w-full text-left p-3 rounded-xl transition-colors ${
                  selectedFormId === form.id 
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' 
                    : 'border border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.05]'
                }`}
              >
                <div className="font-medium">{form.name || 'Untitled Form'}</div>
                <div className="text-xs opacity-70 mt-1">
                  {form.fields?.length || 0} fields • {form.status || 'draft'}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Form Editor */}
        <main className="space-y-6">
          {/* Form Settings */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-base font-semibold text-slate-100 mb-4">Form Settings</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-xs text-slate-400 md:col-span-2">
                Form Name
                <input
                  type="text"
                  value={formSettings.name}
                  onChange={(e) => setFormSettings({ ...formSettings, name: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400 md:col-span-2">
                Description
                <textarea
                  value={formSettings.description}
                  onChange={(e) => setFormSettings({ ...formSettings, description: e.target.value })}
                  rows={2}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Success Message
                <input
                  type="text"
                  value={formSettings.successMessage}
                  onChange={(e) => setFormSettings({ ...formSettings, successMessage: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Redirect URL (optional)
                <input
                  type="url"
                  value={formSettings.redirectUrl}
                  onChange={(e) => setFormSettings({ ...formSettings, redirectUrl: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formSettings.sendEmail}
                  onChange={(e) => setFormSettings({ ...formSettings, sendEmail: e.target.checked })}
                  className="rounded border-white/10 bg-white/[0.03]"
                />
                Send email notifications
              </label>
              
              <label className="text-xs text-slate-400 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formSettings.storeSubmissions}
                  onChange={(e) => setFormSettings({ ...formSettings, storeSubmissions: e.target.checked })}
                  className="rounded border-white/10 bg-white/[0.03]"
                />
                Store submissions
              </label>
            </div>
            
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={saveForm}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 disabled:opacity-50"
              >
                <Save className="w-4 h-4 inline mr-2" />
                {saving ? 'Saving...' : 'Save Form'}
              </button>
              
              {selectedFormId && (
                <button
                  type="button"
                  onClick={exportSubmissions}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05]"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Export CSV
                </button>
              )}
              
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05]"
              >
                <Play className="w-4 h-4 inline mr-2" />
                {previewMode ? 'Edit' : 'Preview'}
              </button>
            </div>
          </div>

          {!previewMode ? (
            <>
              {/* Field Types */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="text-base font-semibold text-slate-100 mb-4">Add Field</h3>
                <div className="flex flex-wrap gap-2">
                  {FIELD_TYPES.map(fieldType => (
                    <button
                      key={fieldType.type}
                      type="button"
                      onClick={() => addField(fieldType.type)}
                      className="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.05] text-sm"
                    >
                      <span className="mr-1">{fieldType.icon}</span>
                      {fieldType.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-100">Form Fields</h3>
                {formFields.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center text-slate-400">
                    No fields yet. Add your first field above.
                  </div>
                ) : (
                  formFields.map((field, index) => (
                    <FieldEditor key={field.id} field={field} index={index} />
                  ))
                )}
              </div>
            </>
          ) : (
            /* Preview Mode */
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
              <h3 className="text-xl font-semibold text-slate-100 mb-2">{formSettings.name || 'Form Preview'}</h3>
              {formSettings.description && (
                <p className="text-slate-300 mb-6">{formSettings.description}</p>
              )}
              
              <form className="space-y-4">
                {formFields.map(field => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-slate-200 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    
                    {field.type === 'textarea' ? (
                      <textarea
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                        rows={4}
                      />
                    ) : field.type === 'select' ? (
                      <select className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-slate-100">
                        <option value="">Select...</option>
                        {field.options.map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'checkbox' ? (
                      <input type="checkbox" className="rounded border-white/10 bg-white/[0.03]" />
                    ) : (
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      />
                    )}
                  </div>
                ))}
                
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30"
                >
                  Submit
                </button>
              </form>
            </div>
          )}

          {status && (
            <div className="text-sm text-slate-300">{status}</div>
          )}
        </main>
      </div>
    </Surface>
  )
}