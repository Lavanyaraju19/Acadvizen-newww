import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { fetchPublicData } from '../../lib/apiClient'
import { buildInternalLinks } from '../../../lib/internalLinker'
import { subscribeToTable } from '../../../lib/realtime'
import { supabase } from '../../lib/supabaseClient'
import { Container, Section } from '../../components/ui/Section'
import { Surface } from '../../components/ui/Surface'
import { blogs as localBlogs } from '../../../data/blogs'
import { parseBlogContent } from '../../../lib/blogContent'
import AdaptiveImage from '../../../components/media/AdaptiveImage'
import { findLocalBlogBySlug, resolveBlogSlug } from '../../../lib/blogSlugResolver'

function MbaVsDigitalMarketingBody() {
  return (
    <div>
      <p className="mt-6 mb-6 text-lg leading-relaxed text-gray-700">
        Choosing between an MBA and a Digital Marketing course in 2026 is no longer just about degree value. It is
        about speed, relevance, adaptability, and career outcomes in a rapidly evolving, AI-powered market.
      </p>
      <p className="mt-6 mb-6 text-lg leading-relaxed text-gray-700">
        Both paths can build successful careers, but they are designed for different goals. This comparison helps you
        decide based on return on investment, role readiness, growth opportunities, and long-term demand.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-4">The Career Landscape in 2026</h2>
      <p className="mt-6 mb-6 text-lg leading-relaxed text-gray-700">
        Companies now operate in a digital-first environment where customer acquisition, retention, and brand growth
        depend heavily on measurable online systems. Hiring demand increasingly favors professionals who can execute,
        optimize, and scale outcomes quickly.
      </p>
      <p className="mt-6 mb-6 text-lg leading-relaxed text-gray-700">
        While management fundamentals remain valuable, skill-based roles in performance marketing, SEO, analytics,
        automation, and growth are expanding faster across startups, agencies, and enterprise teams.
      </p>
      <br />

      <h2 className="text-2xl font-bold mt-12 mb-4">MBA in 2026: Strengths and Limitations</h2>
      <p className="mt-6 mb-6 text-lg leading-relaxed text-gray-700">
        An MBA continues to be relevant for professionals aiming at traditional management ladders, strategy functions,
        and leadership roles in large organizations. It builds broad business understanding across finance, operations,
        and organizational decision-making.
      </p>
      <p className="mt-6 mb-6 text-lg leading-relaxed text-gray-700">
        However, MBA pathways often demand higher tuition and longer timelines before clear job outcomes. In contrast,
        today&apos;s hiring cycles increasingly reward portfolio-backed execution and demonstrable impact.
      </p>
      <br />

      <h2 className="text-2xl font-bold mt-12 mb-4">The Digital Marketing Advantage in 2026</h2>
      <p className="mt-6 mb-6 text-lg leading-relaxed text-gray-700">
        Digital Marketing offers faster skill-to-job conversion because business growth is directly tied to channels
        like search, paid ads, social platforms, content ecosystems, and conversion optimization. Learners can build
        credibility through real campaign outputs and measurable KPIs.
      </p>
      <Image
        src="/blog/mba-vs-digital-marketing-2026/blog123.jpg"
        alt="Types of Digital Marketing"
        width={800}
        height={450}
        sizes="(max-width: 900px) 100vw, 800px"
        className="w-full max-w-[800px] h-auto object-contain rounded-xl my-8 mx-auto"
        loading="lazy"
      />
      <p className="mt-6 mb-6 text-lg leading-relaxed text-gray-700">
        Compared to long-form degree tracks, practical digital programs typically provide earlier employability and
        stronger relevance for modern growth-focused roles.
      </p>
      <br />

      <h2 className="text-2xl font-bold mt-12 mb-4">SEO and AI-Powered Marketing Systems</h2>
      <p className="mt-6 mb-6 text-lg leading-relaxed text-gray-700">
        In 2026, SEO is deeply integrated with AI-driven workflows, intent mapping, technical performance, and
        content intelligence. Teams expect marketers to use AI responsibly for research acceleration, optimization, and
        decision support without losing strategic judgment.
      </p>
      <Image
        src="/blog/mba-vs-digital-marketing-2026/blog121.jpg"
        alt="SEO and AI Marketing"
        width={800}
        height={450}
        sizes="(max-width: 900px) 100vw, 800px"
        className="w-full max-w-[800px] h-auto object-contain rounded-xl my-8 mx-auto"
        loading="lazy"
      />
      <p className="mt-6 mb-6 text-lg leading-relaxed text-gray-700">
        Professionals who combine SEO fundamentals with AI fluency are positioned strongly for high-impact roles in
        content systems, organic growth, and digital transformation teams.
      </p>
      <br />

      <h2 className="text-2xl font-bold mt-12 mb-4">Industry Growth and Social Media Strategy</h2>
      <p className="mt-6 mb-6 text-lg leading-relaxed text-gray-700">
        Social media strategy now directly influences trust, discovery, and revenue. Brands expect marketers to
        understand platform behavior, creative testing, audience segmentation, and funnel-based campaign planning.
      </p>
      <Image
        src="/blog/mba-vs-digital-marketing-2026/blog111.jpg"
        alt="Social Media Strategy"
        width={800}
        height={450}
        sizes="(max-width: 900px) 100vw, 800px"
        className="w-full max-w-[800px] h-auto object-contain rounded-xl my-8 mx-auto"
        loading="lazy"
      />
      <p className="mt-6 mb-6 text-lg leading-relaxed text-gray-700">
        This demand spans B2B and B2C sectors, making social performance and content strategy one of the strongest
        growth areas for digital career tracks.
      </p>
      <br />

      <h2 className="text-2xl font-bold mt-12 mb-4">ROI Comparison: MBA vs Digital Marketing</h2>
      <p className="mt-6 mb-6 text-lg leading-relaxed text-gray-700">
        Career ROI in 2026 depends on total cost, time to employability, and practical role readiness. MBA may support
        long-term management mobility, while digital marketing often delivers faster outcomes through project-led
        evidence and market-aligned skills.
      </p>
      <Image
        src="/blog/mba-vs-digital-marketing-2026/blog124.jpg"
        alt="Digital Marketing Campaign"
        width={800}
        height={450}
        sizes="(max-width: 900px) 100vw, 800px"
        className="w-full max-w-[800px] h-auto object-contain rounded-xl my-8 mx-auto"
        loading="lazy"
      />
      <p className="mt-6 mb-6 text-lg leading-relaxed text-gray-700">
        If your priority is entering or scaling in growth-oriented roles quickly, digital marketing generally provides
        a more immediate and adaptable pathway.
      </p>
      <br />

      <h2 className="text-2xl font-bold mt-12 mb-4">Final Decision for a Future-Ready Professional</h2>
      <p className="mt-6 mb-6 text-lg leading-relaxed text-gray-700">
        Choose MBA if your path is structured leadership in traditional management domains. Choose Digital Marketing if
        you want practical, technology-integrated skills with strong market demand and measurable business impact.
      </p>
      <p className="mt-6 mb-6 text-lg leading-relaxed text-gray-700">
        In 2026, the smarter path is the one aligned with speed, relevance, and future adaptability. For many
        professionals, Digital Marketing is the more agile decision.
      </p>
    </div>
  )
}

