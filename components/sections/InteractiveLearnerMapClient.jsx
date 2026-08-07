'use client'

// Real Leaflet + OpenStreetMap map (not an image). Only ever loaded client-side via
// InteractiveLearnerMapLoader's next/dynamic(..., { ssr: false }) boundary, so it's safe to touch
// `window`/`document`/Leaflet's DOM APIs here.

import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
import { Search } from 'lucide-react'

const TILE_SOURCES = {
  blue: { url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', dark: false },
  light: { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', dark: false },
  dark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', dark: true },
}
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
}

function pointIcon(point, dark) {
  const size = point.learnerCount ? 40 : 30
  const bg = dark ? '#5eead4' : '#0d9488'
  const label = point.learnerCount ? (point.learnerCount >= 1000 ? `${Math.round(point.learnerCount / 100) / 10}k` : point.learnerCount) : ''
  return L.divIcon({
    className: 'acadvizen-learner-map-pin',
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${bg};color:${dark ? '#022c22' : '#f0fdfa'};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid ${dark ? '#022c22' : '#ffffff'};box-shadow:0 4px 12px rgba(0,0,0,0.35);">${escapeHtml(label)}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

function popupHtml(point, showGrowth) {
  const parts = [`<div style="min-width:180px;font-family:inherit;">`]
  parts.push(`<p style="margin:0 0 4px;font-weight:600;font-size:13px;">${escapeHtml(point.label)}</p>`)
  const region = [point.state, point.country].filter(Boolean).join(', ')
  if (region) parts.push(`<p style="margin:0 0 6px;font-size:11px;color:#64748b;">${escapeHtml(region)}</p>`)
  if (point.learnerCount) {
    parts.push(`<p style="margin:0 0 2px;font-size:12px;">${escapeHtml(point.learnerCount)} learners</p>`)
  }
  if (showGrowth && point.growthPercent) {
    parts.push(`<p style="margin:0 0 6px;font-size:12px;color:#0d9488;">+${escapeHtml(point.growthPercent)}% growth</p>`)
  }
  if (point.ctaUrl) {
    parts.push(`<a href="${escapeHtml(point.ctaUrl)}" style="font-size:12px;font-weight:600;color:#0d9488;text-decoration:none;">${escapeHtml(point.ctaLabel || 'Explore')} &rarr;</a>`)
  }
  parts.push('</div>')
  return parts.join('')
}

function ClusterLayer({ points, dark, showGrowth }) {
  const map = useMap()
  const groupRef = useRef(null)

  useEffect(() => {
    const group = L.markerClusterGroup({
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount()
        const size = count >= 10 ? 52 : 42
        return L.divIcon({
          html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${dark ? 'rgba(94,234,212,0.9)' : 'rgba(13,148,136,0.92)'};color:${dark ? '#022c22' : '#f0fdfa'};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;border:3px solid ${dark ? '#022c22' : '#ffffff'};box-shadow:0 6px 16px rgba(0,0,0,0.35);">${count}</div>`,
          className: 'acadvizen-learner-map-cluster',
          iconSize: [size, size],
        })
      },
      maxClusterRadius: 55,
    })

    for (const point of points) {
      const marker = L.marker([point.lat, point.lng], { icon: pointIcon(point, dark) })
      marker.bindPopup(popupHtml(point, showGrowth))
      marker.acadvizenPoint = point
      group.addLayer(marker)
    }

    map.addLayer(group)
    groupRef.current = group

    if (points.length > 1) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]))
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 })
    } else if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 10)
    }

    return () => {
      map.removeLayer(group)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, points, dark, showGrowth])

  return null
}

export default function InteractiveLearnerMapClient({ points = [], height = 520, initialZoom = 4, mapStyle = 'blue', showSearch = true, showGrowth = true }) {
  const [query, setQuery] = useState('')
  const mapRef = useRef(null)
  const tile = TILE_SOURCES[mapStyle] || TILE_SOURCES.blue

  const matches = useMemo(() => {
    if (!query.trim()) return []
    const q = query.trim().toLowerCase()
    return points.filter((p) => `${p.label} ${p.state || ''} ${p.country || ''}`.toLowerCase().includes(q)).slice(0, 6)
  }, [points, query])

  function flyTo(point) {
    setQuery('')
    mapRef.current?.flyTo([point.lat, point.lng], 11, { duration: 1.1 })
  }

  const center = points.length ? [points[0].lat, points[0].lng] : [20.5937, 78.9629]

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10" style={{ height }}>
      {showSearch ? (
        <div className="absolute left-3 top-3 z-[1000] w-64">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city or area..."
              className="w-full rounded-xl border border-white/10 bg-slate-950/90 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder:text-slate-500 shadow-lg backdrop-blur focus:border-teal-400/50 focus:outline-none"
            />
          </div>
          {matches.length ? (
            <div className="mt-1 overflow-hidden rounded-xl border border-white/10 bg-slate-950/95 shadow-lg backdrop-blur">
              {matches.map((point) => (
                <button
                  key={point.id}
                  type="button"
                  onClick={() => flyTo(point)}
                  className="block w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.06]"
                >
                  {point.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <MapContainer
        center={center}
        zoom={initialZoom}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer url={tile.url} attribution={ATTRIBUTION} />
        <ClusterLayer points={points} dark={tile.dark} showGrowth={showGrowth} />
      </MapContainer>
    </div>
  )
}
