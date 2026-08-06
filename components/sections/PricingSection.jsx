import Link from 'next/link'
import { bodyClass, headingClass, normalizeContent, normalizeStyle, safeList, safeString, sectionInlineStyle, sectionPaddingClass, sectionVisibilityClass } from './sectionUtils'

export default function PricingSection({ section }) {
  const content = normalizeContent(section)
  const style = normalizeStyle(section)
  const plans = safeList(content.plans)
  if (!plans.length) return null

  return (
    <section className={`${sectionPaddingClass(content, style)} ${sectionVisibilityClass(content)}`} style={sectionInlineStyle(content, style)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {content.heading ? <h2 className={`mb-6 text-center font-semibold text-slate-50 ${headingClass(style)}`}>{safeString(content.heading)}</h2> : null}
        {content.subheading ? (
          <p className={`mx-auto mb-10 max-w-3xl text-center whitespace-pre-line text-slate-300 ${bodyClass(style)}`}>{safeString(content.subheading)}</p>
        ) : null}
        <div className={`grid gap-6 ${plans.length >= 3 ? 'md:grid-cols-3' : plans.length === 2 ? 'md:grid-cols-2' : ''}`}>
          {plans.map((plan, index) => {
            const features = safeList(plan?.features)
            const highlighted = Boolean(plan?.highlighted)
            return (
              <article
                key={`${safeString(plan?.name)}-${index}`}
                className={`flex flex-col rounded-2xl border p-6 ${
                  highlighted
                    ? 'border-teal-400/40 bg-teal-500/10 ring-1 ring-teal-400/30'
                    : 'border-white/10 bg-[var(--section-card-bg,rgba(255,255,255,0.03))]'
                }`}
              >
                {plan?.badge ? (
                  <span className="mb-3 inline-flex w-fit rounded-full bg-teal-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-200">
                    {safeString(plan.badge)}
                  </span>
                ) : null}
                {plan?.name ? <h3 className="text-lg font-semibold text-slate-100">{safeString(plan.name)}</h3> : null}
                <div className="mt-3 flex items-baseline gap-1">
                  {plan?.price ? <span className="text-3xl font-bold text-slate-50">{safeString(plan.price)}</span> : null}
                  {plan?.period ? <span className="text-sm text-slate-400">/{safeString(plan.period)}</span> : null}
                </div>
                {plan?.description ? <p className="mt-3 text-sm text-slate-300">{safeString(plan.description)}</p> : null}
                {features.length ? (
                  <ul className="mt-5 space-y-2 text-sm text-slate-300">
                    {features.map((feature, featureIndex) => (
                      <li key={`${safeString(feature)}-${featureIndex}`} className="flex items-start gap-2">
                        <span className="mt-0.5 text-teal-300">&#10003;</span>
                        <span>{safeString(feature)}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {plan?.button?.href ? (
                  <Link
                    href={plan.button.href}
                    target={plan.button.target || '_self'}
                    className={`mt-6 inline-flex justify-center rounded-[var(--section-btn-radius,0.75rem)] px-4 py-2.5 text-sm font-semibold ${
                      highlighted
                        ? 'bg-[var(--section-btn-bg,#5eead4)] text-[var(--section-btn-text,#020617)] hover:brightness-95'
                        : 'border border-white/15 text-slate-100 hover:bg-white/[0.05]'
                    }`}
                  >
                    {safeString(plan.button.label, 'Get Started')}
                  </Link>
                ) : null}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
