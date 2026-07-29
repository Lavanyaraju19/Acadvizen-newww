export const revalidate = 0
export const dynamic = 'force-dynamic'

import { fetchCmsSiteData } from '../../../lib/cmsServer'
import { buildCmsPageMetadata } from '../../lib/cmsPageRoute'
import { fetchPublishedPublicBlogs } from '../../../lib/publicBlogData'
import EditorialBlogIndex from '../../../components/blog/EditorialBlogIndex'

export async function generateMetadata() {
  return buildCmsPageMetadata('blog', '/blog', {
    title: 'Blog',
    description: 'Digital marketing insights, trends, and career guidance.',
  })
}

async function fetchBlogs() {
  return fetchPublishedPublicBlogs({
    select: 'id,slug,title,description,featured_image,published_at,created_at,status,tags,categories,author',
    limit: 100,
  })
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
  const uiCopy = siteData?.settings?.ui_copy && typeof siteData.settings.ui_copy === 'object'
    ? siteData.settings.ui_copy
    : {}
  const heading = String(uiCopy.blog_index_title || 'Blog')
  const subtitle = String(uiCopy.blog_index_subtitle || 'Strategy, career, SEO, AI marketing, placements, and practical growth content.')
  const readMoreLabel = String(uiCopy.blog_read_more_label || 'Read more')
  const noPostsLabel = String(uiCopy.blog_no_posts_label || 'No published posts yet.')
  const editorialPosts = remote.map(normalizePost).filter((item) => item.slug && item.title)

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
