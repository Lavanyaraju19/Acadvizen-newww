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
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-50">{section.title}</h2>
              {section.subtitle && <p className="mt-2 text-sm text-slate-300">{section.subtitle}</p>}
            </div>
          </div>
          {posts.length === 0 ? (
            <div className="text-sm text-slate-300">{section.body}</div>
          ) : (
            <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
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
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-[220px] object-cover rounded-t-2xl"
                      />
                    )}
                    <div className="p-4">
                      <p className="text-sm text-gray-400">
                        {post.published_at ? new Date(post.published_at).toDateString() : 'Draft'}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-50">{post.title}</h3>
                      {preview && <p className="mt-2 line-clamp-3 text-gray-400">{preview}</p>}
                      <span className="mt-3 inline-flex items-center gap-2 font-medium text-green-400">
                        Read article <span aria-hidden="true">→</span>
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
