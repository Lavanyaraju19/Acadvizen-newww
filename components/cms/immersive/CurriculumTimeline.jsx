import { RevealGroup, RevealItem } from './Reveal'

function normalizeModule(item, index) {
  if (typeof item === 'string') return { title: item, topics: [] }
  if (item && typeof item === 'object') {
    return {
      title: item.title || item.name || item.module || `Module ${index + 1}`,
      topics: Array.isArray(item.topics) ? item.topics : Array.isArray(item.items) ? item.items : [],
    }
  }
  return { title: `Module ${index + 1}`, topics: [] }
}

// Vertical timeline with a connecting spine - used for course curriculum modules.
export default function CurriculumTimeline({ items = [], emptyLabel = 'Curriculum will appear here once published.' }) {
  const modules = (items || []).map(normalizeModule).filter((m) => m.title)
  if (!modules.length) return <p className="text-sm text-slate-500">{emptyLabel}</p>

  return (
    <RevealGroup className="relative mx-auto max-w-3xl">
      <div className="absolute bottom-4 left-[15px] top-4 w-px bg-gradient-to-b from-teal-300/40 via-white/10 to-transparent" aria-hidden="true" />
      <div className="space-y-6">
        {modules.map((mod, index) => (
          <RevealItem key={mod.title} as="left" delay={index * 0.04}>
            <div className="relative flex gap-5 pl-1">
              <span className="relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-teal-300/40 bg-[#050a13] text-xs font-bold text-teal-300">
                {index + 1}
              </span>
              <div className="immersive-glass flex-1 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white sm:text-base">{mod.title}</h3>
                {mod.topics.length ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {mod.topics.map((topic) => (
                      <li key={topic} className="rounded-full border border-white/8 bg-white/[0.02] px-3 py-1 text-xs text-slate-400">
                        {topic}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </RevealItem>
        ))}
      </div>
    </RevealGroup>
  )
}
