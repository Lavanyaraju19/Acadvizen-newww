import type { MetadataRoute } from 'next'
import { blogs } from '../data/blogs'

export const revalidate = 1

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function fetchSupabaseSlugs(table: string, slugField = 'slug') {
  if (!SUPABASE_URL || !SUPABASE_KEY) return []
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${slugField}&order=created_at.desc`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const rows = await res.json()
    return Array.isArray(rows) ? rows.map((row) => row?.[slugField]).filter(Boolean) : []
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://acadvizen.com'
  const now = new Date()

  const staticRoutes = [
    '/',
    '/about',
    '/contact',
    '/blog',
    '/courses',
    '/tools',
    '/placement',
    '/hire-from-us',
    '/privacy-policy',
    '/terms-of-service',
    '/digital-marketing-course-in-bangalore',
    '/digital-marketing-course-in-jayanagar',
    '/seo-course-in-bangalore',
    '/social-media-marketing-course-in-bangalore',
    '/google-ads-course-in-bangalore',
    '/ai-digital-marketing-course',
    '/digital-marketing-internship-in-bangalore',
  ]

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: (route === '/' ? 'daily' : 'weekly'),
    priority: route === '/' ? 1 : 0.8,
  }))

  const blogEntries: MetadataRoute.Sitemap = (blogs || [])
    .filter((post) => post?.slug)
    .map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updated_at || post.created_at || now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  const supabaseBlogSlugs = await fetchSupabaseSlugs('blog_posts')
  const supabaseLegacyBlogSlugs = await fetchSupabaseSlugs('blogs')
  const blogSlugs = Array.from(new Set([...supabaseBlogSlugs, ...supabaseLegacyBlogSlugs]))
  const supabaseBlogEntries: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const courseSlugs = await fetchSupabaseSlugs('courses')
  const courseEntries: MetadataRoute.Sitemap = courseSlugs.map((slug) => ({
    url: `${baseUrl}/courses/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticEntries, ...blogEntries, ...supabaseBlogEntries, ...courseEntries]
}
