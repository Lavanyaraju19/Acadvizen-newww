'use client'

import Image from 'next/image'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'

const MAP_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const HIGHLIGHT_COUNTRIES = new Set([
  'United States of America',
  'Canada',
  'Brazil',
  'United Kingdom',
  'France',
  'Germany',
  'India',
  'United Arab Emirates',
  'Singapore',
  'Japan',
  'Australia',
  'South Africa',
])

const learnerMarkers = [
  {
    id: 'americas',
    region: 'Americas',
    learners: '30,161',
    growth: '+15%',
    avatar: '/images/success/success1.jpg',
    pin: { x: 20, y: 43 },
    card: { x: 9, y: 12 },
  },
  {
    id: 'emea',
    region: 'EMEA',
    learners: '52,001',
    growth: '+10%',
    avatar: '/images/success/success2.jpg',
    pin: { x: 56, y: 60 },
    card: { x: 47, y: 52 },
  },
  {
    id: 'apac',
    region: 'APAC',
    learners: '7,990',
    growth: '+13%',
    avatar: '/images/success/success3.jpg',
    pin: { x: 82, y: 36 },
    card: { x: 70, y: 16 },
  },
]

export default function WorldCareerMap() {
  const baseFill = '#d1dae6'
  const highlightFill = '#4285f4'

  return (
    <div className="relative w-full overflow-hidden rounded-[30px] border border-cyan-300/20 bg-[radial-gradient(circle_at_14%_14%,rgba(14,116,144,0.25),transparent_26%),radial-gradient(circle_at_86%_78%,rgba(67,56,202,0.24),transparent_34%),linear-gradient(120deg,rgba(2,10,27,0.97),rgba(5,19,46,0.96)_44%,rgba(15,23,56,0.94))] p-4 md:p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative h-[280px] sm:h-[340px] md:h-[430px]">
        <div className="absolute inset-0 rounded-2xl border border-white/10 bg-slate-950/25" />
        <div className="absolute inset-0">
          <ComposableMap projection="geoMercator" projectionConfig={{ scale: 120 }} className="h-full w-full">
            <Geographies geography={MAP_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const name = geo.properties?.NAME || geo.properties?.name
                  const isHighlighted = HIGHLIGHT_COUNTRIES.has(name)
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={isHighlighted ? highlightFill : baseFill}
                      stroke="#203252"
                      strokeWidth={0.35}
                      style={{
                        default: { outline: 'none' },
                        hover: { outline: 'none' },
                        pressed: { outline: 'none' },
                      }}
                    />
                  )
                })
              }
            </Geographies>
          </ComposableMap>
        </div>

        <div className="absolute inset-0 hidden md:block">
          {learnerMarkers.map((marker, idx) => (
            <div key={`${marker.id}-pin`} className="absolute" style={{ left: `${marker.pin.x}%`, top: `${marker.pin.y}%` }}>
              <span
                className="absolute -left-7 -top-7 h-14 w-14 rounded-full bg-cyan-300/30 animate-ping"
                style={{ animationDelay: `${idx * 0.4}s` }}
              />
              <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full border border-cyan-200/70 bg-cyan-300/85 shadow-[0_0_18px_rgba(34,211,238,0.8)]" />
              <span className="absolute left-6 -top-5 rounded-full border border-emerald-200/70 bg-emerald-300/95 px-2 py-0.5 text-[10px] font-semibold text-emerald-950">
                {marker.growth}
              </span>
            </div>
          ))}

          {learnerMarkers.map((marker) => (
            <div
              key={`${marker.id}-card`}
              className="absolute"
              style={{ left: `${marker.card.x}%`, top: `${marker.card.y}%` }}
            >
              <div className="rounded-2xl border border-white/25 bg-white/95 px-4 py-3 text-slate-900 shadow-[0_15px_40px_rgba(2,6,23,0.38)]">
                <div className="flex min-w-[190px] items-center gap-3">
                  <Image
                    src={marker.avatar}
                    alt={`${marker.region} learner`}
                    width={38}
                    height={38}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-2xl font-bold leading-none">{marker.learners}</div>
                    <div className="text-xs font-medium text-slate-600">Learners</div>
                  </div>
                  <div className="ml-auto rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                    {marker.growth}
                  </div>
                </div>
              </div>
              <div className="ml-10 mt-[-5px] h-3 w-3 rotate-45 border-b border-r border-slate-300 bg-white/95" />
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-5 grid gap-3 md:hidden">
        {learnerMarkers.map((marker) => (
          <div
            key={`${marker.id}-mobile`}
            className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3"
          >
            <Image
              src={marker.avatar}
              alt={`${marker.region} learner`}
              width={34}
              height={34}
              className="h-8 w-8 rounded-full object-cover"
            />
            <div className="text-slate-100">
              <div className="text-sm font-semibold">{marker.region}</div>
              <div className="text-xs text-slate-300">{marker.learners} Learners</div>
            </div>
            <div className="ml-auto rounded-full border border-emerald-200/50 bg-emerald-300/20 px-2 py-1 text-xs font-semibold text-emerald-200">
              {marker.growth}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
