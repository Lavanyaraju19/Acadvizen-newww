import { Quote, Star } from 'lucide-react'
import { RevealGroup, RevealItem } from './Reveal'
import SafeImage from './SafeImage'

const TINTS = [
  'border-teal-300/20 bg-teal-300/[0.05]',
  'border-blue-300/20 bg-blue-300/[0.05]',
  'border-violet-300/20 bg-violet-300/[0.05]',
]

function Stars({ rating }) {
  const value = Number(rating)
  if (!Number.isFinite(value) || value <= 0) return null
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < value ? 'fill-amber-300 text-amber-300' : 'text-white/15'}`} />
      ))}
    </div>
  )
}

function Avatar({ testimonial, size = 'h-10 w-10' }) {
  return (
    <SafeImage
      src={testimonial.image_url}
      alt={testimonial.name || ''}
      className={`${size} shrink-0 rounded-full border border-white/10 object-cover`}
      fallback={
        <span className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-teal-300/15 text-sm font-semibold text-teal-200`}>
          {(testimonial.name || 'S').charAt(0)}
        </span>
      }
    />
  )
}

// Editorial testimonial layout: one featured quote (large, magazine-style) plus a supporting
// grid of shorter cards, each tinted a different accent so the wall doesn't read as one uniform
// grid. Uses real `image_url`/`company`/`rating` columns already collected by admins but
// previously unused by this component.
export default function TestimonialGrid({ testimonials = [], emptyLabel = 'Testimonials will appear here once published.' }) {
  if (!testimonials.length) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>
  }

  const [featured, ...rest] = testimonials

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <RevealItem as="left" className="lg:col-span-3">
        <figure className="immersive-glass-strong relative flex h-full flex-col justify-between rounded-3xl p-8 sm:p-10">
          <div className="flex items-start justify-between gap-4">
            <Quote className="h-8 w-8 text-teal-300/40" />
            <Stars rating={featured.rating} />
          </div>
          <blockquote className="mt-6 text-xl font-medium leading-relaxed text-white [text-wrap:balance] sm:text-2xl">
            &ldquo;{featured.quote || featured.message}&rdquo;
          </blockquote>
          <figcaption className="mt-8 flex items-center gap-3">
            <Avatar testimonial={featured} />
            <div>
              <div className="text-sm font-semibold text-white">{featured.name || 'Student'}</div>
              {(featured.role || featured.company) ? (
                <div className="text-xs text-slate-400">
                  {featured.role}
                  {featured.role && featured.company ? ' · ' : ''}
                  {featured.company}
                </div>
              ) : null}
            </div>
          </figcaption>
        </figure>
      </RevealItem>

      <RevealGroup className="grid gap-5 lg:col-span-2">
        {rest.slice(0, 3).map((item, index) => (
          <RevealItem key={item.id || item.name} as="right">
            <figure className={`rounded-2xl border p-6 backdrop-blur-sm transition hover:border-teal-300/25 ${TINTS[index % TINTS.length]}`}>
              <Stars rating={item.rating} />
              <blockquote className="mt-3 text-sm leading-relaxed text-slate-300">&ldquo;{item.quote || item.message}&rdquo;</blockquote>
              <figcaption className="mt-4 flex items-center gap-2.5">
                <Avatar testimonial={item} size="h-7 w-7" />
                <span className="text-xs font-semibold text-white">
                  {item.name || 'Student'}
                  {item.company ? <span className="font-normal text-slate-500"> &middot; {item.company}</span> : item.role ? <span className="font-normal text-slate-500"> &middot; {item.role}</span> : null}
                </span>
              </figcaption>
            </figure>
          </RevealItem>
        ))}
      </RevealGroup>
    </div>
  )
}
