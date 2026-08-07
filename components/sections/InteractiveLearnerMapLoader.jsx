'use client'

// next/dynamic with ssr:false can only be called from a Client Component - this thin wrapper is
// the boundary between the server-fetched data (InteractiveLearnerMapSection.jsx) and the actual
// Leaflet map, which touches `window`/`document` and must never run during SSR/build.

import dynamic from 'next/dynamic'

const InteractiveLearnerMapClient = dynamic(() => import('./InteractiveLearnerMapClient'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]" style={{ height: 520 }}>
      <p className="text-xs text-slate-500">Loading map...</p>
    </div>
  ),
})

export default function InteractiveLearnerMapLoader(props) {
  return <InteractiveLearnerMapClient {...props} />
}
