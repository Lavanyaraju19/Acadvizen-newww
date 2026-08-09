import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { RevealGroup, RevealItem } from './Reveal'

// Replaces the old "link | link | link" internal-links list with three labeled card columns.
export default function ResourceGrid({ groups = [] }) {
  const visible = groups.filter((group) => group.items?.length)
  if (!visible.length) return null

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{group.label}</p>
          {group.items?.length ? (
            <RevealGroup className="mt-4 space-y-2.5">
              {group.items.map((item) => (
                <RevealItem key={item.href} as="up">
                  <Link
                    href={item.href}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-slate-300 transition hover:border-teal-300/25 hover:text-white"
                  >
                    <span className="truncate">{item.title}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-teal-300" />
                  </Link>
                </RevealItem>
              ))}
            </RevealGroup>
          ) : (
            <p className="mt-4 text-sm text-slate-600">Nothing published here yet.</p>
          )}
        </div>
      ))}
    </div>
  )
}
