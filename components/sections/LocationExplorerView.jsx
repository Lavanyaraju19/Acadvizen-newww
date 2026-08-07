'use client'

// Client island for the Location Explorer block's interactive bits (search / expand). The parent
// server component (LocationExplorerSection.jsx) does all the data fetching so this only ever
// receives already-resolved, real destination URLs - it never invents a link itself.

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, MapPin, Search } from 'lucide-react'

function ExplorerVariant({ cityGroups, query }) {
  const [openCity, setOpenCity] = useState(cityGroups[0]?.cityId || '')
  const filtered = useMemo(() => {
    if (!query) return cityGroups
    const q = query.toLowerCase()
    return cityGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.label.toLowerCase().includes(q) || group.cityName.toLowerCase().includes(q)),
      }))
      .filter((group) => group.items.length > 0)
  }, [cityGroups, query])

  return (
    <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.02]">
      {filtered.map((group) => {
        const isOpen = query ? true : openCity === group.cityId
        return (
          <div key={group.cityId}>
            <button
              type="button"
              onClick={() => setOpenCity(isOpen ? '' : group.cityId)}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                <MapPin className="h-4 w-4 text-teal-300" aria-hidden="true" />
                {group.cityName}
              </span>
              <span className="text-xs text-slate-400">{group.items.length} {group.items.length === 1 ? 'Area' : 'Areas'}</span>
            </button>
            {isOpen ? (
              <div className="grid grid-cols-1 gap-x-6 gap-y-2 px-5 pb-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="group flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-teal-200"
                  >
                    {item.label}
                    <ArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        )
      })}
      {filtered.length === 0 ? <p className="px-5 py-6 text-center text-sm text-slate-500">No locations match your search.</p> : null}
    </div>
  )
}

function ConstellationVariant({ cityGroups }) {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {cityGroups.map((group) => (
        <div key={group.cityId} className="relative rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_65%)] p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-400/40 bg-teal-400/10 text-xs font-semibold text-teal-200">
              {group.items.length}
            </span>
            <h3 className="text-sm font-semibold text-slate-100">{group.cityName}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {group.items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-teal-400/40 hover:text-teal-200"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function IndexVariant({ cityGroups }) {
  const allItems = useMemo(
    () => cityGroups.flatMap((g) => g.items.map((item) => ({ ...item, cityName: g.cityName }))).sort((a, b) => a.label.localeCompare(b.label)),
    [cityGroups]
  )
  return (
    <div className="columns-1 gap-x-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:columns-2 lg:columns-3">
      {allItems.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className="mb-2 flex items-baseline justify-between gap-2 break-inside-avoid border-b border-white/5 py-1.5 text-sm text-slate-300 hover:text-teal-200"
        >
          <span>{item.label}</span>
          <span className="text-[11px] text-slate-500">{item.cityName}</span>
        </Link>
      ))}
    </div>
  )
}

function GridVariant({ cityGroups }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cityGroups.map((group) => (
        <div key={group.cityId} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-sm font-semibold text-slate-100">{group.cityName}</h3>
          <p className="mt-0.5 text-[11px] uppercase tracking-[0.2em] text-slate-500">{group.items.length} Areas</p>
          <ul className="mt-3 space-y-1.5">
            {group.items.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="text-sm text-slate-300 hover:text-teal-200">{item.label} →</Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default function LocationExplorerView({ variant, cityGroups, heading, subheading, ctaLabel, ctaUrl }) {
  const [query, setQuery] = useState('')
  const showSearch = variant === 'explorer'

  return (
    <div>
      {heading ? <h2 className="text-2xl font-semibold text-slate-50 sm:text-3xl">{heading}</h2> : null}
      {subheading ? <p className="mt-2 max-w-2xl text-sm text-slate-300">{subheading}</p> : null}

      {showSearch ? (
        <div className="relative mt-5 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city or area..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-400/50 focus:outline-none"
          />
        </div>
      ) : null}

      <div className="mt-6">
        {variant === 'constellation' ? <ConstellationVariant cityGroups={cityGroups} /> : null}
        {variant === 'index' ? <IndexVariant cityGroups={cityGroups} /> : null}
        {variant === 'grid' ? <GridVariant cityGroups={cityGroups} /> : null}
        {variant === 'explorer' || !variant ? <ExplorerVariant cityGroups={cityGroups} query={query} /> : null}
      </div>

      {ctaLabel && ctaUrl ? (
        <div className="mt-6">
          <Link href={ctaUrl} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-300 hover:text-teal-200">
            {ctaLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </div>
  )
}
