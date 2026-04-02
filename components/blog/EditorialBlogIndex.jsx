import Link from 'next/link'

function formatMeta(item) {
  return item.displayDate || item.authorName || 'ACADVIZEN BLOG'
}

function BlogCard({ item, readMoreLabel }) {
  return (
    <article className="flex min-h-[420px] h-full flex-col justify-between rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
      <div>
        <div className="h-[220px] overflow-hidden rounded-2xl bg-[#eef2ea]">
          <img
            src={item.image}
            alt={item.title}
            className="h-[220px] w-full object-cover"
            loading="lazy"
          />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#7b8781]">{formatMeta(item)}</p>
        <h2 className="mt-3 line-clamp-2 text-2xl font-semibold leading-tight text-[#132718]">{item.title}</h2>
        <p className="mt-3 min-h-[4.9rem] line-clamp-3 text-sm leading-7 text-[#617363]">{item.excerpt}</p>
      </div>
      <Link href={`/blog/${item.slug}`} className="mt-6 text-sm font-semibold text-[#16341d]">
        {readMoreLabel}
      </Link>
    </article>
  )
}

export default function EditorialBlogIndex({
  posts = [],
  heading = 'Blog',
  subtitle = '',
  readMoreLabel = 'Read more',
  noPostsLabel = 'No published posts yet.',
}) {
  const items = Array.isArray(posts) ? posts.filter(Boolean) : []

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(32,110,130,0.28),transparent_28%),linear-gradient(135deg,#103744_0%,#081728_28%,#081728_72%,#103744_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">{heading}</h1>
          {subtitle ? <p className="mt-4 text-base leading-8 text-slate-200 sm:text-lg">{subtitle}</p> : null}
        </div>

        {items.length ? (
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <BlogCard key={item.slug} item={item} readMoreLabel={readMoreLabel} />
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-2xl bg-white p-8 text-center shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
            <p className="text-sm text-[#617363]">{noPostsLabel}</p>
          </div>
        )}
      </div>
    </main>
  )
}
