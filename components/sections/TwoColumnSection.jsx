import { headingClass, normalizeContent, normalizeStyle, safeList, safeString, sectionInlineStyle, sectionPaddingClass, sectionVisibilityClass } from './sectionUtils'

function ColumnBlock({ block }) {
  if (!block || typeof block !== 'object') return null
  const list = safeList(block.list)
  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--section-card-bg,rgba(255,255,255,0.03))] p-6">
      {block.heading ? <h3 className="text-xl font-semibold text-slate-50">{safeString(block.heading)}</h3> : null}
      {block.text ? <p className="mt-3 whitespace-pre-line text-slate-300">{safeString(block.text)}</p> : null}
      {list.length ? (
        <ul className="mt-4 space-y-2 text-sm text-slate-300">
          {list.map((item, index) => (
            <li key={`${safeString(item)}-${index}`} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
              {safeString(item)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export default function TwoColumnSection({ section }) {
  const content = normalizeContent(section)
  const style = normalizeStyle(section)

  return (
    <section className={`${sectionPaddingClass(content, style)} ${sectionVisibilityClass(content)}`} style={sectionInlineStyle(content, style)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {content.heading ? <h2 className={`mb-6 font-semibold text-slate-50 ${headingClass(style)}`}>{safeString(content.heading)}</h2> : null}
        <div className="grid gap-5 md:grid-cols-2">
          <ColumnBlock block={content.left} />
          <ColumnBlock block={content.right} />
        </div>
      </div>
    </section>
  )
}
