import Image from 'next/image'
import Link from 'next/link'
import { bodyClass, headingClass, imageStyle, normalizeContent, normalizeStyle, safeList, safeString, sectionInlineStyle, sectionPaddingClass, sectionVisibilityClass } from './sectionUtils'

export default function ThreeColumnSection({ section }) {
  const content = normalizeContent(section)
  const style = normalizeStyle(section)
  const columns = safeList(content.columns)
  if (!columns.length) return null
  const columnImageStyle = imageStyle(style)

  return (
    <section className={`${sectionPaddingClass(content, style)} ${sectionVisibilityClass(content)}`} style={sectionInlineStyle(content, style)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {content.heading ? <h2 className={`mb-6 font-semibold text-slate-50 ${headingClass(style)}`}>{safeString(content.heading)}</h2> : null}
        {content.subheading ? <p className={`mb-8 max-w-3xl whitespace-pre-line text-slate-300 ${bodyClass(style)}`}>{safeString(content.subheading)}</p> : null}
        <div className="grid gap-4 md:grid-cols-3">
          {columns.map((column, index) => (
            <div key={`${safeString(column?.heading)}-${index}`} className="rounded-2xl border border-white/10 bg-[var(--section-card-bg,rgba(255,255,255,0.03))] p-5">
              {column?.src ? (
                <div className="mb-4 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
                  <Image
                    src={safeString(column.src)}
                    alt={safeString(column.alt, column.heading || `Column ${index + 1}`)}
                    width={640}
                    height={420}
                    className="h-40 w-full object-cover"
                    style={columnImageStyle}
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                </div>
              ) : null}
              {column?.heading ? <h3 className="text-lg font-semibold text-slate-50">{safeString(column.heading)}</h3> : null}
              {column?.text ? <p className="mt-2 whitespace-pre-line text-sm text-slate-300">{safeString(column.text)}</p> : null}
              {safeList(column?.list).length ? (
                <ul className="mt-4 space-y-2 text-sm text-slate-300">
                  {safeList(column.list).map((item, itemIndex) => (
                    <li key={`${safeString(item)}-${itemIndex}`} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                      {safeString(item)}
                    </li>
                  ))}
                </ul>
              ) : null}
              {column?.button?.href ? (
                <Link
                  href={column.button.href}
                  target={column.button.target || '_self'}
                  className="mt-4 inline-flex rounded-[var(--section-btn-radius,0.75rem)] border border-[var(--section-btn-border,transparent)] bg-[var(--section-btn-bg,#5eead4)] px-4 py-2 text-sm font-semibold text-[var(--section-btn-text,#020617)] hover:brightness-95"
                >
                  {safeString(column.button.label, 'Learn More')}
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
