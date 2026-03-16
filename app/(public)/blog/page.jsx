export const revalidate = 0
export const dynamic = 'force-dynamic'

import Image from 'next/image'
import Link from 'next/link'
import { getServerSupabaseClient } from '../../../lib/supabaseServer'
import { fetchCmsSiteData } from '../../../lib/cmsServer'
import { buildCmsPageMetadata } from '../../lib/cmsPageRoute'
import { blogs as localBlogs } from '../../../data/blogs'

export async function generateMetadata() {
  return buildCmsPageMetadata('blog', '/blog', {
    title: 'Blog',
    description: 'Digital marketing insights, trends, and career guidance.',
  })
}

async function fetchBlogs() {
  const supabase = getServerSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('blogs')
    .select('id,slug,title,description,featured_image,published_at,created_at,status,tags,categories')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(100)
  if (error) return []
  return Array.isArray(data) ? data : []
}

export default async function Page() {
  const [remote, siteData] = await Promise.all([fetchBlogs(), fetchCmsSiteData()])
  const fallback = localBlogs.map((item) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    description: item.excerpt || '',
    featured_image: item.image || '/blog-images/image1.jpg',
    published_at: item.created_at,
    categories: item.categories || [],
  }))
  const merged = [...remote]
  for (const item of fallback) {
    if (!merged.some((entry) => entry.slug === item.slug)) merged.push(item)
  }
  const uiCopy = siteData?.settings?.ui_copy && typeof siteData.settings.ui_copy === 'object'
    ? siteData.settings.ui_copy
    : {}
  const heading = String(uiCopy.blog_index_title || 'Blog')
  const subtitle = String(uiCopy.blog_index_subtitle || 'Strategy, career, SEO, AI marketing, placements, and practical growth content.')
  const readMoreLabel = String(uiCopy.blog_read_more_label || 'Read more')
  const noPostsLabel = String(uiCopy.blog_no_posts_label || 'No published posts yet.')

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-50">{heading}</h1>
        <p className="mt-3 max-w-3xl text-slate-300">{subtitle}</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {merged.map((blog) => (
            <article key={blog.id || blog.slug} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              <div className="relative h-44 w-full">
                <Image
                  src={blog.featured_image || '/blog-images/image1.jpg'}
                  alt={blog.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h2 className="text-lg font-semibold text-slate-50">{blog.title}</h2>
                {blog.description ? <p className="mt-2 text-sm text-slate-300">{blog.description}</p> : null}
                {Array.isArray(blog.categories) && blog.categories.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {blog.categories.slice(0, 2).map((cat) => (
                      <Link key={`${blog.slug}-${cat}`} href={`/blog/category/${cat}`} className="text-[11px] text-teal-300 hover:text-teal-200">
                        #{cat}
                      </Link>
                    ))}
                  </div>
                ) : null}
                <p className="mt-3 text-xs text-slate-500">
                  {blog.published_at || blog.created_at ? new Date(blog.published_at || blog.created_at).toLocaleDateString() : ''}
                </p>
                <Link href={`/blog/${blog.slug}`} className="mt-3 inline-flex text-sm font-semibold text-teal-300">
                  {readMoreLabel}
                </Link>
              </div>
            </article>
          ))}
        </div>
        {!merged.length ? <p className="mt-6 text-sm text-slate-400">{noPostsLabel}</p> : null}
      </div>
    </main>
  )
}
