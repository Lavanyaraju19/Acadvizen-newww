export const revalidate = 0
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getServerSupabaseClient } from '../../../../../lib/supabaseServer'
import { fetchCmsSiteData } from '../../../../../lib/cmsServer'

async function fetchByTag(slug) {
  const supabase = getServerSupabaseClient()
  if (!supabase || !slug) return []
  const { data, error } = await supabase
    .from('blogs')
    .select('id,slug,title,description,tags,published_at,created_at')
    .eq('status', 'published')
    .contains('tags', [slug])
    .order('published_at', { ascending: false })
  if (error) return []
  return Array.isArray(data) ? data : []
}

export default async function Page({ params }) {
  const slug = params?.slug
  const [items, siteData] = await Promise.all([fetchByTag(slug), fetchCmsSiteData()])
  const uiCopy = siteData?.settings?.ui_copy && typeof siteData.settings.ui_copy === 'object'
    ? siteData.settings.ui_copy
    : {}
  const titlePrefix = String(uiCopy.blog_tag_prefix || 'Tag')
  const readLabel = String(uiCopy.blog_read_more_label || 'Read article')
  const emptyLabel = String(uiCopy.blog_tag_empty_label || 'No posts found for this tag.')
  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-semibold text-slate-50">{titlePrefix}: {slug}</h1>
        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h2 className="text-lg font-semibold text-slate-50">{item.title}</h2>
              {item.description ? <p className="mt-1 text-sm text-slate-300">{item.description}</p> : null}
              <Link href={`/blog/${item.slug}`} className="mt-2 inline-flex text-sm font-semibold text-teal-300">
                {readLabel}
              </Link>
            </article>
          ))}
          {!items.length ? <p className="text-sm text-slate-400">{emptyLabel}</p> : null}
        </div>
      </div>
    </main>
  )
}
