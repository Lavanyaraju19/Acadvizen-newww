import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Container, Section } from '../components/ui/Section'
import { Surface } from '../components/ui/Surface'

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
      if (data.title) document.title = `${data.title} | Acadvizen Blog`
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
    if (byId?.title) document.title = `${byId.title} | Acadvizen Blog`
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

  const hasHtml = typeof post.content === 'string' && /<\/?[a-z][\s\S]*>/i.test(post.content)

  return (
    <div className="min-h-screen">
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
            {hasHtml ? (
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
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
