import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabaseClient'
import { fetchPublicData } from '../../lib/apiClient'
import { Container, Section } from '../../components/ui/Section'
import { Surface } from '../../components/ui/Surface'
import { blogs as localBlogs } from '../../../data/blogs'
import AdaptiveImage from '../../../components/media/AdaptiveImage'
import { canonicalizeKnownBlogSlug } from '../../../lib/blogSlugResolver'

export function BlogPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const pickFirstNonEmpty = (...values) => {
    for (const value of values) {
      if (value === null || value === undefined) continue
      if (typeof value === 'string' && value.trim() === '') continue
      return value
    }
    return null
  }
  const mergeWithLocal = (post) => {
    const canonicalSlug = canonicalizeKnownBlogSlug(post.slug)
    const local = localBlogs.find((item) => item.slug === canonicalSlug || item.id === post.id)
    return {
      ...post,
      slug: canonicalSlug || post.slug,
      ...(local || {}),
      title: pickFirstNonEmpty(local?.title, post.title),
      excerpt: pickFirstNonEmpty(local?.excerpt, post.excerpt),
      content: pickFirstNonEmpty(local?.content, post.content),
      featured_image: pickFirstNonEmpty(
        local?.image,
        local?.featured_image,
        post.featured_image,
        post.image,
        '/blog-images/image1.jpg'
      ),
      published_at: pickFirstNonEmpty(post.published_at, post.created_at, local?.created_at),
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
    loadPosts()
    const channel = supabase
      ?.channel('public-blog-posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_posts' }, loadPosts)
      .subscribe()
    return () => {
      if (channel) supabase?.removeChannel(channel)
    }
  }, [])

  async function loadPosts() {
    setLoading(true)
    const { data } = await fetchPublicData('blog-posts')
    const fetched = Array.isArray(data) ? data.map(mergeWithLocal) : []

    const localFallback = localBlogs.map((post) =>
      mergeWithLocal({
        ...post,
        featured_image: post.image,
        published_at: post.created_at,
      })
    )

    const merged = [...fetched]
    for (const post of localFallback) {
      if (!merged.some((item) => (item.slug || item.id) === (post.slug || post.id))) {
        merged.push(post)
      }
    }
    const deduped = []
    const seenSlugs = new Set()
    for (const item of merged) {
      const key = item.slug || item.id
      if (!key || seenSlugs.has(key)) continue
      seenSlugs.add(key)
      deduped.push(item)
    }
    setPosts(deduped)
    setLoading(false)
  }

  return (
    <div className="min-h-screen">
      <Section className="pt-10 md:pt-14 pb-6 md:pb-10">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-50">
              Digital Marketing Insights, Trends &amp; Career Guide 2026
            </h1>
            <p className="mt-3 text-slate-300 max-w-2xl mx-auto">
              Whether you are a student, working professional, entrepreneur, or aspiring marketer, our blogs are
              designed to keep you informed, future-ready, and ahead of the competition.
            </p>
          </motion.div>
        </Container>
      </Section>

      <Section className="py-6 md:py-10">
        <Container>
          {loading ? (
            <div className="text-center py-16">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-teal-300/70" />
            </div>
          ) : posts.length === 0 ? (
            <Surface className="p-10 text-center text-slate-400">No blog posts yet.</Surface>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, idx) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ delay: idx * 0.05, duration: 0.35 }}
                >
                  <Link to={`/blog/${post.slug}`} className="group block h-full">
                    <Surface className="h-full overflow-hidden transition-transform duration-200 group-hover:-translate-y-1">
                      {post.featured_image && (
                        <AdaptiveImage
                          src={post.featured_image}
                          alt={post.title}
                          variant="card"
                          aspectRatio="16 / 10"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          wrapperClassName="w-full border-b border-white/10"
                          borderClassName=""
                          roundedClassName=""
                        />
                      )}
                      <div className="p-6">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          {formatPublishedDate(post.published_at)}
                        </div>
                        <h3 className="mt-3 text-lg font-semibold text-slate-50">{post.title}</h3>
                        {post.excerpt && <p className="mt-2 text-sm text-slate-300 line-clamp-3">{post.excerpt}</p>}
                        <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-teal-300 group-hover:text-teal-200 transition-colors">
                          Read article
                        </span>
                      </div>
                    </Surface>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </Container>
      </Section>
    </div>
  )
}

export default BlogPage


