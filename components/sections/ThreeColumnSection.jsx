import { headingClass, normalizeContent, normalizeStyle, safeList, safeString, sectionInlineStyle, sectionPaddingClass, sectionVisibilityClass } from './sectionUtils'

export default function ThreeColumnSection({ section }) {
  const content = normalizeContent(section)
  const style = normalizeStyle(section)
  const columns = safeList(content.columns)
  if (!columns.length) return null

  return (
    <section className={`${sectionPaddingClass(content, style)} ${sectionVisibilityClass(content)}`} style={sectionInlineStyle(content, style)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {content.heading ? <h2 className={`mb-6 font-semibold text-slate-50 ${headingClass(style)}`}>{safeString(content.heading)}</h2> : null}
        <div className="grid gap-4 md:grid-cols-3">
          {columns.map((column, index) => (
            <div key={`${safeString(column?.heading)}-${index}`} className="rounded-2xl border border-white/10 bg-[var(--section-card-bg,rgba(255,255,255,0.03))] p-5">
              {column?.heading ? <h3 className="text-lg font-semibold text-slate-50">{safeString(column.heading)}</h3> : null}
              {column?.text ? <p className="mt-2 whitespace-pre-line text-sm text-slate-300">{safeString(column.text)}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