export function BlogPostPage() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [internalLinks, setInternalLinks] = useState({ blogs: [], courses: [], tools: [], locations: [] })
  const pickFirstNonEmpty = (...values) => {
    for (const value of values) {
      if (value === null || value === undefined) continue
      if (typeof value === 'string' && value.trim() === '') continue
      return value
    }
    return null
  }
  const mergeWithLocal = (incoming) => {
    const local = localBlogs.find((item) => item.slug === incoming?.slug || item.id === incoming?.id || item.slug === slug)
    return {
      ...(incoming || {}),
      ...(local || {}),
      title: pickFirstNonEmpty(local?.title, incoming?.title),
      excerpt: pickFirstNonEmpty(local?.excerpt, incoming?.excerpt),
      content: pickFirstNonEmpty(local?.content, incoming?.content),
      featured_image: pickFirstNonEmpty(
        local?.image,
        local?.featured_image,
        incoming?.featured_image,
        incoming?.image,
        '/blog-images/image1.jpg'
      ),
      published_at: pickFirstNonEmpty(incoming?.published_at, incoming?.created_at, local?.created_at),
    }
  }
  const formatPublishedDate = (value) => {
    if (!value) return 'Draft'
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
  }

  useEffect(() => {
    loadPost()
    const blogChannel = subscribeToTable('blog_posts', () => loadPost())
    const legacyChannel = subscribeToTable('blogs', () => loadPost())
    return () => {
      if (blogChannel) supabase?.removeChannel(blogChannel)
      if (legacyChannel) supabase?.removeChannel(legacyChannel)
    }
  }, [slug])

  async function loadPost() {
    setLoading(true)
    const resolvedSlug = resolveBlogSlug(slug, localBlogs) || slug
    const { data: bySlug } = await fetchPublicData('blog-posts', { slug: resolvedSlug })
    if (Array.isArray(bySlug) ? bySlug[0] : bySlug) {
      const row = Array.isArray(bySlug) ? bySlug[0] : bySlug
      const merged = mergeWithLocal(row)
      setPost(merged)
      await loadInternalLinks(merged)
      setLoading(false)
      return
    }

    const { data: byId } = await fetchPublicData('blog-posts', { id: resolvedSlug })
    if (Array.isArray(byId) ? byId[0] : byId) {
      const row = Array.isArray(byId) ? byId[0] : byId
      const merged = mergeWithLocal(row)
      setPost(merged)
      await loadInternalLinks(merged)
      setLoading(false)
      return
    }

    const fallbackPost = findLocalBlogBySlug(slug, localBlogs) || localBlogs.find((item) => item.id === resolvedSlug)
    const mergedFallback = fallbackPost ? mergeWithLocal(fallbackPost) : null
    setPost(mergedFallback)
    if (mergedFallback) {
      await loadInternalLinks(mergedFallback)
    }
    setLoading(false)
  }

  async function loadInternalLinks(sourcePost) {
    const [blogRes, courseRes, toolRes, locationRes] = await Promise.all([
      fetchPublicData('blog-posts', { limit: 8 }),
      fetchPublicData('courses'),
      fetchPublicData('tools-extended', { limit: 8 }),
      fetchPublicData('locations'),
    ])

    const blogs = Array.isArray(blogRes.data) ? blogRes.data : []
    const courses = Array.isArray(courseRes.data) ? courseRes.data : []
    const tools = Array.isArray(toolRes.data) ? toolRes.data : []
    const locations = Array.isArray(locationRes.data) ? locationRes.data : []

    const links = buildInternalLinks(
      { title: sourcePost?.title || sourcePost?.meta_title },
      {
        blogs: blogs.map((item) => ({ title: item.title, slug: item.slug, type: 'blog' })),
        courses: courses.map((item) => ({ title: item.title, slug: item.slug, type: 'course' })),
        tools: tools.map((item) => ({ title: item.name, slug: item.slug, type: 'tool' })),
        locations: locations.map((item) => ({
          title: item.meta_title || item.name,
          slug: item.slug,
          type: 'location',
        })),
      },
      4
    )
    setInternalLinks(links)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-teal-300/70" />
      </div>
    )
  }

  if (!post) {
    return (
      <Section className="py-16">
        <Container>
          <Surface className="p-10 text-center text-slate-400">
            Post not found. <Link to="/blog" className="text-teal-300">Back to blog</Link>
          </Surface>
        </Container>
      </Section>
    )
  }

  const isMbaVsDigitalMarketingPost = post.slug === 'mba-vs-digital-marketing-2026'
  const parsedContent = parseBlogContent(post.content || post.excerpt || '')

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>{post?.title ? `${post.title} | Acadvizen Blog` : 'Blog | Acadvizen'}</title>
        <meta
          name="description"
          content={post?.meta_description || post?.excerpt || 'Read the latest article from Acadvizen.'}
        />
      </Helmet>
      <Section className="pt-10 md:pt-14 pb-6 md:pb-10">
        <Container className="max-w-3xl">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
            {formatPublishedDate(post.published_at)}
          </div>
          <h1 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight text-slate-50">{post.title}</h1>
          {post.excerpt && <p className="mt-4 text-slate-300">{post.excerpt}</p>}
        </Container>
      </Section>

      {post.featured_image && (
        <Section className="py-4">
          <Container className="max-w-4xl">
            <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02]">
              <AdaptiveImage
                src={post.featured_image}
                alt={post.title}
                fallbackSrcs={['/blog-images/image1.jpg']}
                variant="hero"
                aspectRatio="16 / 9"
                sizes="(max-width: 1024px) 100vw, 900px"
                wrapperClassName="w-full"
                borderClassName=""
                roundedClassName=""
              />
            </div>
          </Container>
        </Section>
      )}

      <Section className="py-8">
        <Container className="max-w-3xl">
          <div className="prose prose-invert max-w-none text-slate-200 leading-relaxed">
            {isMbaVsDigitalMarketingPost ? (
              <MbaVsDigitalMarketingBody />
            ) : (
              <div className="space-y-10">
                {parsedContent.sections.map((section, index) => (
                  <section key={`${section.id}-${index}`} className="space-y-6">
                    {section.heading ? (
                      <h2 className="text-2xl font-semibold text-slate-100 md:text-3xl">{section.heading}</h2>
                    ) : null}
                    {section.paragraphs.map((paragraph, paragraphIndex) => (
                      <p key={`${section.id}-p-${paragraphIndex}`} className="whitespace-pre-line text-base leading-8 text-slate-300 md:text-lg">
                        {paragraph}
                      </p>
                    ))}
                    {section.image?.src ? (
                      <figure className="my-10 space-y-3">
                        <AdaptiveImage
                          src={section.image.src}
                          alt={section.image.alt || section.heading || post.title}
                          fallbackSrcs={['/blog-images/image1.jpg']}
                          variant="content"
                          aspectRatio="4 / 3"
                          sizes="(max-width: 900px) 100vw, 800px"
                          wrapperClassName="mx-auto w-full max-w-[900px]"
                          borderClassName="border border-white/12"
                          roundedClassName="rounded-2xl"
                          imageClassName="object-contain p-3"
                          loading="lazy"
                        />
                        {section.image?.alt ? (
                          <figcaption className="text-xs text-slate-400">{section.image.alt}</figcaption>
                        ) : null}
                      </figure>
                    ) : null}
                  </section>
                ))}
              </div>
            )}
          </div>
          {post.author && (
            <div className="mt-6 text-sm text-slate-400">Written by {post.author}</div>
          )}
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-base font-semibold text-slate-50">Related Links</h3>
            <div className="mt-4 grid gap-6 text-sm md:grid-cols-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Blogs</div>
                <div className="mt-2 flex flex-col gap-2">
                  {internalLinks.blogs.length ? (
                    internalLinks.blogs.map((item) => (
                      <Link key={item.slug} to={`/blog/${item.slug}`} className="text-teal-300 hover:text-teal-200">
                        {item.title}
                      </Link>
                    ))
                  ) : (
                    <span className="text-slate-400">More blogs coming soon.</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Courses</div>
                <div className="mt-2 flex flex-col gap-2">
                  {internalLinks.courses.length ? (
                    internalLinks.courses.map((item) => (
                      <Link key={item.slug} to={`/courses/${item.slug}`} className="text-teal-300 hover:text-teal-200">
                        {item.title}
                      </Link>
                    ))
                  ) : (
                    <span className="text-slate-400">Course details updating soon.</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Tools</div>
                <div className="mt-2 flex flex-col gap-2">
                  {internalLinks.tools.length ? (
                    internalLinks.tools.map((item) => (
                      <Link key={item.slug} to={`/tools/${item.slug}`} className="text-teal-300 hover:text-teal-200">
                        {item.title}
                      </Link>
                    ))
                  ) : (
                    <span className="text-slate-400">Tools will appear here.</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Locations</div>
                <div className="mt-2 flex flex-col gap-2">
                  {internalLinks.locations.length ? (
                    internalLinks.locations.map((item) => (
                      <Link
                        key={item.slug}
                        to={`/digital-marketing-courses-${item.slug}`}
                        className="text-teal-300 hover:text-teal-200"
                      >
                        {item.title}
                      </Link>
                    ))
                  ) : (
                    <span className="text-slate-400">Locations coming soon.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  )
}


export default BlogPostPage


