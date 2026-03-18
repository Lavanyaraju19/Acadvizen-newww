'use client'

import { useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Container, Section } from './ui/Section'
import { Surface } from './ui/Surface'
import { assetUrl } from '../lib/assetUrl'
import AdaptiveImage from '../../components/media/AdaptiveImage'
import { canonicalizeKnownBlogSlug } from '../../lib/blogSlugResolver'

export function BlogSection({ section, posts }) {
  if (!section) return null
  const stripHtml = (value = '') => String(value).replace(/<[^>]*>/g, ' ')
  const sliderRef = useRef(null)
  const formatPublishedDate = (value) => {
    if (!value) return 'Draft'
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
  }
  const visiblePosts = useMemo(() => posts || [], [posts])

  const handleScroll = (direction) => {
    if (!sliderRef.current) return
    const amount = sliderRef.current.clientWidth
    sliderRef.current.scrollBy({ left: direction * amount, behavior: 'smooth' })
  }

  return (
    <Section className="py-10 md:py-14">
      <Container>
        <Surface className="p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-50">{section.title}</h2>
              {section.subtitle && <p className="mt-2 text-sm text-slate-300">{section.subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleScroll(-1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.08]"
                aria-label="Scroll blogs left"
              >
                <span aria-hidden="true">‹</span>
              </button>
              <button
                type="button"
                onClick={() => handleScroll(1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.08]"
                aria-label="Scroll blogs right"
              >
                <span aria-hidden="true">›</span>
              </button>
            </div>
          </div>
          {visiblePosts.length === 0 ? (
            <div className="text-sm text-slate-300">{section.body}</div>
          ) : (
            <div
              ref={sliderRef}
              className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2"
            >
              {visiblePosts.map((post) => {
                const postSlug = canonicalizeKnownBlogSlug(post.slug || String(post.id))
                const preview = stripHtml(post.excerpt || post.summary || post.content || '')

                return (
                  <Link
                    key={post.id}
                    to={`/blog/${postSlug}`}
                    className="group block min-w-[260px] sm:min-w-[320px] lg:min-w-[300px] xl:min-w-[320px] snap-start rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden transition hover:-translate-y-1"
                  >
                    {post.featured_image && (
                      <AdaptiveImage
                        src={assetUrl(post.featured_image)}
                        alt={post.title}
                        variant="card"
                        aspectRatio="16 / 10"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        wrapperClassName="w-full"
                        borderClassName=""
                        roundedClassName="rounded-t-2xl"
                      />
                    )}
                    <div className="p-4">
                      <p className="text-sm text-gray-400">
                        {formatPublishedDate(post.published_at)}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-50">{post.title}</h3>
                      {preview && <p className="mt-2 line-clamp-3 text-gray-400">{preview}</p>}
                      <span className="mt-3 inline-flex items-center gap-2 font-medium text-green-400">
                        Read article
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </Surface>
      </Container>
    </Section>
  )
}
