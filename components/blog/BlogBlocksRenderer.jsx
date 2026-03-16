import Image from 'next/image'

function renderVideo(url, title) {
  if (!url) return null
  if (/youtube\.com|youtu\.be|vimeo\.com/i.test(url)) {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black" style={{ aspectRatio: '16 / 9' }}>
        <iframe
          src={url}
          title={title || 'Embedded video'}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    )
  }
  return (
    <video src={url} className="w-full rounded-2xl border border-white/10 bg-black" controls>
      <track kind="captions" />
    </video>
  )
}

export function buildTocFromBlocks(blocks = []) {
  return blocks
    .map((block, index) => {
      if (block.block_type !== 'heading') return null
      const text = String(block.content_json?.text || '').trim()
      if (!text) return null
      return {
        id: block.id || `heading-${index}`,
        title: text,
      }
    })
    .filter(Boolean)
}

export function estimateReadingMinutes({ text = '', blocks = [] }) {
  const wordsFromText = String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  const wordsFromBlocks = blocks
    .map((block) => {
      const json = block.content_json || {}
      if (block.block_type === 'list' && Array.isArray(json.items)) return json.items.join(' ')
      return [json.text, json.caption, json.alt, json.author, json.label].filter(Boolean).join(' ')
    })
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length
  const total = wordsFromText + wordsFromBlocks
  return Math.max(1, Math.ceil(total / 220))
}

export default function BlogBlocksRenderer({ blocks = [], fallbackSections = [] }) {
  if (Array.isArray(blocks) && blocks.length) {
    return (
      <div className="space-y-8">
        {blocks.map((block, index) => {
          const id = block.id || `block-${index}`
          const type = String(block.block_type || 'paragraph')
          const content = block.content_json || {}

          if (type === 'heading') {
            const level = Number(content.level) || 2
            if (level >= 4) return <h4 id={id} key={id} className="text-xl font-semibold text-slate-50">{content.text}</h4>
            if (level === 3) return <h3 id={id} key={id} className="text-2xl font-semibold text-slate-50">{content.text}</h3>
            return <h2 id={id} key={id} className="text-3xl font-semibold text-slate-50">{content.text}</h2>
          }

          if (type === 'list') {
            const items = Array.isArray(content.items) ? content.items : []
            return (
              <ul key={id} className="list-disc space-y-2 pl-6 text-slate-300">
                {items.map((item, itemIndex) => (
                  <li key={`${id}-${itemIndex}`}>{item}</li>
                ))}
              </ul>
            )
          }

          if (type === 'quote') {
            return (
              <blockquote key={id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-slate-200">
                <p className="text-lg leading-relaxed">"{content.text}"</p>
                {content.author ? <footer className="mt-2 text-sm text-slate-400">- {content.author}</footer> : null}
              </blockquote>
            )
          }

          if (type === 'image') {
            if (!content.src) return null
            return (
              <figure key={id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-2">
                <div className="relative h-[230px] w-full overflow-hidden rounded-xl sm:h-[320px]">
                  <Image
                    src={content.src}
                    alt={content.alt || 'Blog image'}
                    fill
                    sizes="(max-width: 768px) 100vw, 900px"
                    className="object-cover"
                  />
                </div>
                {content.caption ? <figcaption className="px-2 pb-1 pt-3 text-xs text-slate-400">{content.caption}</figcaption> : null}
              </figure>
            )
          }

          if (type === 'video') {
            return <div key={id}>{renderVideo(content.embed_url, content.title)}</div>
          }

          if (type === 'link') {
            if (!content.href) return null
            return (
              <a
                key={id}
                href={content.href}
                target={content.target || '_self'}
                className="inline-flex text-base font-semibold text-teal-300 hover:text-teal-200"
              >
                {content.label || content.href}
              </a>
            )
          }

          return (
            <p key={id} className="whitespace-pre-line text-lg leading-relaxed text-slate-300">
              {content.text || ''}
            </p>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {fallbackSections.map((section, idx) => (
        <section key={`${section.id}-${idx}`} id={section.id} className="scroll-mt-24 space-y-4">
          {section.heading && <h2 className="text-2xl md:text-3xl font-semibold text-slate-50">{section.heading}</h2>}
          {(section.paragraphs || []).map((paragraph, pIdx) => (
            <p key={`${section.id}-p-${pIdx}`} className="whitespace-pre-line text-lg leading-relaxed text-slate-300">
              {paragraph}
            </p>
          ))}
          {section.image ? (
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02]">
              <div className="relative h-[230px] sm:h-[320px] w-full">
                <Image
                  src={section.image.src}
                  alt={section.image.alt || section.heading || 'Blog image'}
                  fill
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, 900px"
                  className="object-cover"
                />
              </div>
            </div>
          ) : null}
        </section>
      ))}
    </div>
  )
}
