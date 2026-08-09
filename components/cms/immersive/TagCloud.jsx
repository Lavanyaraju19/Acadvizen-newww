import { RevealGroup, RevealItem } from './Reveal'

// Floating chip cloud for skills/tools lists - plain strings only, never fabricated.
export default function TagCloud({ items = [], emptyLabel = 'Coming soon.' }) {
  if (!items.length) return <p className="text-sm text-slate-500">{emptyLabel}</p>
  return (
    <RevealGroup className="flex flex-wrap gap-3">
      {items.map((item, index) => (
        <RevealItem key={item} as="scale" delay={index * 0.03}>
          <span className="immersive-glass inline-flex items-center rounded-full px-4 py-2 text-sm text-slate-200 transition hover:border-teal-300/30 hover:text-white">
            {item}
          </span>
        </RevealItem>
      ))}
    </RevealGroup>
  )
}
