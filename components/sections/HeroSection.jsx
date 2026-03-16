import Link from 'next/link'
import {
  bodyClass,
  headingClass,
  normalizeContent,
  normalizeStyle,
  safeList,
  safeString,
  sectionInlineStyle,
  sectionAlignClass,
  sectionPaddingClass,
  sectionVisibilityClass,
} from './sectionUtils'

export default function HeroSection({ section }) {
  const content = normalizeContent(section)
  const style = normalizeStyle(section)
  const buttons = safeList(content.buttons).length
    ? safeList(content.buttons)
    : content.button
      ? [content.button]
      : []
  const badges = safeList(content.badges).length
    ? safeList(content.badges)
    : content.badge
      ? [{ label: content.badge }]
      : []
  const bgImage = safeString(content.background_image)
  const inline = sectionInlineStyle(content, style)

  return (
    <section
      className={`relative overflow-hidden ${sectionPaddingClass(content, style)} ${sectionVisibilityClass(content)}`}
      style={
        bgImage
          ? { ...inline, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : inline
      }
    >
      <div className="absolute inset-0 bg-slate-950/60" aria-hidden="true" />
      <div className={`relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 ${sectionAlignClass(content, style)}`}>
        {badges.length ? (
          <div className="flex flex-wrap gap-3">
            {badges.map((badge, index) => (
              <p
                key={`${safeString(badge?.label || badge)}-${index}`}
                className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.18em] text-teal-200"
              >
                {safeString(badge?.label || badge)}
              </p>
            ))}
          </div>
        ) : null}
        <h1 className={`mt-4 font-semibold leading-tight text-slate-50 ${headingClass(style)}`}>
          {safeString(content.heading, section?.title || '')}
        </h1>
        {content.subheading || section?.description ? (
          <p className={`mx-auto mt-4 max-w-3xl whitespace-pre-line text-slate-300 ${bodyClass(style)}`}>
            {safeString(content.subheading, section?.description || '')}
          </p>
        ) : null}
        {buttons.length ? (
          <div className="mt-8 flex flex-wrap gap-3">
            {buttons.map((button, index) => (
              <Link
                key={`${button?.href || button?.label || index}`}
                href={button?.href || '#'}
                target={button?.target || '_self'}
                className={`rounded-[var(--section-btn-radius,0.75rem)] px-5 py-3 text-sm font-semibold transition ${
                  button?.variant === 'secondary'
                    ? 'border border-[var(--section-btn-border,rgba(255,255,255,0.2))] bg-white/5 text-slate-100 hover:bg-white/10'
                    : 'border border-[var(--section-btn-border,transparent)] bg-[var(--section-btn-bg,#5eead4)] text-[var(--section-btn-text,#020617)] hover:brightness-95'
                }`}
              >
                {button?.label || 'Learn More'}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
