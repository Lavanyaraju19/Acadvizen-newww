export const revalidate = 0
export const dynamic = 'force-dynamic'

import { getServerSupabaseClient } from '../../../lib/supabaseServer'
import { fetchCmsSiteData } from '../../../lib/cmsServer'
import { buildCmsPageMetadata } from '../../lib/cmsPageRoute'
import { blogs as localBlogs } from '../../../data/blogs'
import { canonicalizeKnownBlogSlug } from '../../../lib/blogSlugResolver'
import EditorialBlogIndex from '../../../components/blog/EditorialBlogIndex'

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

function formatDisplayDate(value) {
  if (!value) return ''
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value))
  } catch {
    return ''
  }
}

function normalizePost(item) {
  const publishedAt = item.published_at || item.created_at || ''
  return {
    id: item.id || item.slug,
    slug: item.slug,
    title: item.title,
    excerpt: item.description || item.excerpt || '',
    image: item.featured_image || item.image || '/blog-images/image1.jpg',
    authorName: typeof item.author?.name === 'string' ? item.author.name : '',
    publishedAt,
    displayDate: formatDisplayDate(publishedAt),
    topics: [
      ...(Array.isArray(item.categories) ? item.categories : []),
      ...(Array.isArray(item.tags) ? item.tags : []),
    ].filter(Boolean),
  }
}

export default async function Page() {
  const [remote, siteData] = await Promise.all([fetchBlogs(), fetchCmsSiteData()])
  const remoteBlogs = []
  const seenRemoteSlugs = new Set()
  for (const item of remote) {
    const next = {
      ...item,
      slug: canonicalizeKnownBlogSlug(item.slug),
    }
    if (!next.slug || seenRemoteSlugs.has(next.slug)) continue
    seenRemoteSlugs.add(next.slug)
    remoteBlogs.push(next)
  }
  const fallback = localBlogs.map((item) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    description: item.excerpt || '',
    featured_image: item.image || '/blog-images/image1.jpg',
    published_at: item.created_at,
    categories: item.categories || [],
    tags: item.tags || [],
  }))
  const merged = [...remoteBlogs]
  for (const item of fallback) {
    if (!item || !item.slug) continue
    if (!merged.some((entry) => entry?.slug === item.slug)) merged.push(item)
  }
  const uiCopy = siteData?.settings?.ui_copy && typeof siteData.settings.ui_copy === 'object'
    ? siteData.settings.ui_copy
    : {}
  const heading = String(uiCopy.blog_index_title || 'Blog')
  const subtitle = String(uiCopy.blog_index_subtitle || 'Strategy, career, SEO, AI marketing, placements, and practical growth content.')
  const readMoreLabel = String(uiCopy.blog_read_more_label || 'Read more')
  const noPostsLabel = String(uiCopy.blog_no_posts_label || 'No published posts yet.')
  const editorialPosts = merged.map(normalizePost).filter((item) => item.slug && item.title)

  return (
    <EditorialBlogIndex
      posts={editorialPosts}
      heading={heading}
      subtitle={subtitle}
      readMoreLabel={readMoreLabel}
      noPostsLabel={noPostsLabel}
    />
  )
}
