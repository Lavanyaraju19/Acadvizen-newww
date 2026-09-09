'use client'

import { useEffect, useMemo, useState } from 'react'
import { adminApiFetch } from '../../../lib/adminApiClient'

// Staged-editing lifecycle controls for Locations/Areas (202608130001_staged_editing_shadow_
// drafts.sql): Start Draft creates a "shadow row" copy of an already-published location - a
// normal locations row, same slug, linked back via draft_of_id, with its own cloned designed
// sections - so it can be edited (via the Locations form above and Designed Sections panel below,
// by selecting "<name> (Draft copy)" there) without the live, public location changing at all
// until Publish. Modeled on LocationSectionsManager.jsx's own independent picker pattern rather
// than touching the shared EntityCrudManager.
export default function LocationDraftManager() {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [blockedLinks, setBlockedLinks] = useState(null)

  useEffect(() => {
    load()
  }, [])

  async function load(nextSelectedId) {
    setLoading(true)
    try {
      const json = await adminApiFetch('/api/cms/entities/locations?include_drafts=1&limit=500', { cache: 'no-store' })
      const rows = Array.isArray(json.data) ? json.data : []
      rows.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      setLocations(rows)
      const liveRows = rows.filter((row) => !row.draft_of_id)
      if (nextSelectedId) setSelectedId(nextSelectedId)
      else if (!selectedId && liveRows[0]) setSelectedId(liveRows[0].id)
    } finally {
      setLoading(false)
    }
  }

  const liveLocations = useMemo(() => locations.filter((loc) => !loc.draft_of_id), [locations])
  const draftByLiveId = useMemo(() => {
    const map = new Map()
    for (const loc of locations) {
      if (loc.draft_of_id) map.set(loc.draft_of_id, loc)
    }
    return map
  }, [locations])
  const selected = liveLocations.find((loc) => loc.id === selectedId) || null
  const draft = selected ? draftByLiveId.get(selected.id) : null

  async function handleStartDraft() {
    if (!selected) return
    setBusy(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/entities/locations/${selected.id}/start-draft`, { method: 'POST' })
      await load(selected.id)
      setStatus('Draft started. Edit it via the Locations form and Designed Sections above - the live page is untouched until you click Publish.')
    } catch (error) {
      setStatus(error?.message || 'Failed to start draft.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDiscardDraft() {
    if (!draft) return
    if (!window.confirm('Discard this draft? Your unpublished edits will be lost - the live location is unaffected either way.')) return
    setBusy(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/entities/locations/${draft.id}`, { method: 'DELETE' })
      await load(selected.id)
      setStatus('Draft discarded.')
    } catch (error) {
      setStatus(error?.message || 'Failed to discard draft.')
    } finally {
      setBusy(false)
    }
  }

  async function handlePublish() {
    if (!draft) return
    setBusy(true)
    setStatus('')
    setBlockedLinks(null)
    try {
      await adminApiFetch(`/api/cms/entities/locations/${draft.id}/publish`, { method: 'POST' })
      await load(selected.id)
      setStatus('Published.')
    } catch (error) {
      if (error?.status === 409 && Array.isArray(error?.data?.broken)) {
        setBlockedLinks(error.data.broken)
      } else {
        setStatus(error?.message || 'Failed to publish.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-slate-400">
          Location / Area
          <select
            value={selectedId}
            onChange={(e) => { setSelectedId(e.target.value); setStatus(''); setBlockedLinks(null) }}
            className="mt-1 block w-72 px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
          >
            {liveLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </label>

        {!draft && selected?.is_active ? (
          <button type="button" disabled={busy} onClick={handleStartDraft} className="rounded-lg border border-amber-300/30 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/10 disabled:opacity-60">
            Start Draft (edit without going live)
          </button>
        ) : null}
        {!draft && selected && !selected.is_active ? (
          <p className="text-xs text-slate-500">Unpublished locations are edited directly above - Start Draft is only for already-published locations.</p>
        ) : null}
        {draft ? (
          <>
            <button type="button" disabled={busy} onClick={() => window.open(`/preview/locations/${draft.id}`, '_blank', 'noopener,noreferrer')} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.05] disabled:opacity-60">
              Preview Draft
            </button>
            <button type="button" disabled={busy} onClick={handlePublish} className="rounded-lg bg-teal-300 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-teal-200 disabled:opacity-60">
              Publish
            </button>
            <button type="button" disabled={busy} onClick={handleDiscardDraft} className="rounded-lg border border-rose-400/30 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/10 disabled:opacity-60">
              Discard Draft
            </button>
          </>
        ) : null}
      </div>

      {loading ? (
        <p className="text-xs text-slate-400">Loading locations...</p>
      ) : draft ? (
        <p className="text-xs text-amber-300">
          This location has unpublished changes. To edit its fields, select &quot;{draft.name} (Draft - unpublished changes)&quot; in
          the Locations form above; to edit its designed sections, select &quot;{draft.name} (Draft copy - unpublished changes)&quot; in
          the Designed Sections picker below.
        </p>
      ) : null}

      {blockedLinks?.length ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-rose-200">
              Cannot publish - {blockedLinks.length} broken link{blockedLinks.length === 1 ? '' : 's'} found
            </p>
            <button type="button" onClick={() => setBlockedLinks(null)} className="text-xs font-semibold text-rose-300 hover:text-rose-200">
              Dismiss
            </button>
          </div>
          <ul className="mt-3 space-y-2 text-xs text-rose-100">
            {blockedLinks.map((item, index) => (
              <li key={`${item.targetUrl}-${index}`} className="rounded-lg border border-rose-400/20 bg-rose-500/5 p-2">
                <span className="font-semibold">{item.location}:</span>{' '}
                links to <code className="text-rose-200">{item.targetUrl}</code>{' '}
                ({item.reason === 'unpublished' ? 'exists but is not published' : "doesn't exist"})
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-rose-200/80">Fix these links, save, then try Publish again.</p>
        </div>
      ) : null}

      {status ? <p className="text-xs text-slate-300">{status}</p> : null}
    </div>
  )
}
