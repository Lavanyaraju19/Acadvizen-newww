import Link from 'next/link'
import { ArrowRight, Layers } from 'lucide-react'
import { RevealGroup, RevealItem } from './Reveal'

// Real course_categories rows as navigable cards - no invented "learning paths" data model,
// this is the genuine category taxonomy already used to classify courses.
export default function CategoryNavigator({ categories = [], href = '/courses' }) {
  if (!categories.length) return null
  return (
    <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((category) => (
        <RevealItem key={category.slug || category.name} as="up">
          <Link
            href={href}
            className="group flex h-full flex-col justify-between rounded-2xl border border-white/8 bg-white/[0.02] p-6 transition hover:border-teal-300/25 hover:bg-white/[0.04]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-300/10 text-teal-200">
              <Layers className="h-4.5 w-4.5" />
            </span>
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-white sm:text-base">{category.name}</h3>
              {category.description ? <p className="mt-1.5 text-xs text-slate-500">{category.description}</p> : null}
            </div>
            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-300">
              Explore <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
            </span>
          </Link>
        </RevealItem>
      ))}
    </RevealGroup>
  )
}
