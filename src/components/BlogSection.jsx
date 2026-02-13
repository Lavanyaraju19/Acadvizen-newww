import { Link } from 'react-router-dom'
import { Container, Section } from './ui/Section'
import { Surface } from './ui/Surface'

export function BlogSection({ section, posts }) {
  if (!section) return null
  const stripHtml = (value = '') => String(value).replace(/<[^>]*>/g, ' ')

  return (
    <Section className="py-10 md:py-14">
      <Container>
        <Surface className="p-6 md:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-50">{section.title}</h2>
              {section.subtitle && <p className="mt-2 text-sm text-slate-300">{section.subtitle}</p>}
            </div>
          </div>
          {posts.length === 0 ? (
            <div className="text-sm text-slate-300">{section.body}</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {posts.map((post) => {
                const postSlug = post.slug || String(post.id)
                const preview = stripHtml(post.excerpt || post.summary || post.content || '')
                return (
                <Link
                  key={post.id}
                  to={`/blog/${postSlug}`}
                  className="group block rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden transition hover:-translate-y-1"
                >
                  {post.featured_image && (
                    <div className="aspect-video overflow-hidden border-b border-white/10">
                      <img src={post.featured_image} alt={post.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Draft'}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-50">{post.title}</div>
                    {preview && <p className="mt-2 text-xs text-slate-300 line-clamp-3">{preview}</p>}
                    <div className="mt-3 text-xs font-semibold text-teal-300 group-hover:text-teal-200 transition-colors">
                      Read article -&gt;
                    </div>
                  </div>
                </Link>
              )})}
            </div>
          )}
        </Surface>
      </Container>
    </Section>
  )
}
