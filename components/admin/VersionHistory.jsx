'use client'

import { useState, useEffect } from 'react'
import { History, Restore, Eye, X, ChevronDown, ChevronUp, Clock, User, Compare } from 'lucide-react'
import { adminApiFetch } from '../../lib/adminApiClient'

export default function VersionHistory({ entityType, entityId, onRestore }) {
  const [isOpen, setIsOpen] = useState(false)
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedVersions, setSelectedVersions] = useState([])
  const [comparing, setComparing] = useState(false)
  const [error, setError] = useState('')

  async function loadVersions() {
    setLoading(true)
    setError('')
    try {
      const endpoint = entityType === 'page' 
        ? `/api/cms/pages/${entityId}/versions`
        : `/api/cms/blogs/${entityId}/versions`
      
      const json = await adminApiFetch(endpoint, { cache: 'no-store' })
      setVersions(Array.isArray(json.data) ? json.data : [])
    } catch (err) {
      setError(err?.message || 'Failed to load versions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && entityId) {
      loadVersions()
    }
  }, [isOpen, entityId, entityType])

  async function handleRestore(versionId) {
    if (!window.confirm('Restore this version? Current changes will be replaced.')) return
    
    setLoading(true)
    try {
      const endpoint = entityType === 'page'
        ? `/api/cms/pages/${entityId}/versions/${versionId}/restore`
        : `/api/cms/blogs/${entityId}/versions/${versionId}/restore`
      
      await adminApiFetch(endpoint, { method: 'POST' })
      setIsOpen(false)
      if (onRestore) onRestore()
    } catch (err) {
      setError(err?.message || 'Failed to restore version')
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  function formatRelativeTime(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  function toggleVersionSelection(versionId) {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId)
      }
      if (prev.length >= 2) {
        return prev
      }
      return [...prev, versionId]
    })
  }

  function getDiffObject(json1, json2) {
    const diff = {}
    const allKeys = new Set([...Object.keys(json1 || {}), ...Object.keys(json2 || {})])
    
    allKeys.forEach(key => {
      const val1 = json1?.[key]
      const val2 = json2?.[key]
      
      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        diff[key] = { old: val1, new: val2 }
      }
    })
    
    return diff
  }

  const compareVersions = selectedVersions.length === 2 ? versions.filter(v => selectedVersions.includes(v.id)) : []

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.05] hover:text-slate-200 transition-colors"
      >
        <History className="w-4 h-4" />
        <span className="text-sm">History</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="rounded-2xl border border-white/10 bg-[#050b12] p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">Version History</h3>
                <p className="text-sm text-slate-400 mt-1">View, compare, and restore previous versions</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
                {error}
              </div>
            )}

            {loading ? (
              <div className="p-8 text-center text-slate-400">
                <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-3" />
                <p>Loading versions...</p>
              </div>
            ) : versions.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No versions found</p>
                <p className="text-sm mt-1 opacity-70">Save this content to create the first version</p>
              </div>
            ) : (
              <>
                {!comparing ? (
                  /* Version List */
                  <div className="space-y-2">
                    {versions.map((version, index) => (
                      <div
                        key={version.id}
                        className={`p-4 rounded-xl border transition-all ${
                          selectedVersions.includes(version.id)
                            ? 'border-teal-500/50 bg-teal-500/10'
                            : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold">
                                Version {version.version_number}
                              </span>
                              {index === 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs">
                                  Current
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded-full text-xs ${
                                version.status === 'published' 
                                  ? 'bg-green-500/20 text-green-300' 
                                  : 'bg-slate-500/20 text-slate-300'
                              }`}>
                                {version.status}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatDate(version.created_at)}</span>
                                <span className="opacity-70">({formatRelativeTime(version.created_at)})</span>
                              </div>
                              {version.change_summary && (
                                <div className="text-slate-300">
                                  {version.change_summary}
                                </div>
                              )}
                            </div>

                            {version.notes && (
                              <p className="text-sm text-slate-400 mt-2">{version.notes}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleVersionSelection(version.id)}
                              disabled={selectedVersions.length >= 2 && !selectedVersions.includes(version.id)}
                              className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] disabled:opacity-30"
                              title="Select to compare"
                            >
                              <Compare className="w-4 h-4" />
                            </button>
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => handleRestore(version.id)}
                                className="p-2 rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20"
                                title="Restore this version"
                              >
                                <Restore className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Compare View */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-semibold text-slate-100">Comparing Versions</h4>
                      <button
                        type="button"
                        onClick={() => setComparing(false)}
                        className="text-sm text-slate-400 hover:text-slate-200"
                      >
                        Back to list
                      </button>
                    </div>

                    {compareVersions.length === 2 && (
                      <div className="grid gap-4 md:grid-cols-2">
                        {compareVersions.map((version, index) => (
                          <div key={version.id} className="p-4 rounded-xl border border-white/10 bg-white/[0.03]">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold">
                                Version {version.version_number}
                              </span>
                              <span className="text-xs text-slate-400">
                                {formatDate(version.created_at)}
                              </span>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              {entityType === 'page' ? (
                                <>
                                  <div>
                                    <span className="text-slate-500">Title:</span>
                                    <span className="ml-2 text-slate-200">{version.seo_title || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Status:</span>
                                    <span className="ml-2 text-slate-200">{version.status}</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div>
                                    <span className="text-slate-500">Title:</span>
                                    <span className="ml-2 text-slate-200">{version.title || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Status:</span>
                                    <span className="ml-2 text-slate-200">{version.status}</span>
                                  </div>
                                </>
                              )}
                            </div>

                            {index === 0 && (
                              <button
                                type="button"
                                onClick={() => handleRestore(version.id)}
                                className="mt-4 w-full px-3 py-2 rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 text-sm"
                              >
                                <Restore className="w-4 h-4 inline mr-1" />
                                Restore This Version
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {compareVersions.length === 2 && (
                      <div className="p-4 rounded-xl border border-white/10 bg-white/[0.03]">
                        <h5 className="text-sm font-semibold text-slate-100 mb-3">Differences</h5>
                        <div className="space-y-2">
                          {entityType === 'page' ? (
                            <>
                              {compareVersions[0].seo_title !== compareVersions[1].seo_title && (
                                <div className="p-2 rounded bg-white/[0.02]">
                                  <span className="text-slate-500 text-xs">SEO Title:</span>
                                  <div className="mt-1 text-sm">
                                    <span className="text-rose-400 line-through mr-2">{compareVersions[1].seo_title}</span>
                                    <span className="text-green-400">{compareVersions[0].seo_title}</span>
                                  </div>
                                </div>
                              )}
                              {compareVersions[0].seo_description !== compareVersions[1].seo_description && (
                                <div className="p-2 rounded bg-white/[0.02]">
                                  <span className="text-slate-500 text-xs">SEO Description:</span>
                                  <div className="mt-1 text-sm">
                                    <span className="text-rose-400 line-through mr-2 block">{compareVersions[1].seo_description}</span>
                                    <span className="text-green-400 block">{compareVersions[0].seo_description}</span>
                                  </div>
                                </div>
                              )}
                              {compareVersions[0].status !== compareVersions[1].status && (
                                <div className="p-2 rounded bg-white/[0.02]">
                                  <span className="text-slate-500 text-xs">Status:</span>
                                  <div className="mt-1 text-sm">
                                    <span className="text-rose-400 line-through mr-2">{compareVersions[1].status}</span>
                                    <span className="text-green-400">{compareVersions[0].status}</span>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              {compareVersions[0].title !== compareVersions[1].title && (
                                <div className="p-2 rounded bg-white/[0.02]">
                                  <span className="text-slate-500 text-xs">Title:</span>
                                  <div className="mt-1 text-sm">
                                    <span className="text-rose-400 line-through mr-2">{compareVersions[1].title}</span>
                                    <span className="text-green-400">{compareVersions[0].title}</span>
                                  </div>
                                </div>
                              )}
                              {compareVersions[0].excerpt !== compareVersions[1].excerpt && (
                                <div className="p-2 rounded bg-white/[0.02]">
                                  <span className="text-slate-500 text-xs">Excerpt:</span>
                                  <div className="mt-1 text-sm">
                                    <span className="text-rose-400 line-through mr-2 block">{compareVersions[1].excerpt}</span>
                                    <span className="text-green-400 block">{compareVersions[0].excerpt}</span>
                                  </div>
                                </div>
                              )}
                              {compareVersions[0].status !== compareVersions[1].status && (
                                <div className="p-2 rounded bg-white/[0.02]">
                                  <span className="text-slate-500 text-xs">Status:</span>
                                  <div className="mt-1 text-sm">
                                    <span className="text-rose-400 line-through mr-2">{compareVersions[1].status}</span>
                                    <span className="text-green-400">{compareVersions[0].status}</span>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedVersions.length >= 2 && !comparing && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setComparing(true)}
                      className="w-full px-4 py-2 rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20"
                    >
                      <Compare className="w-4 h-4 inline mr-2" />
                      Compare Selected Versions
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}