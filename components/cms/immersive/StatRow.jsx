import { RevealGroup, RevealItem } from './Reveal'

// Floating glass stat cards joined by a thin connecting hairline - the "not plain counters"
// requirement. Renders nothing if no stats are supplied (never fabricates numbers).
export default function StatRow({ stats = [] }) {
  if (!stats.length) return null

  return (
    <div className="relative">
      <div className="immersive-hairline absolute left-0 right-0 top-1/2 hidden -translate-y-1/2 sm:block" aria-hidden="true" />
      <RevealGroup className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <RevealItem key={stat.label} as="scale">
            <div className="immersive-glass relative rounded-2xl px-6 py-7 text-center transition hover:-translate-y-1 hover:border-teal-300/25">
              <div className="immersive-display text-3xl font-bold text-white sm:text-4xl">{stat.value}</div>
              <div className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-400">{stat.label}</div>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </div>
  )
}
