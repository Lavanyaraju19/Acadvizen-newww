'use client'

import { useState, useEffect } from 'react'
import { Surface } from '../../../src/components/ui/Surface'
import { adminApiFetch } from '../../../lib/adminApiClient'
import { 
  Download, 
  Upload, 
  FileText, 
  MapPin, 
  BookOpen, 
  GraduationCap, 
  Inbox, 
  Users, 
  Settings as SettingsIcon,
  FileSpreadsheet,
  Code,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'

const EXPORT_TYPES = [
  { id: 'pages', label: 'Pages', icon: FileText },
  { id: 'cities', label: 'City Pages', icon: MapPin },
  { id: 'blogs', label: 'Blogs', icon: BookOpen },
  { id: 'courses', label: 'Courses', icon: GraduationCap },
  { id: 'forms', label: 'Forms', icon: FileText },
  { id: 'menus', label: 'Menus', icon: FileText },
  { id: 'leads', label: 'Leads', icon: Inbox },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

const FORMATS = [
  { id: 'csv', label: 'CSV', icon: FileSpreadsheet },
  { id: 'json', label: 'JSON', icon: Code },
]

export default function ImportExportClient() {
  const [selectedType, setSelectedType] = useState('pages')
  const [selectedFormat, setSelectedFormat] = useState('json')
  const [mode, setMode] = useState('export')
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [importResults, setImportResults] = useState(null)
  const [status, setStatus] = useState('')

  async function handleExport() {
    setLoading(true)
    setStatus('')
    try {
      const response = await fetch(`/api/cms/import-export/export?type=${selectedType}&format=${selectedFormat}`)
      if (!response.ok) throw new Error('Export failed')
      
      const data = await response.json()
      
      if (selectedFormat === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        downloadBlob(blob, `${selectedType}.json`)
      } else {
        const blob = new Blob([data.csv], { type: 'text/csv' })
        downloadBlob(blob, `${selectedType}.csv`)
      }
      
      setStatus(`${data.count} ${selectedType} exported successfully.`)
    } catch (error) {
      setStatus(error?.message || 'Export failed.')
    } finally {
      setLoading(false)
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    setStatus('')
    setPreviewData(null)
    setImportResults(null)

    try {
      const text = await file.text()
      let data

      if (selectedFormat === 'json') {
        data = JSON.parse(text)
      } else {
        // CSV parsing
        const lines = text.split('\n')
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
        data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
          const obj = {}
          headers.forEach((h, i) => obj[h] = values[i])
          return obj
        }).filter(obj => Object.values(obj).some(v => v))
      }

      setPreviewData(data)
      setStatus(`Preview: ${data.length} items ready to import`)
    } catch (error) {
      setStatus(error?.message || 'Failed to parse file')
      setImporting(false)
    }
  }

  async function confirmImport() {
    if (!previewData) return

    setImporting(true)
    setStatus('Importing...')
    try {
      const response = await fetch('/api/cms/import-export/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          format: selectedFormat,
          data: previewData,
        }),
      })

      const result = await response.json()
      
      if (!response.ok) throw new Error(result.error || 'Import failed')
      
      setImportResults(result)
      setStatus(`Import complete: ${result.success} succeeded, ${result.failed} failed`)
      setPreviewData(null)
    } catch (error) {
      setStatus(error?.message || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Import / Export</h2>
          <p className="mt-1 text-sm text-slate-300">Bulk import and export content for your website</p>
        </div>
      </div>

      {status && (
        <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-slate-300">
          {status}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Type Selection */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-base font-semibold text-slate-100 mb-4">Content Type</h3>
          <div className="space-y-2">
            {EXPORT_TYPES.map(type => {
              const Icon = type.icon
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${
                    selectedType === type.id 
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' 
                      : 'border border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{type.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Format Selection */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-base font-semibold text-slate-100 mb-4">Format</h3>
          <div className="space-y-2">
            {FORMATS.map(format => {
              const Icon = format.icon
              return (
                <button
                  key={format.id}
                  type="button"
                  onClick={() => setSelectedFormat(format.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${
                    selectedFormat === format.id 
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' 
                      : 'border border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{format.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Mode Selection */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-base font-semibold text-slate-100 mb-4">Mode</h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => { setMode('export'); setPreviewData(null); setImportResults(null); }}
              className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${
                mode === 'export' 
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' 
                  : 'border border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.05]'
              }`}
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Export</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('import'); setPreviewData(null); setImportResults(null); }}
              className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${
                mode === 'import' 
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' 
                  : 'border border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.05]'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm">Import</span>
            </button>
          </div>
        </div>
      </div>

      {/* Export Section */}
      {mode === 'export' && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-base font-semibold text-slate-100 mb-4">Export {EXPORT_TYPES.find(t => t.id === selectedType)?.label}</h3>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleExport}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 inline mr-2 animate-spin" /> : <Download className="w-4 h-4 inline mr-2" />}
              {loading ? 'Exporting...' : 'Export Now'}
            </button>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-white/[0.02]">
            <p className="text-xs text-slate-400">
              This will export all {EXPORT_TYPES.find(t => t.id === selectedType)?.label.toLowerCase()} as {selectedFormat.toUpperCase()}.
            </p>
          </div>
        </div>
      )}

      {/* Import Section */}
      {mode === 'import' && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-base font-semibold text-slate-100 mb-4">Import {EXPORT_TYPES.find(t => t.id === selectedType)?.label}</h3>
          
          {!previewData ? (
            <div>
              <label className="block">
                <span className="px-6 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05] cursor-pointer inline-block">
                  <Upload className="w-4 h-4 inline mr-2" />
                  Select File ({selectedFormat.toUpperCase()})
                </span>
                <input
                  type="file"
                  accept={selectedFormat === 'json' ? '.json' : '.csv'}
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <div className="mt-4 p-3 rounded-lg bg-white/[0.02]">
                <p className="text-xs text-slate-400">
                  Select a {selectedFormat.toUpperCase()} file to import. Data will be validated before import.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4 p-4 rounded-lg bg-white/[0.02]">
                <p className="text-sm text-slate-300 mb-2">
                  <CheckCircle className="w-4 h-4 inline mr-2 text-green-400" />
                  Ready to import {previewData.length} items
                </p>
                <pre className="text-xs text-slate-400 overflow-x-auto max-h-40">
                  {JSON.stringify(previewData.slice(0, 3), null, 2)}
                  {previewData.length > 3 && '\n...'}
                </pre>
              </div>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={confirmImport}
                  disabled={importing}
                  className="px-6 py-3 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 disabled:opacity-50"
                >
                  {importing ? <Loader2 className="w-4 h-4 inline mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 inline mr-2" />}
                  {importing ? 'Importing...' : 'Confirm Import'}
                </button>
                <button
                  type="button"
                  onClick={() => { setPreviewData(null); setStatus('') }}
                  className="px-6 py-3 rounded-xl border border-white/10 text-slate-300 hover:bg-white/[0.05]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Import Results */}
          {importResults && (
            <div className="mt-4 p-4 rounded-lg bg-white/[0.02]">
              <h4 className="text-sm font-semibold text-slate-100 mb-2">Import Results</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  {importResults.success} succeeded
                </div>
                {importResults.failed > 0 && (
                  <div className="flex items-center gap-2 text-sm text-rose-400">
                    <XCircle className="w-4 h-4" />
                    {importResults.failed} failed
                  </div>
                )}
                {importResults.errors && importResults.errors.length > 0 && (
                  <div className="mt-2 text-xs text-slate-400">
                    <p className="font-medium mb-1">Errors:</p>
                    <ul className="list-disc list-inside">
                      {importResults.errors.slice(0, 5).map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                      {importResults.errors.length > 5 && <li>...and {importResults.errors.length - 5} more</li>}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Surface>
  )
}