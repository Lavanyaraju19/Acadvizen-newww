'use client'

import { useMemo, useState } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'

const MAP_URL =
  'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const HIGHLIGHT_COUNTRIES = new Set([
  'India',
  'United States of America',
  'United Kingdom',
  'United Arab Emirates',
  'Singapore',
  'Australia',
  'Canada',
  'Germany',
  'Netherlands',
  'France',
  'Japan',
  'South Africa',
])

export default function WorldCareerMap() {
  const [tooltip, setTooltip] = useState(null)

  const highlightFill = '#3b82f6'
  const baseFill = '#e2e8f0'
  const hoverFill = '#60a5fa'

  const tooltipStyle = useMemo(
    () =>
      tooltip
        ? {
            left: tooltip.x + 12,
            top: tooltip.y + 12,
          }
        : {},
    [tooltip]
  )

  return (
    <div className="relative w-full">
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-white/20 bg-slate-950/90 px-3 py-2 text-xs font-semibold text-white shadow-lg"
          style={tooltipStyle}
        >
          {tooltip.name}
        </div>
      )}

      <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:p-6">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 120 }}
          className="w-full h-auto"
        >
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
                    stroke="#0f172a"
                    strokeWidth={0.3}
                    style={{
                      default: { outline: 'none' },
                      hover: {
                        fill: isHighlighted ? hoverFill : '#cbd5f5',
                        outline: 'none',
                        cursor: isHighlighted ? 'pointer' : 'default',
                      },
                      pressed: { outline: 'none' },
                    }}
                    onMouseEnter={(evt) => {
                      if (!isHighlighted) return
                      setTooltip({
                        name,
                        x: evt.clientX,
                        y: evt.clientY,
                      })
                    }}
                    onMouseMove={(evt) => {
                      if (!isHighlighted) return
                      setTooltip({
                        name,
                        x: evt.clientX,
                        y: evt.clientY,
                      })
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                )
              })
            }
          </Geographies>
        </ComposableMap>
      </div>
    </div>
  )
}
