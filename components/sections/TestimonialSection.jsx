import { bodyClass, headingClass, normalizeContent, normalizeStyle, safeList, safeString, sectionInlineStyle, sectionPaddingClass, sectionVisibilityClass } from './sectionUtils'

export default function TestimonialSection({ section }) {
  const content = normalizeContent(section)
  const style = normalizeStyle(section)
  const items = safeList(content.items)
  if (!items.length) return null

  return (
    <section className={`${sectionPaddingClass(content, style)} ${sectionVisibilityClass(content)}`} style={sectionInlineStyle(content, style)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {content.heading ? <h2 className={`mb-6 font-semibold text-slate-50 ${headingClass(style)}`}>{safeString(content.heading)}</h2> : null}
        {content.subheading ? <p className={`mb-8 max-w-3xl whitespace-pre-line text-slate-300 ${bodyClass(style)}`}>{safeString(content.subheading)}</p> : null}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <article key={`${safeString(item?.name)}-${index}`} className="rounded-2xl border border-white/10 bg-[var(--section-card-bg,rgba(255,255,255,0.03))] p-5">
              <p className="text-sm leading-relaxed text-slate-300">"{safeString(item?.quote)}"</p>
              <p className="mt-4 text-sm font-semibold text-slate-100">{safeString(item?.name)}</p>
              {item?.role ? <p className="text-xs text-slate-400">{safeString(item.role)}</p> : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
