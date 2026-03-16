import Image from 'next/image'
import { imageStyle, normalizeContent, normalizeStyle, safeString, sectionInlineStyle, sectionPaddingClass, sectionVisibilityClass } from './sectionUtils'

export default function ImageSection({ section }) {
  const content = normalizeContent(section)
  const style = normalizeStyle(section)
  const src = safeString(content.src)
  if (!src) return null

  const height = Number(content.height) || 520
  const width = Number(content.width) || 1200
  const objectFit = style.image_fit || content.object_fit || 'cover'
  const customImageStyle = imageStyle(style)

  return (
    <section className={`${sectionPaddingClass(content, style)} ${sectionVisibilityClass(content)}`} style={sectionInlineStyle(content, style)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[var(--section-card-bg,rgba(255,255,255,0.03))]">
          <Image
            src={src}
            alt={safeString(content.alt, section?.title || 'Section image')}
            width={width}
            height={height}
            className="h-auto w-full"
            style={{ objectFit, ...customImageStyle }}
            sizes="(max-width: 1024px) 100vw, 1200px"
          />
        </div>
        {content.caption ? <p className="mt-3 text-sm text-slate-400">{safeString(content.caption)}</p> : null}
      </div>
    </section>
  )
}
