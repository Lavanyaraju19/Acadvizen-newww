import { bodyClass, headingClass, normalizeContent, normalizeStyle, safeString, sectionInlineStyle, sectionPaddingClass, sectionVisibilityClass } from './sectionUtils'

export default function RichTextSection({ section }) {
  const content = normalizeContent(section)
  const style = normalizeStyle(section)
  const text = safeString(content.text)
  if (!text) return null

  return (
    <section className={`${sectionPaddingClass(content, style)} ${sectionVisibilityClass(content)}`} style={sectionInlineStyle(content, style)}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {content.heading ? <h2 className={`mb-4 font-semibold text-slate-50 ${headingClass(style)}`}>{safeString(content.heading)}</h2> : null}
        <div className="space-y-4">
          {text
            .split(/\n{2,}/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
            .map((paragraph, index) => (
              <p key={`${paragraph.slice(0, 20)}-${index}`} className={`whitespace-pre-line leading-relaxed text-slate-300 ${bodyClass(style)}`}>
                {paragraph}
              </p>
            ))}
        </div>
      </div>
    </section>
  )
}
