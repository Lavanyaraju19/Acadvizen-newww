import { Briefcase } from 'lucide-react'
import { RevealGroup, RevealItem } from './Reveal'

// Alumni-style placement cards: company as the headline (matches how the existing placement
// data is structured - company_name/company + role), glass surface, hover lift.
export default function PlacementShowcase({ placements = [], emptyLabel = 'Placement updates will appear here once published.' }) {
  if (!placements.length) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>
  }

  return (
    <RevealGroup className="grid gap-4 sm:grid-cols-2">
      {placements.map((placement) => (
        <RevealItem key={placement.id} as="up">
          <div className="immersive-glass group flex items-center gap-4 rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-teal-300/25">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-300/10 text-teal-200">
              <Briefcase className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">
                {placement.company_name || placement.company || 'Placement partner'}
              </div>
              <div className="mt-0.5 truncate text-xs text-slate-400">{placement.role || 'Marketing Role'}</div>
            </div>
          </div>
        </RevealItem>
      ))}
    </RevealGroup>
  )
}
