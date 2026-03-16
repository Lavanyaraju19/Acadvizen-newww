import Image from 'next/image'
import Link from 'next/link'
import { bodyClass, headingClass, imageStyle, normalizeContent, normalizeStyle, safeList, safeString, sectionInlineStyle, sectionPaddingClass, sectionVisibilityClass } from './sectionUtils'

export default function FeatureCardsSection({ section }) {
  const content = normalizeContent(section)
  const style = normalizeStyle(section)
  const cards = safeList(content.cards)
  if (!cards.length) return null
  const cardImageStyle = imageStyle(style)

  return (
    <section className={`${sectionPaddingClass(content, style)} ${sectionVisibilityClass(content)}`} style={sectionInlineStyle(content, style)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {content.heading ? <h2 className={`mb-6 font-semibold text-slate-50 ${headingClass(style)}`}>{safeString(content.heading)}</h2> : null}
        {content.subheading ? <p className={`mb-8 max-w-3xl whitespace-pre-line text-slate-300 ${bodyClass(style)}`}>{safeString(content.subheading)}</p> : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, index) => (
            <article key={`${safeString(card?.title)}-${index}`} className="rounded-2xl border border-white/10 bg-[var(--section-card-bg,rgba(255,255,255,0.03))] p-5">
              {card?.src ? (
                <div className="mb-4 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
                  <Image
                    src={safeString(card.src)}
                    alt={safeString(card.alt, card.title || `Card ${index + 1}`)}
                    width={640}
                    height={420}
                    className="h-44 w-full object-cover"
                    style={cardImageStyle}
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                </div>
              ) : null}
              {card?.title ? <h3 className="text-lg font-semibold text-slate-100">{safeString(card.title)}</h3> : null}
              {card?.text ? <p className="mt-2 whitespace-pre-line text-sm text-slate-300">{safeString(card.text)}</p> : null}
              {safeList(card?.list).length ? (
                <ul className="mt-4 space-y-2 text-sm text-slate-300">
                  {safeList(card.list).map((item, itemIndex) => (
                    <li key={`${safeString(item)}-${itemIndex}`} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                      {safeString(item)}
                    </li>
                  ))}
                </ul>
              ) : null}
              {card?.button?.href ? (
                <Link
                  href={card.button.href}
                  target={card.button.target || '_self'}
                  className="mt-4 inline-flex rounded-[var(--section-btn-radius,0.75rem)] border border-[var(--section-btn-border,transparent)] bg-[var(--section-btn-bg,#5eead4)] px-4 py-2 text-sm font-semibold text-[var(--section-btn-text,#020617)] hover:brightness-95"
                >
                  {safeString(card.button.label, 'Learn More')}
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
