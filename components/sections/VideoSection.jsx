import { headingClass, normalizeContent, normalizeStyle, safeString, sectionInlineStyle, sectionPaddingClass, sectionVisibilityClass } from './sectionUtils'

export default function VideoSection({ section }) {
  const content = normalizeContent(section)
  const style = normalizeStyle(section)
  const embedUrl = safeString(content.embed_url || content.url)
  if (!embedUrl) return null

  const aspectRatio = safeString(content.aspect_ratio || '16 / 9')
  const autoplay = content.autoplay === true
  const src = autoplay && !embedUrl.includes('autoplay=1') ? `${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1&mute=1` : embedUrl

  return (
    <section className={`${sectionPaddingClass(content, style)} ${sectionVisibilityClass(content)}`} style={sectionInlineStyle(content, style)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {content.heading ? <h2 className={`mb-4 font-semibold text-slate-50 ${headingClass(style)}`}>{content.heading}</h2> : null}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-black" style={{ aspectRatio }}>
          <iframe
            src={src}
            title={safeString(content.title || section?.title || 'Video')}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  )
}
