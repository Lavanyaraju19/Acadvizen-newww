import Image from 'next/image'
import { headingClass, imageStyle, normalizeContent, normalizeStyle, safeList, safeString, sectionInlineStyle, sectionPaddingClass, sectionVisibilityClass } from './sectionUtils'

export default function GallerySection({ section }) {
  const content = normalizeContent(section)
  const style = normalizeStyle(section)
  const items = safeList(content.items)
  if (!items.length) return null
  const galleryImageStyle = imageStyle(style)

  return (
    <section className={`${sectionPaddingClass(content, style)} ${sectionVisibilityClass(content)}`} style={sectionInlineStyle(content, style)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {content.heading ? <h2 className={`mb-6 font-semibold text-slate-50 ${headingClass(style)}`}>{safeString(content.heading)}</h2> : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            if (!item?.src) return null
            return (
              <div key={`${item.src}-${index}`} className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--section-card-bg,rgba(255,255,255,0.03))]">
                <Image
                  src={safeString(item.src)}
                  alt={safeString(item.alt, `Gallery item ${index + 1}`)}
                  width={640}
                  height={420}
                  className="h-56 w-full object-cover"
                  style={galleryImageStyle}
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
