import { MapPin, Navigation } from 'lucide-react'
import { hasValidCoordinatePair } from '../../../lib/geo'

// Map/directions card for City and Area pages. Embeds a lazy-loaded Google Maps iframe when real
// lat/lng is on the record (no API key required for the basic `?output=embed` form); falls back to
// an address-only "Get Directions" card when only an address string exists; renders nothing when
// neither is set - never a blank map box.
export default function LocationMapCard({ latitude, longitude, address }) {
  const hasCoords = hasValidCoordinatePair(latitude, longitude)
  if (!hasCoords && !address) return null

  const directionsHref = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    : address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      : ''

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      {hasCoords ? (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <iframe
            src={`https://www.google.com/maps?q=${latitude},${longitude}&output=embed`}
            title="Location map"
            className="h-80 w-full md:h-96"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : (
        <div className="immersive-glass flex h-80 flex-col items-center justify-center gap-3 rounded-2xl text-slate-500 md:h-96">
          <MapPin className="h-8 w-8" />
          <span className="text-sm">Map preview unavailable - use directions below.</span>
        </div>
      )}
      <div className="immersive-glass flex flex-col justify-center rounded-2xl p-6">
        {address ? <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">{address}</p> : null}
        {directionsHref ? (
          <a
            href={directionsHref}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-teal-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-teal-200"
          >
            <Navigation className="h-4 w-4" />
            Get Directions
          </a>
        ) : null}
      </div>
    </div>
  )
}
