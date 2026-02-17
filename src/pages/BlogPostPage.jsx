import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabaseClient'
import { Container, Section } from '../components/ui/Section'
import { Surface } from '../components/ui/Surface'

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
      <img
        src="/blog/mba-vs-digital-marketing-2026/blog123.jpg"
        alt="Types of Digital Marketing"
        className="w-full max-w-[800px] h-auto object-cover rounded-xl my-8 mx-auto"
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
      <img
        src="/blog/mba-vs-digital-marketing-2026/blog121.jpg"
        alt="SEO and AI Marketing"
        className="w-full max-w-[800px] h-auto object-cover rounded-xl my-8 mx-auto"
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
      <img
        src="/blog/mba-vs-digital-marketing-2026/blog111.jpg"
        alt="Social Media Strategy"
        className="w-full max-w-[800px] h-auto object-cover rounded-xl my-8 mx-auto"
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
      <img
        src="/blog/mba-vs-digital-marketing-2026/blog124.jpg"
        alt="Digital Marketing Campaign"
        className="w-full max-w-[800px] h-auto object-cover rounded-xl my-8 mx-auto"
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

  useEffect(() => {
    loadPost()
  }, [slug])

  async function loadPost() {
    setLoading(true)
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single()
    if (data) {
      setPost(data)
      setLoading(false)
      return
    }

    const { data: byId } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', slug)
      .eq('is_published', true)
      .single()
    setPost(byId || null)
    setLoading(false)
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
  const hasHtml = typeof post.content === 'string' && /<\/?[a-z][\s\S]*>/i.test(post.content)

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
            {post.published_at
              ? new Date(post.published_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Draft'}
          </div>
          <h1 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight text-slate-50">{post.title}</h1>
          {post.excerpt && <p className="mt-4 text-slate-300">{post.excerpt}</p>}
        </Container>
      </Section>

      {post.featured_image && (
        <Section className="py-4">
          <Container className="max-w-4xl">
            <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02]">
              <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
            </div>
          </Container>
        </Section>
      )}

      <Section className="py-8">
        <Container className="max-w-3xl">
          <div className="prose prose-invert max-w-none text-slate-200">
            {isMbaVsDigitalMarketingPost ? (
              <MbaVsDigitalMarketingBody />
            ) : hasHtml ? (
              <div
                className="[&_img]:w-full [&_img]:max-w-[800px] [&_img]:h-[220px] [&_img]:object-cover [&_img]:rounded-xl [&_img]:my-8 [&_img]:mx-auto"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            ) : (
              post.content || post.excerpt || 'Content will be updated soon.'
            )}
          </div>
          {post.author && (
            <div className="mt-6 text-sm text-slate-400">Written by {post.author}</div>
          )}
        </Container>
      </Section>
    </div>
  )
}

