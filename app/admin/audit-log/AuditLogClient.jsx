'use client'

import { useEffect, useState } from 'react'
import { Surface } from '../../../src/components/ui/Surface'
import { adminApiFetch } from '../../../lib/adminApiClient'
import { History, User, Clock } from 'lucide-react'

const ACTION_STYLES = {
  create: 'bg-emerald-500/20 text-emerald-300',
  update: 'bg-blue-500/20 text-blue-300',
  delete: 'bg-rose-500/20 text-rose-300',
}

export default function AuditLogClient() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [entityTypeFilter, setEntityTypeFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  async function loadEntries() {
    setLoading(true)
    setStatus('')
    try {
      const params = new URLSearchParams({ limit: '200' })
      if (entityTypeFilter) params.set('entity_type', entityTypeFilter)
      if (actionFilter) params.set('action', actionFilter)
      const json = await adminApiFetch(`/api/cms/audit-log?${params.toString()}`, { cache: 'no-store' })
      setEntries(Array.isArray(json.data) ? json.data : [])
    } catch (error) {
      setStatus(error?.message || 'Failed to load audit log.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEntries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityTypeFilter, actionFilter])

  const entityTypes = Array.from(new Set(entries.map((entry) => entry.entity_type).filter(Boolean))).sort()

  function formatChanges(changes) {
    if (!changes || typeof changes !== 'object' || !Object.keys(changes).length) return '-'
    const keys = Object.keys(changes)
    return keys.length > 4 ? `${keys.slice(0, 4).join(', ')}, +${keys.length - 4} more` : keys.join(', ')
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-50">
          <History className="w-5 h-5 inline mr-2 -mt-1" />
          Audit Log
        </h2>
        <p className="mt-1 text-sm text-slate-300">Who changed what, and when - across every content type and user management action.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[200px]">
            <label htmlFor="audit-entity-type-filter" className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Content Type</label>
            <select
              id="audit-entity-type-filter"
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            >
              <option value="">All types</option>
              {entityTypes.map((type) => (
                <option key={type} value={type} className="bg-[#050b12]">{type}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[160px]">
            <label htmlFor="audit-action-filter" className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Action</label>
            <select
              id="audit-action-filter"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            >
              <option value="">All actions</option>
              <option value="create" className="bg-[#050b12]">Create</option>
              <option value="update" className="bg-[#050b12]">Update</option>
              <option value="delete" className="bg-[#050b12]">Delete</option>
            </select>
          </div>
        </div>
      </div>

      {status && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-sm text-rose-300">{status}</div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">When</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Who</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Content Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Fields Changed</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">Loading...</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">No audit entries yet.</td></tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-slate-500" />
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      <User className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-slate-500" />
                      {entry.actor_email || entry.actor_name || 'Unknown'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${ACTION_STYLES[entry.action] || 'bg-slate-500/20 text-slate-300'}`}>
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{entry.entity_type}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 max-w-[320px] truncate">{formatChanges(entry.changes)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Surface>
  )
}
