export const revalidate = 0
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getServerSupabaseClient } from '../../../../../lib/supabaseServer'
import { fetchCmsSiteData } from '../../../../../lib/cmsServer'

async function fetchByAuthor(slug) {
  const supabase = getServerSupabaseClient()
  if (!supabase || !slug) return { author: null, posts: [] }

  const { data: author } = await supabase.from('authors').select('*').eq('slug', slug).maybeSingle()
  if (!author?.id) return { author: null, posts: [] }

  const { data: posts } = await supabase
    .from('blogs')
    .select('id,slug,title,description,published_at,created_at')
    .eq('status', 'published')
    .eq('author_id', author.id)
    .order('published_at', { ascending: false })

  return { author, posts: Array.isArray(posts) ? posts : [] }
}

export default async function Page({ params }) {
  const [{ author, posts }, siteData] = await Promise.all([fetchByAuthor(params?.slug), fetchCmsSiteData()])
  const uiCopy = siteData?.settings?.ui_copy && typeof siteData.settings.ui_copy === 'object'
    ? siteData.settings.ui_copy
    : {}
  const readLabel = String(uiCopy.blog_read_more_label || 'Read article')
  const authorMissing = String(uiCopy.blog_author_missing_label || 'Author not found.')
  const emptyLabel = String(uiCopy.blog_author_empty_label || 'No posts available for this author.')
  if (!author) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">{authorMissing}</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-semibold text-slate-50">{author.name}</h1>
        {author.bio ? <p className="mt-2 text-slate-300">{author.bio}</p> : null}
        <div className="mt-6 space-y-4">
          {posts.map((item) => (
            <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h2 className="text-lg font-semibold text-slate-50">{item.title}</h2>
              {item.description ? <p className="mt-1 text-sm text-slate-300">{item.description}</p> : null}
              <Link href={`/blog/${item.slug}`} className="mt-2 inline-flex text-sm font-semibold text-teal-300">
                {readLabel}
              </Link>
            </article>
          ))}
          {!posts.length ? <p className="text-sm text-slate-400">{emptyLabel}</p> : null}
        </div>
      </div>
    </main>
  )
}
