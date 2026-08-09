import { Sparkle } from 'lucide-react'
import { RevealGroup, RevealItem } from './Reveal'

// Offset editorial grid - alternates card size on larger screens instead of a uniform 3-up
// grid, matching the "not a plain CMS grid" brief. Renders nothing without real cards.
export default function FeatureGrid({ cards = [] }) {
  if (!cards.length) return null

  return (
    <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => {
        const wide = index % 5 === 0
        return (
          <RevealItem key={`${card.title}-${index}`} as="up" className={wide ? 'sm:col-span-2' : ''}>
            <article className="immersive-glass group relative h-full overflow-hidden rounded-2xl p-6 transition hover:-translate-y-1 hover:border-teal-300/25 sm:p-7">
              <Sparkle className="h-5 w-5 text-teal-300/70" />
              {card.title ? <h3 className="mt-4 text-lg font-semibold text-white sm:text-xl">{card.title}</h3> : null}
              {card.text ? <p className="mt-2 text-sm leading-relaxed text-slate-300">{card.text}</p> : null}
              {Array.isArray(card.list) && card.list.length ? (
                <ul className="mt-4 space-y-2 text-sm text-slate-400">
                  {card.list.map((item, itemIndex) => (
                    <li key={`${item}-${itemIndex}`} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-teal-300/70" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          </RevealItem>
        )
      })}
    </RevealGroup>
  )
}
