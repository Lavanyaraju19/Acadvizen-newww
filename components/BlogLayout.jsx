import Image from 'next/image'
import Link from 'next/link'

export default function BlogLayout({
  blog,
  toc = [],
  contentSections = [],
  relatedBlogs = [],
}) {
  return (
    <article className="min-h-screen">
      <section className="pt-10 md:pt-14 pb-6 md:pb-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-50">{blog.title}</h1>
          {blog.excerpt && <p className="mt-4 text-slate-300 max-w-4xl">{blog.excerpt}</p>}
          <div className="mt-6 rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02]">
            <div className="relative h-[240px] sm:h-[340px] md:h-[420px] w-full">
              <Image
                src={blog.featured_image || '/blog-images/image1.jpg'}
                alt={blog.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 1200px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="lg:sticky lg:top-24 h-fit rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-base font-semibold text-slate-100">Table of Contents</h2>
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
            {contentSections.map((section, idx) => (
              <section key={`${section.id}-${idx}`} id={section.id} className="scroll-mt-24 space-y-4">
                {section.heading && <h2 className="text-2xl md:text-3xl font-semibold text-slate-50">{section.heading}</h2>}
                {section.paragraphs.map((paragraph, pIdx) => (
                  <p key={`${section.id}-p-${pIdx}`} className="text-lg leading-relaxed text-slate-300">
                    {paragraph}
                  </p>
                ))}
                {section.image && (
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
                )}
              </section>
            ))}

            <section>
              <h2 className="text-2xl md:text-3xl font-semibold text-slate-50">Related Blogs</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-3">
                {relatedBlogs.map((item) => (
                  <article key={item.slug} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                    <div className="relative h-40 w-full">
                      <Image
                        src={item.featured_image || item.image || '/blog-images/image1.jpg'}
                        alt={item.title}
                        fill
                        loading="lazy"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-slate-50">{item.title}</h3>
                      <Link href={`/blog/${item.slug}`} className="mt-3 inline-flex text-sm font-semibold text-teal-300">
                        Read more
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
