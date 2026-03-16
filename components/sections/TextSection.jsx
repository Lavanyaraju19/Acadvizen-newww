import {
  bodyClass,
  headingClass,
  normalizeContent,
  normalizeStyle,
  safeList,
  safeString,
  sectionAlignClass,
  sectionInlineStyle,
  sectionPaddingClass,
  sectionVisibilityClass,
} from './sectionUtils'

export default function TextSection({ section }) {
  const content = normalizeContent(section)
  const style = normalizeStyle(section)
  const list = safeList(content.list)

  return (
    <section className={`${sectionPaddingClass(content, style)} ${sectionVisibilityClass(content)}`} style={sectionInlineStyle(content, style)}>
      <div className={`mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 ${sectionAlignClass(content, style)}`}>
        {content.heading ? <h2 className={`font-semibold text-slate-50 ${headingClass(style)}`}>{content.heading}</h2> : null}
        {content.text ? <p className={`mt-4 whitespace-pre-line leading-relaxed text-slate-300 ${bodyClass(style)}`}>{safeString(content.text)}</p> : null}
        {list.length ? (
          <ul className="mt-5 space-y-2 text-slate-300">
            {list.map((item, index) => (
              <li key={`${safeString(item)}-${index}`} className="rounded-lg border border-white/10 bg-[var(--section-card-bg,rgba(255,255,255,0.03))] px-4 py-2">
                {safeString(item)}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}
