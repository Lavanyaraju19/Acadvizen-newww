import Link from 'next/link'
import { ArrowUpRight, Clock, Sparkles } from 'lucide-react'
import { RevealGroup, RevealItem } from './Reveal'

// Premium horizontal course cards: index number, title, overview, metadata row, animated
// border-glow on hover. `emptyLabel` keeps the "never fabricate content" contract from the
// data layer - if no courses are published yet, say so plainly instead of rendering nothing.
export default function CourseShowcase({ courses = [], emptyLabel = 'Course details will appear here once published.', hrefBase = '/courses' }) {
  if (!courses.length) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>
  }

  return (
    <RevealGroup className="grid gap-5">
      {courses.map((course, index) => (
        <RevealItem key={course.slug} as="up">
          <Link
            href={`${hrefBase}/${course.slug}`}
            className="group relative grid gap-6 overflow-hidden rounded-3xl border border-white/8 bg-white/[0.02] p-6 transition duration-300 hover:border-teal-300/30 hover:bg-white/[0.04] sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-8"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: 'radial-gradient(420px 200px at 0% 0%, rgba(94,234,212,0.08), transparent 65%)' }}
            />
            <span className="immersive-display relative text-4xl font-bold text-white/10 transition group-hover:text-teal-300/25 sm:text-5xl">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="relative">
              <h3 className="text-lg font-semibold text-white sm:text-xl">{course.title}</h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
                {course.short_description || course.overview || 'Live projects, mentor reviews, and portfolio-ready outcomes.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-teal-300/70" />
                  {course.duration || 'Flexible schedule'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-teal-300/70" />
                  Placement support included
                </span>
              </div>
            </div>
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 text-slate-300 transition group-hover:border-teal-300/40 group-hover:bg-teal-300/10 group-hover:text-teal-200">
              <ArrowUpRight className="h-4 w-4 transition group-hover:rotate-45" />
            </span>
          </Link>
        </RevealItem>
      ))}
    </RevealGroup>
  )
}
