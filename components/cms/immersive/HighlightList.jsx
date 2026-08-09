import { Check } from 'lucide-react'
import { RevealGroup, RevealItem } from './Reveal'

// Curriculum / highlight checklist rendered as a two-column tick grid instead of a plain
// bulleted <ul>, so a wall of text breaks into scannable pieces per the editorial-typography brief.
export default function HighlightList({ items = [], columns = 2 }) {
  if (!items.length) return null
  return (
    <RevealGroup className={`grid gap-3 ${columns === 1 ? '' : 'sm:grid-cols-2'}`}>
      {items.map((item) => (
        <RevealItem key={item} as="up">
          <div className="flex items-start gap-3 rounded-xl border border-white/6 bg-white/[0.015] px-4 py-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-300/15 text-teal-300">
              <Check className="h-3 w-3" />
            </span>
            <span className="text-sm leading-relaxed text-slate-300">{item}</span>
          </div>
        </RevealItem>
      ))}
    </RevealGroup>
  )
}
