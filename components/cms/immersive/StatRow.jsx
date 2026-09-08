import { RevealGroup, RevealItem } from './Reveal'

// Floating glass stat cards joined by a thin connecting hairline - the "not plain counters"
// requirement. Renders nothing if no stats are supplied (never fabricates numbers). Each stat
// may optionally carry an `icon` (a lucide component reference) for a bolder, iconography-led
// presentation; `surface="ink"` swaps the card tone to a deeper, higher-contrast slab for
// sections that want to stand out more (e.g. course highlights), matching the glass tone
// everywhere else by default.
export default function StatRow({ stats = [], surface = 'glass' }) {
  if (!stats.length) return null
  const cardClass = surface === 'ink' ? 'border border-white/8 bg-black/30' : 'immersive-glass'

  return (
    <div className="relative">
      <div className="immersive-hairline absolute left-0 right-0 top-1/2 hidden -translate-y-1/2 sm:block" aria-hidden="true" />
      <RevealGroup className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <RevealItem key={stat.label} as="scale">
              <div className={`${cardClass} relative rounded-2xl px-6 py-7 text-center transition hover:-translate-y-1 hover:border-teal-300/25`}>
                {Icon ? (
                  <span className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-teal-300/10 text-teal-300">
                    <Icon className="h-4 w-4" />
                  </span>
                ) : null}
                <div className="immersive-display text-3xl font-bold text-white sm:text-4xl">{stat.value}</div>
                <div className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-400">{stat.label}</div>
              </div>
            </RevealItem>
          )
        })}
      </RevealGroup>
    </div>
  )
}
