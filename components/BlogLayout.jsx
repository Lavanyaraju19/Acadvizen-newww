import Link from 'next/link'
import BlogBlocksRenderer from './blog/BlogBlocksRenderer'
import AdaptiveImage from './media/AdaptiveImage'

export default function BlogLayout({
  blog,
  toc = [],
  contentBlocks = [],
  contentSections = [],
  relatedBlogs = [],
  readingMinutes = 1,
  labels = {},
}) {
  const articleUrl = `https://acadvizen.com/blog/${blog.slug}`
  const shareTitle = String(labels.shareTitle || blog.title || 'Blog')
  const shareText = encodeURIComponent(shareTitle)
  const shareUrl = encodeURIComponent(articleUrl)
  const shareLabel = String(labels.shareLabel || 'Share:')
  const tocTitle = String(labels.tocTitle || 'Table of Contents')
  const relatedTitle = String(labels.relatedTitle || 'Related Blogs')
  const readMoreLabel = String(labels.readMoreLabel || 'Read more')
  const readTimeSuffix = String(labels.readTimeSuffix || 'min read')

  return (
    <article className="min-h-screen">
      <section className="pt-10 md:pt-14 pb-6 md:pb-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-50">{blog.title}</h1>
          {blog.excerpt && <p className="mt-4 text-slate-300 max-w-4xl">{blog.excerpt}</p>}
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
            {readingMinutes} {readTimeSuffix}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span>{shareLabel}</span>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`} target="_blank" rel="noreferrer" className="text-teal-300 hover:text-teal-200">
              LinkedIn
            </a>
            <a href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`} target="_blank" rel="noreferrer" className="text-teal-300 hover:text-teal-200">
              X
            </a>
            <a href={`https://wa.me/?text=${shareText}%20${shareUrl}`} target="_blank" rel="noreferrer" className="text-teal-300 hover:text-teal-200">
              WhatsApp
            </a>
          </div>
          <div className="mt-6 rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02]">
            <AdaptiveImage
              src={blog.featured_image || '/blog-images/image1.jpg'}
              alt={blog.title}
              variant="hero"
              aspectRatio="16 / 9"
              sizes="(max-width: 768px) 100vw, 1200px"
              priority
              wrapperClassName="w-full"
              borderClassName=""
              roundedClassName=""
            />
          </div>
        </div>
      </section>

      <section className="pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="lg:sticky lg:top-24 h-fit rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-base font-semibold text-slate-100">{tocTitle}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {toc.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className="text-slate-300 hover:text-teal-200 transition-colors">
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </aside>

          <div className="space-y-10">
            <BlogBlocksRenderer blocks={contentBlocks} fallbackSections={contentSections} />

            <section>
              <h2 className="text-2xl md:text-3xl font-semibold text-slate-50">{relatedTitle}</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-3">
                {relatedBlogs.map((item) => (
                  <article key={item.slug} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                    <AdaptiveImage
                      src={item.featured_image || item.image || '/blog-images/image1.jpg'}
                      alt={item.title}
                      variant="card"
                      aspectRatio="16 / 10"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      loading="lazy"
                      wrapperClassName="w-full"
                      borderClassName=""
                      roundedClassName=""
                    />
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-slate-50">{item.title}</h3>
                      <Link href={`/blog/${item.slug}`} className="mt-3 inline-flex text-sm font-semibold text-teal-300">
                        {readMoreLabel}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </article>
  )
}
