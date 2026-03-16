import {
  headingClass,
  normalizeContent,
  normalizeStyle,
  safeList,
  safeString,
  sectionInlineStyle,
  sectionPaddingClass,
  sectionVisibilityClass,
} from './sectionUtils'

export default function FaqSection({ section }) {
  const content = normalizeContent(section)
  const style = normalizeStyle(section)
  const items = safeList(content.items)
  if (!items.length) return null

  return (
    <section className={`${sectionPaddingClass(content, style)} ${sectionVisibilityClass(content)}`} style={sectionInlineStyle(content, style)}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {content.heading ? <h2 className={`mb-6 font-semibold text-slate-50 ${headingClass(style)}`}>{safeString(content.heading)}</h2> : null}
        <div className="space-y-3">
          {items.map((faq, index) => (
            <details key={`${safeString(faq?.question)}-${index}`} className="rounded-xl border border-white/10 bg-[var(--section-card-bg,rgba(255,255,255,0.03))] p-4">
              <summary className="cursor-pointer text-sm font-semibold text-slate-100">{safeString(faq?.question)}</summary>
              <p className="mt-3 whitespace-pre-line text-sm text-slate-300">{safeString(faq?.answer)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
