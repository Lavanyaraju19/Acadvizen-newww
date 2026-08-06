import { bodyClass, headingClass, normalizeContent, normalizeStyle, safeString, sectionInlineStyle, sectionPaddingClass, sectionVisibilityClass } from './sectionUtils'

export default function MapSection({ section }) {
  const content = normalizeContent(section)
  const style = normalizeStyle(section)
  const embedUrl = safeString(content.embed_url)
  const address = safeString(content.address)
  if (!embedUrl && !address) return null

  const directionsHref = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : ''

  return (
    <section className={`${sectionPaddingClass(content, style)} ${sectionVisibilityClass(content)}`} style={sectionInlineStyle(content, style)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {content.heading ? <h2 className={`mb-4 font-semibold text-slate-50 ${headingClass(style)}`}>{safeString(content.heading)}</h2> : null}
        {content.subheading ? <p className={`mb-6 max-w-3xl whitespace-pre-line text-slate-300 ${bodyClass(style)}`}>{safeString(content.subheading)}</p> : null}
        <div className="grid gap-6 md:grid-cols-[1fr_320px]">
          {embedUrl ? (
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <iframe
                src={embedUrl}
                title={safeString(content.heading, 'Location map')}
                className="h-80 w-full md:h-96"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : null}
          {address ? (
            <div className="flex flex-col justify-center rounded-2xl border border-white/10 bg-[var(--section-card-bg,rgba(255,255,255,0.03))] p-5">
              <p className="whitespace-pre-line text-sm text-slate-300">{address}</p>
              {directionsHref ? (
                <a
                  href={directionsHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex w-fit rounded-[var(--section-btn-radius,0.75rem)] bg-[var(--section-btn-bg,#5eead4)] px-4 py-2 text-sm font-semibold text-[var(--section-btn-text,#020617)] hover:brightness-95"
                >
                  Get Directions
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
