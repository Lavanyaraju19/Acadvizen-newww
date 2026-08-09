'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { adminApiFetch } from '../../../lib/adminApiClient'
import OwnerSectionsEditor from './OwnerSectionsEditor'

// Generic "pick a record, then edit its designed blocks" panel - the same shape as
// LocationSectionsManager.jsx (built first, for Locations/Areas), generalized here so any
// other fixed-schema content owner (Service Pages, and future page types) can get the same
// designed-block capability by dropping this in with a few props, instead of a bespoke
// per-owner picker component each time.
export default function EntitySectionsPanel({ entity, ownerParam, apiBase, publicUrlPattern, labelField = 'title', emptyListHint }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState('')

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity])

  async function load() {
    setLoading(true)
    try {
      const json = await adminApiFetch(`/api/cms/entities/${entity}?limit=500`, { cache: 'no-store' })
      const rows = Array.isArray(json.data) ? json.data : []
      rows.sort((a, b) => String(a[labelField] || '').localeCompare(String(b[labelField] || '')))
      setItems(rows)
      if (!selectedId && rows[0]) setSelectedId(rows[0].id)
    } finally {
      setLoading(false)
    }
  }

  const selected = items.find((item) => item.id === selectedId) || null
  const liveHref = selected?.slug && publicUrlPattern ? publicUrlPattern.replace('{slug}', selected.slug) : ''

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-slate-400">
          Page
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="mt-1 block w-72 px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item[labelField] || item.name || item.slug || 'Untitled'}
                {item.is_active === false ? ' (unpublished)' : ''}
              </option>
            ))}
          </select>
        </label>
        {liveHref ? (
          <Link
            href={liveHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-xs text-slate-300 hover:bg-white/[0.05]"
          >
            View live <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : !items.length ? (
        <p className="text-sm text-slate-400">{emptyListHint || 'Create a record above first, then come back here to add designed sections.'}</p>
      ) : (
        <OwnerSectionsEditor
          key={selectedId}
          ownerId={selectedId}
          ownerParam={ownerParam}
          apiBase={apiBase}
          emptyHint="Select a page above, then add designed sections."
        />
      )}
    </div>
  )
}
