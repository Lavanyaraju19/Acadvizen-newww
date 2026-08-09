import { Quote } from 'lucide-react'
import { RevealGroup, RevealItem } from './Reveal'

// Editorial testimonial layout, not a slider: one featured quote (large, magazine-style) plus
// a supporting grid of shorter cards. Falls back gracefully with the first item promoted.
export default function TestimonialGrid({ testimonials = [], emptyLabel = 'Testimonials will appear here once published.' }) {
  if (!testimonials.length) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>
  }

  const [featured, ...rest] = testimonials

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <RevealItem as="left" className="lg:col-span-3">
        <figure className="immersive-glass-strong relative flex h-full flex-col justify-between rounded-3xl p-8 sm:p-10">
          <Quote className="h-8 w-8 text-teal-300/40" />
          <blockquote className="mt-6 text-xl font-medium leading-relaxed text-white [text-wrap:balance] sm:text-2xl">
            &ldquo;{featured.quote || featured.message}&rdquo;
          </blockquote>
          <figcaption className="mt-8 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-300/15 text-sm font-semibold text-teal-200">
              {(featured.name || 'S').charAt(0)}
            </span>
            <div>
              <div className="text-sm font-semibold text-white">{featured.name || 'Student'}</div>
              {featured.role ? <div className="text-xs text-slate-400">{featured.role}</div> : null}
            </div>
          </figcaption>
        </figure>
      </RevealItem>

      <RevealGroup className="grid gap-5 lg:col-span-2">
        {rest.slice(0, 3).map((item) => (
          <RevealItem key={item.id || item.name} as="right">
            <figure className="immersive-glass rounded-2xl p-6 transition hover:border-teal-300/25">
              <blockquote className="text-sm leading-relaxed text-slate-300">&ldquo;{item.quote || item.message}&rdquo;</blockquote>
              <figcaption className="mt-4 text-xs font-semibold text-white">
                {item.name || 'Student'}
                {item.role ? <span className="font-normal text-slate-500"> &middot; {item.role}</span> : null}
              </figcaption>
            </figure>
          </RevealItem>
        ))}
      </RevealGroup>
    </div>
  )
}
