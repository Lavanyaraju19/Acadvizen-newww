'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { adminApiFetch } from '../../../lib/adminApiClient'
import { getCanonicalPath } from '../../../lib/cmsPublishing'
import OwnerSectionsEditor from '../shared/OwnerSectionsEditor'

// Same designed-block capability City pages already have (Admin > Cities > Designed Sections),
// wired to Locations/Areas here via the generic OwnerSectionsEditor + location_sections table/API
// - lets a non-technical admin add Feature Cards, FAQ, CTA, Image+Text, Statistics, and every
// other Page Builder block type to a location page like /digital-marketing-courses-hsr-layout
// without touching that page's existing fixed intro/why/demand content.
export default function LocationSectionsManager() {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const json = await adminApiFetch('/api/cms/entities/locations?limit=500', { cache: 'no-store' })
      const rows = Array.isArray(json.data) ? json.data : []
      rows.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      setLocations(rows)
      if (!selectedId && rows[0]) setSelectedId(rows[0].id)
    } finally {
      setLoading(false)
    }
  }

  const selected = locations.find((loc) => loc.id === selectedId) || null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-slate-400">
          Location / Area
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="mt-1 block w-72 px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}{loc.is_active === false ? ' (unpublished)' : ''}</option>
            ))}
          </select>
        </label>
        {selected?.slug ? (
          <Link
            href={getCanonicalPath('location', selected.slug)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-xs text-slate-300 hover:bg-white/[0.05]"
          >
            View live <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading locations...</p>
      ) : !locations.length ? (
        <p className="text-sm text-slate-400">No locations yet. Create one above first, then come back here to add designed sections.</p>
      ) : (
        <OwnerSectionsEditor
          key={selectedId}
          ownerId={selectedId}
          ownerParam="location_id"
          apiBase="/api/cms/location-sections"
          emptyHint="Select a location above, then add designed sections."
        />
      )}
    </div>
  )
}
