'use client'

import { useEffect, useMemo, useState } from 'react'
import { adminApiFetch } from '../../../lib/adminApiClient'

const TABS = [
  { key: 'suggestions', label: 'Suggested Links' },
  { key: 'incoming', label: 'Incoming Links' },
  { key: 'outgoing', label: 'Outgoing Links' },
  { key: 'broken', label: 'Broken Links' },
  { key: 'orphans', label: 'Orphan Pages' },
  { key: 'manual', label: 'Manual Links' },
]

const STATUS_LABEL = { pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected', ignored: 'Ignored' }
const STATUS_COLOR = {
  pending: 'text-amber-200 border-amber-400/30 bg-amber-400/10',
  accepted: 'text-teal-200 border-teal-400/30 bg-teal-400/10',
  rejected: 'text-rose-200 border-rose-400/30 bg-rose-400/10',
  ignored: 'text-slate-400 border-white/10 bg-white/[0.03]',
}

function StatCard({ label, value, tone }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${tone || 'text-slate-100'}`}>{value}</p>
    </div>
  )
}

export default function InternalLinksClient() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('suggestions')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [busyId, setBusyId] = useState('')
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const json = await adminApiFetch('/api/cms/internal-links', { cache: 'no-store' })
      setData(json.data)
    } catch (err) {
      setError(err?.message || 'Failed to load the internal link graph.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function decide(id, action) {
    setBusyId(id)
    try {
      await adminApiFetch('/api/cms/internal-links/suggestions', { method: 'PATCH', body: { id, action } })
      await load()
    } catch (err) {
      setError(err?.message || 'Failed to update suggestion.')
    } finally {
      setBusyId('')
    }
  }

  async function manuallyAdd(suggestion) {
    setBusyId(suggestion.id)
    try {
      await adminApiFetch('/api/cms/internal-links/edges', {
        method: 'POST',
        body: {
          sourceType: suggestion.source_type,
          sourceId: suggestion.source_id,
          sourceTitle: suggestion.source_title,
          sourceUrl: suggestion.source_url,
          targetType: suggestion.target_type,
          targetId: suggestion.target_id,
          targetTitle: suggestion.target_title,
          targetUrl: suggestion.target_url,
          origin: 'accepted_suggestion',
        },
      })
      await decide(suggestion.id, 'accept')
    } catch (err) {
      setError(err?.message || 'Failed to add manual link.')
      setBusyId('')
    }
  }

  async function removeEdge(id) {
    if (!window.confirm('Remove this manually declared link?')) return
    setBusyId(id)
    try {
      await adminApiFetch(`/api/cms/internal-links/edges/${id}`, { method: 'DELETE' })
      await load()
    } catch (err) {
      setError(err?.message || 'Failed to remove link.')
    } finally {
      setBusyId('')
    }
  }

  const filteredSuggestions = useMemo(() => {
    const rows = data?.suggestions || []
    const byStatus = statusFilter === 'all' ? rows : rows.filter((r) => r.status === statusFilter)
    const query = search.trim().toLowerCase()
    if (!query) return byStatus
    return byStatus.filter((r) => `${r.source_title} ${r.target_title} ${r.reason}`.toLowerCase().includes(query))
  }, [data, statusFilter, search])

  if (loading && !data) {
    return <p className="text-sm text-slate-400">Building the internal link graph from live content...</p>
  }

  return (
    <div className="space-y-5">
      {error ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-200">{error}</div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <StatCard label="Content Nodes" value={data?.summary?.totalNodes ?? '—'} />
        <StatCard label="Outgoing Links" value={data?.summary?.totalOutgoing ?? '—'} />
        <StatCard label="Linked Pages" value={data?.summary?.totalIncomingTargets ?? '—'} />
        <StatCard label="Broken Links" value={data?.summary?.totalBroken ?? '—'} tone={data?.summary?.totalBroken ? 'text-rose-300' : 'text-slate-100'} />
        <StatCard label="Orphan Pages" value={data?.summary?.totalOrphans ?? '—'} tone={data?.summary?.totalOrphans ? 'text-amber-300' : 'text-slate-100'} />
        <StatCard label="Pending Suggestions" value={data?.summary?.pendingSuggestions ?? '—'} tone="text-teal-300" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === t.key ? 'bg-teal-300 text-slate-950' : 'text-slate-300 hover:bg-white/[0.05]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/[0.05] disabled:opacity-60"
          >
            {loading ? 'Refreshing...' : 'Refresh graph'}
          </button>
        </div>
      </div>

      {tab === 'suggestions' ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {['pending', 'accepted', 'rejected', 'ignored', 'all'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-full border px-3 py-1 text-[11px] ${
                  statusFilter === s ? 'border-teal-400/40 bg-teal-400/10 text-teal-200' : 'border-white/10 text-slate-400 hover:text-slate-200'
                }`}
              >
                {s === 'all' ? 'All' : STATUS_LABEL[s]}
              </button>
            ))}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search suggestions..."
              className="ml-auto w-56 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-100"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="bg-white/[0.04] text-slate-400">
                <tr>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Target</th>
                  <th className="px-3 py-2">Reason</th>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredSuggestions.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-500">No suggestions in this filter.</td></tr>
                ) : filteredSuggestions.map((s) => (
                  <tr key={s.id} className="text-slate-200">
                    <td className="px-3 py-2">
                      <p className="font-medium">{s.source_title}</p>
                      <p className="text-slate-500">{s.source_url}</p>
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-medium">{s.target_title}</p>
                      <p className="text-slate-500">{s.target_url}</p>
                    </td>
                    <td className="px-3 py-2 text-slate-400">{s.reason}</td>
                    <td className="px-3 py-2">{s.score}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] ${STATUS_COLOR[s.status] || ''}`}>{STATUS_LABEL[s.status] || s.status}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        <button type="button" disabled={busyId === s.id} onClick={() => decide(s.id, 'accept')} className="rounded border border-teal-400/30 px-2 py-1 text-teal-200 hover:bg-teal-400/10 disabled:opacity-50">Accept</button>
                        <button type="button" disabled={busyId === s.id} onClick={() => decide(s.id, 'reject')} className="rounded border border-rose-400/30 px-2 py-1 text-rose-200 hover:bg-rose-400/10 disabled:opacity-50">Reject</button>
                        <button type="button" disabled={busyId === s.id} onClick={() => decide(s.id, 'ignore')} className="rounded border border-white/10 px-2 py-1 text-slate-300 hover:bg-white/[0.05] disabled:opacity-50">Ignore</button>
                        <button type="button" disabled={busyId === s.id} onClick={() => manuallyAdd(s)} className="rounded border border-white/10 px-2 py-1 text-slate-300 hover:bg-white/[0.05] disabled:opacity-50">Manually Add Link</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-500">
            Suggestions never change live content automatically. Accepting only records the decision; use &quot;Manually Add Link&quot; to also track it as a confirmed relationship, then add the actual link in the page/course/blog editor.
          </p>
        </section>
      ) : null}

      {tab === 'incoming' ? (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-white/[0.04] text-slate-400">
              <tr><th className="px-3 py-2">Page</th><th className="px-3 py-2">Incoming Count</th><th className="px-3 py-2">Linked From</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(data?.incoming || []).length === 0 ? (
                <tr><td colSpan={3} className="px-3 py-6 text-center text-slate-500">No incoming links found.</td></tr>
              ) : (data?.incoming || []).map((row) => (
                <tr key={row.targetUrl} className="text-slate-200 align-top">
                  <td className="px-3 py-2">
                    <p className="font-medium">{row.targetTitle}</p>
                    <p className="text-slate-500">{row.targetUrl}</p>
                  </td>
                  <td className="px-3 py-2">{row.incomingCount}</td>
                  <td className="px-3 py-2 text-slate-400">
                    {row.sources.map((s) => `${s.sourceTitle} (${s.sourceUrl})`).join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'outgoing' ? (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-white/[0.04] text-slate-400">
              <tr><th className="px-3 py-2">Source</th><th className="px-3 py-2">Target URL</th><th className="px-3 py-2">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(data?.outgoing || []).length === 0 ? (
                <tr><td colSpan={3} className="px-3 py-6 text-center text-slate-500">No outgoing links found.</td></tr>
              ) : (data?.outgoing || []).map((row, idx) => (
                <tr key={`${row.sourceUrl}-${row.targetUrl}-${idx}`} className="text-slate-200">
                  <td className="px-3 py-2">
                    <p className="font-medium">{row.sourceTitle}</p>
                    <p className="text-slate-500">{row.sourceUrl}</p>
                  </td>
                  <td className="px-3 py-2 text-slate-400">{row.targetUrl}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] ${row.status === 'ok' ? 'border-teal-400/30 text-teal-200 bg-teal-400/10' : row.status === 'broken' ? 'border-rose-400/30 text-rose-200 bg-rose-400/10' : 'border-amber-400/30 text-amber-200 bg-amber-400/10'}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'broken' ? (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-white/[0.04] text-slate-400">
              <tr><th className="px-3 py-2">Source Page</th><th className="px-3 py-2">Broken Target</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(data?.broken || []).length === 0 ? (
                <tr><td colSpan={2} className="px-3 py-6 text-center text-slate-500">No broken internal links detected.</td></tr>
              ) : (data?.broken || []).map((row, idx) => (
                <tr key={`${row.sourceUrl}-${row.targetUrl}-${idx}`} className="text-slate-200">
                  <td className="px-3 py-2">
                    <p className="font-medium">{row.sourceTitle}</p>
                    <p className="text-slate-500">{row.sourceUrl}</p>
                  </td>
                  <td className="px-3 py-2 text-rose-300">{row.targetUrl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'orphans' ? (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[600px] text-left text-xs">
            <thead className="bg-white/[0.04] text-slate-400">
              <tr><th className="px-3 py-2">Page</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">URL</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(data?.orphans || []).length === 0 ? (
                <tr><td colSpan={3} className="px-3 py-6 text-center text-slate-500">No orphan pages - every published page has at least one incoming internal link.</td></tr>
              ) : (data?.orphans || []).map((row) => (
                <tr key={row.url} className="text-slate-200">
                  <td className="px-3 py-2 font-medium">{row.title}</td>
                  <td className="px-3 py-2 text-slate-400">{row.type}</td>
                  <td className="px-3 py-2 text-slate-400">{row.url}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'manual' ? (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-white/[0.04] text-slate-400">
              <tr><th className="px-3 py-2">Source</th><th className="px-3 py-2">Target</th><th className="px-3 py-2">Origin</th><th className="px-3 py-2">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(data?.edges || []).length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-500">No manually declared links yet.</td></tr>
              ) : (data?.edges || []).map((edge) => (
                <tr key={edge.id} className="text-slate-200">
                  <td className="px-3 py-2">
                    <p className="font-medium">{edge.source_title}</p>
                    <p className="text-slate-500">{edge.source_url}</p>
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-medium">{edge.target_title}</p>
                    <p className="text-slate-500">{edge.target_url}</p>
                  </td>
                  <td className="px-3 py-2 text-slate-400">{edge.origin}</td>
                  <td className="px-3 py-2">
                    <button type="button" disabled={busyId === edge.id} onClick={() => removeEdge(edge.id)} className="rounded border border-rose-400/30 px-2 py-1 text-rose-200 hover:bg-rose-400/10 disabled:opacity-50">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
