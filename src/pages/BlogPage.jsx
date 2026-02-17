import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import { Container, Section } from '../components/ui/Section'
import { Surface } from '../components/ui/Surface'

export function BlogPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPosts()
    const channel = supabase
      .channel('public-blog-posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_posts' }, loadPosts)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function loadPosts() {
    setLoading(true)
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
    if (data) setPosts(data)
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
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-50">Blog</h1>
            <p className="mt-3 text-slate-300 max-w-2xl mx-auto">
              Insights, playbooks, and announcements from the Acadvizen team.
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
                        <div className="relative aspect-video overflow-hidden border-b border-white/10 bg-white/[0.02]">
                          <img
                            src={post.featured_image}
                            alt={post.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          {post.published_at
                            ? new Date(post.published_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'Draft'}
                        </div>
                        <h3 className="mt-3 text-lg font-semibold text-slate-50">{post.title}</h3>
                        {post.excerpt && <p className="mt-2 text-sm text-slate-300 line-clamp-3">{post.excerpt}</p>}
                        <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-teal-300 group-hover:text-teal-200 transition-colors">
                          Read article <span aria-hidden="true">→</span>
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
