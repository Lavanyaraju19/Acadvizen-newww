import Link from 'next/link'
import {
  bodyClass,
  headingClass,
  normalizeContent,
  normalizeStyle,
  safeString,
  sectionAlignClass,
  sectionInlineStyle,
  sectionPaddingClass,
  sectionVisibilityClass,
} from './sectionUtils'

export default function CtaBannerSection({ section }) {
  const content = normalizeContent(section)
  const style = normalizeStyle(section)
  return (
    <section className={`${sectionPaddingClass(content, style)} ${sectionVisibilityClass(content)}`} style={sectionInlineStyle(content, style)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className={`rounded-3xl border border-white/10 bg-gradient-to-r from-cyan-500/20 to-sky-500/20 p-8 ${sectionAlignClass(content, style)}`}>
          {content.heading ? <h2 className={`font-semibold text-slate-50 ${headingClass(style)}`}>{safeString(content.heading)}</h2> : null}
          {content.text ? <p className={`mt-3 whitespace-pre-line text-slate-300 ${bodyClass(style)}`}>{safeString(content.text)}</p> : null}
          {content.button?.href ? (
            <Link href={content.button.href} target={content.button.target || '_self'} className="mt-6 inline-flex rounded-[var(--section-btn-radius,0.75rem)] border border-[var(--section-btn-border,transparent)] bg-[var(--section-btn-bg,#5eead4)] px-5 py-3 text-sm font-semibold text-[var(--section-btn-text,#020617)] hover:brightness-95">
              {safeString(content.button.label, 'Get Started')}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}
