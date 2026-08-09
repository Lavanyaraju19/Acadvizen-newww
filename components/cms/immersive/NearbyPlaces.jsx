import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import { RevealGroup, RevealItem } from './Reveal'

// Premium neighbourhood grid for "Explore {City}" / nearby-locations sections - cards, not a
// plain link list, each pointing at the location's real canonical course-in-area URL.
export default function NearbyPlaces({ places = [], emptyLabel = 'More neighbourhoods will appear here soon.' }) {
  if (!places.length) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>
  }

  return (
    <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {places.map((place) => (
        <RevealItem key={place.href} as="up">
          <Link
            href={place.href}
            className="group flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-4 transition hover:border-teal-300/25 hover:bg-white/[0.04]"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-300/10 text-teal-200">
                <MapPin className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-slate-200 group-hover:text-white">{place.name}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-600 transition group-hover:translate-x-1 group-hover:text-teal-300" />
          </Link>
        </RevealItem>
      ))}
    </RevealGroup>
  )
}
