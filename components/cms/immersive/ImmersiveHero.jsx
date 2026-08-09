import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import Reveal, { RevealGroup, RevealItem } from './Reveal'

// Large split hero: editorial headline + breadcrumb/eyebrow/CTAs on the left, a floating
// glass "availability" panel with live stat chips on the right. No hero image dependency -
// every location/course record has text data, not all have imagery, so the right panel is
// built from data that's always present (stats + badges) rather than a photo.
export default function ImmersiveHero({
  eyebrow,
  title,
  description,
  breadcrumbs = [],
  primaryCta,
  secondaryCta,
  badges = [],
  stats = [],
  locationLabel,
}) {
  return (
    <section className="immersive-mesh-bg relative overflow-hidden border-b border-white/5">
      <span className="immersive-glow-blob left-[-8%] top-[-15%] h-[420px] w-[420px]" style={{ background: 'rgba(94, 234, 212, 0.5)' }} aria-hidden="true" />
      <span className="immersive-glow-blob right-[-10%] top-[10%] h-[380px] w-[380px]" style={{ background: 'rgba(96, 165, 250, 0.45)' }} aria-hidden="true" />
      <div className="immersive-grid-bg absolute inset-0 z-0 opacity-40" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-28 sm:pt-32 lg:px-8 lg:pb-28">
        {breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.label} className="flex items-center gap-1.5">
                {index > 0 ? <span className="text-slate-700">/</span> : null}
                {crumb.href ? (
                  <Link href={crumb.href} className="transition hover:text-teal-300">{crumb.label}</Link>
                ) : (
                  <span className="text-slate-300">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : null}

        <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            {eyebrow ? (
              <Reveal as="up">
                <span className="immersive-eyebrow inline-flex items-center gap-2 rounded-full border border-teal-300/25 bg-teal-300/[0.06] px-4 py-1.5 text-[11px] font-semibold uppercase text-teal-200">
                  {locationLabel ? <MapPin className="h-3 w-3" /> : null}
                  {eyebrow}
                </span>
              </Reveal>
            ) : null}

            <Reveal as="up" delay={0.08}>
              <h1 className="immersive-display mt-6 text-4xl font-semibold leading-[1.05] text-white [text-wrap:balance] sm:text-5xl lg:text-6xl">
                {title}
              </h1>
            </Reveal>

            {description ? (
              <Reveal as="up" delay={0.16}>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">{description}</p>
              </Reveal>
            ) : null}

            {badges.length > 0 ? (
              <RevealGroup className="mt-7 flex flex-wrap gap-2.5">
                {badges.map((badge) => (
                  <RevealItem key={badge} as="scale">
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-slate-300">
                      {badge}
                    </span>
                  </RevealItem>
                ))}
              </RevealGroup>
            ) : null}

            {(primaryCta || secondaryCta) ? (
              <Reveal as="up" delay={0.24} className="mt-9 flex flex-wrap items-center gap-4">
                {primaryCta ? (
                  <Link
                    href={primaryCta.href}
                    className="group inline-flex items-center gap-2 rounded-full bg-teal-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-200"
                  >
                    {primaryCta.label}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </Link>
                ) : null}
                {secondaryCta ? (
                  <Link
                    href={secondaryCta.href}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:bg-white/[0.04]"
                  >
                    {secondaryCta.label}
                  </Link>
                ) : null}
              </Reveal>
            ) : null}
          </div>

          {stats.length > 0 ? (
            <Reveal as="scale" delay={0.2} className="relative">
              <div className="immersive-glass-strong relative rounded-3xl p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] sm:p-8">
                <div className="immersive-hairline absolute inset-x-6 top-0" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">At a glance</p>
                <div className="mt-5 grid grid-cols-2 gap-5">
                  {stats.map((stat) => (
                    <div key={stat.label} className="relative">
                      <div className="immersive-display text-2xl font-bold text-white sm:text-3xl">{stat.value}</div>
                      <div className="mt-1 text-xs leading-tight text-slate-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 -z-10 h-full w-full rounded-3xl border border-white/5" />
            </Reveal>
          ) : null}
        </div>
      </div>

      <div className="relative z-10 flex justify-center pb-6">
        <span className="flex h-9 w-6 items-start justify-center rounded-full border border-white/15 p-1.5">
          <span className="h-1.5 w-1 animate-bounce rounded-full bg-teal-300" />
        </span>
      </div>
    </section>
  )
}
