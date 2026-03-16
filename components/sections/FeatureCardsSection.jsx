import { headingClass, normalizeContent, normalizeStyle, safeList, safeString, sectionInlineStyle, sectionPaddingClass, sectionVisibilityClass } from './sectionUtils'

export default function FeatureCardsSection({ section }) {
  const content = normalizeContent(section)
  const style = normalizeStyle(section)
  const cards = safeList(content.cards)
  if (!cards.length) return null

  return (
    <section className={`${sectionPaddingClass(content, style)} ${sectionVisibilityClass(content)}`} style={sectionInlineStyle(content, style)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {content.heading ? <h2 className={`mb-6 font-semibold text-slate-50 ${headingClass(style)}`}>{safeString(content.heading)}</h2> : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, index) => (
            <article key={`${safeString(card?.title)}-${index}`} className="rounded-2xl border border-white/10 bg-[var(--section-card-bg,rgba(255,255,255,0.03))] p-5">
              {card?.title ? <h3 className="text-lg font-semibold text-slate-100">{safeString(card.title)}</h3> : null}
              {card?.text ? <p className="mt-2 whitespace-pre-line text-sm text-slate-300">{safeString(card.text)}</p> : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
