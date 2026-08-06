import { bodyClass, headingClass, normalizeContent, normalizeStyle, safeString, sectionInlineStyle, sectionPaddingClass, sectionVisibilityClass } from './sectionUtils'

export default function RichTextSection({ section }) {
  const content = normalizeContent(section)
  const style = normalizeStyle(section)
  const html = safeString(content.html)
  const text = safeString(content.text)
  if (!html && !text) return null

  return (
    <section className={`${sectionPaddingClass(content, style)} ${sectionVisibilityClass(content)}`} style={sectionInlineStyle(content, style)}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {content.heading ? <h2 className={`mb-4 font-semibold text-slate-50 ${headingClass(style)}`}>{safeString(content.heading)}</h2> : null}
        {html ? (
          // `html` is only ever set by an admin through the page builder (same trust
          // boundary as the rest of a page's authored content) - this is what actually makes
          // the "Custom HTML" section type live up to its name. Plain `text` (below) stays
          // the safe default for ordinary paragraph content.
          <div
            className={`prose prose-invert max-w-none leading-relaxed text-slate-300 ${bodyClass(style)}`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
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
        )}
      </div>
    </section>
  )
}
