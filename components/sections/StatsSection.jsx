import { bodyClass, headingClass, normalizeContent, normalizeStyle, safeList, safeString, sectionInlineStyle, sectionPaddingClass, sectionVisibilityClass } from './sectionUtils'

export default function StatsSection({ section }) {
  const content = normalizeContent(section)
  const style = normalizeStyle(section)
  const stats = safeList(content.stats)
  if (!stats.length) return null

  return (
    <section className={`${sectionPaddingClass(content, style)} ${sectionVisibilityClass(content)}`} style={sectionInlineStyle(content, style)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {content.heading ? <h2 className={`mb-6 text-center font-semibold text-slate-50 ${headingClass(style)}`}>{safeString(content.heading)}</h2> : null}
        {content.subheading ? <p className={`mx-auto mb-8 max-w-3xl text-center whitespace-pre-line text-slate-300 ${bodyClass(style)}`}>{safeString(content.subheading)}</p> : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item, index) => (
            <div key={`${safeString(item?.label)}-${index}`} className="rounded-2xl border border-white/10 bg-[var(--section-card-bg,rgba(255,255,255,0.03))] p-5 text-center">
              <div className="text-3xl font-bold text-teal-200">{safeString(item?.value)}</div>
              <div className="mt-2 text-sm text-slate-300">{safeString(item?.label)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
