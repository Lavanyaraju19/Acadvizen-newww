import { Briefcase, MapPin, Wallet } from 'lucide-react'
import { RevealGroup, RevealItem } from './Reveal'
import SafeImage from './SafeImage'

// Placement/success-story cards backed by the real `placements` table - title, company_name,
// role, location, salary/package, description, featured_image (placement/student photo),
// company_logo and accent_color are all real admin-editable columns (Admin > Trust & Conversion
// > Placement Records) that the earlier "company name + role" card was leaving unused.
export default function PlacementShowcase({ placements = [], emptyLabel = 'Placement updates will appear here once published.' }) {
  if (!placements.length) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>
  }

  return (
    <RevealGroup className="grid gap-5 sm:grid-cols-2">
      {placements.map((placement) => {
        const accent = placement.accent_color || null
        const packageLabel = placement.salary || placement.package
        return (
          <RevealItem key={placement.id} as="up">
            <div
              className="immersive-glass group flex h-full flex-col overflow-hidden rounded-2xl transition hover:-translate-y-0.5 hover:border-teal-300/25"
              style={accent ? { borderTopColor: accent, borderTopWidth: '3px' } : undefined}
            >
              {placement.featured_image ? (
                <div className="flex h-40 w-full items-center justify-center overflow-hidden bg-white/[0.02]">
                  <SafeImage
                    src={placement.featured_image}
                    alt={placement.title || placement.company_name || 'Placement'}
                    className="h-full w-full object-cover"
                    fallback={<Briefcase className="h-8 w-8 text-white/10" />}
                  />
                </div>
              ) : null}
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-center gap-3">
                  {placement.company_logo ? (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] p-1.5">
                      <SafeImage
                        src={placement.company_logo}
                        alt={placement.company_name || ''}
                        className="max-h-full w-auto max-w-full object-contain"
                        fallback={<Briefcase className="h-4 w-4 text-teal-200" />}
                      />
                    </div>
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-300/10 text-teal-200">
                      <Briefcase className="h-4 w-4" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">
                      {placement.title || `${placement.role || 'Marketing Role'} at ${placement.company_name || 'Hiring Partner'}`}
                    </div>
                    <div className="truncate text-xs text-slate-400">
                      {placement.company_name}
                      {placement.role && placement.title ? ` · ${placement.role}` : ''}
                    </div>
                  </div>
                </div>

                {placement.description ? (
                  <p className="line-clamp-3 text-xs leading-relaxed text-slate-400">{placement.description}</p>
                ) : null}

                {(placement.location || packageLabel) ? (
                  <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    {placement.location ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-400">
                        <MapPin className="h-3 w-3 text-teal-300/70" />
                        {placement.location}
                      </span>
                    ) : null}
                    {packageLabel ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-300/20 bg-teal-300/[0.06] px-2.5 py-1 text-[11px] font-medium text-teal-200">
                        <Wallet className="h-3 w-3" />
                        {packageLabel}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </RevealItem>
        )
      })}
    </RevealGroup>
  )
}
