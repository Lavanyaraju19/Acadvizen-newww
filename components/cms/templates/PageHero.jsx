import Breadcrumbs from './Breadcrumbs'

// Universal hero section used by every CMS-driven page template (City, Location, Service,
// Resource, and any future content type) so a newly published page automatically matches the
// hand-built pages' hero treatment instead of admins/renderers reinventing one per page.
export default function PageHero({
  eyebrow,
  title,
  subtitle,
  imageUrl,
  imageAlt,
  breadcrumbs = [],
  primaryCta,
  secondaryCta,
}) {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-teal-400/10 blur-3xl" />
      </div>

      <Breadcrumbs items={breadcrumbs} />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className={`grid gap-10 ${imageUrl ? 'lg:grid-cols-2 lg:items-center' : ''}`}>
          <div className={imageUrl ? '' : 'mx-auto max-w-3xl text-center'}>
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">{eyebrow}</p>
            ) : null}
            <h1 className="mt-3 text-3xl font-bold text-slate-50 sm:text-4xl lg:text-5xl" style={{ textWrap: 'balance' }}>
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">{subtitle}</p>
            ) : null}
            {(primaryCta || secondaryCta) ? (
              <div className={`mt-8 flex flex-wrap gap-3 ${imageUrl ? '' : 'justify-center'}`}>
                {primaryCta ? (
                  <a
                    href={primaryCta.href}
                    className="rounded-xl bg-teal-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-200"
                  >
                    {primaryCta.label}
                  </a>
                ) : null}
                {secondaryCta ? (
                  <a
                    href={secondaryCta.href}
                    className="rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.05]"
                  >
                    {secondaryCta.label}
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>

          {imageUrl ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
              {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary CMS-supplied image URL, no guaranteed next/image host allowlist entry */}
              <img src={imageUrl} alt={imageAlt || title || ''} loading="lazy" className="h-full w-full object-cover" />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
