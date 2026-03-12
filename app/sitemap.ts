import type { MetadataRoute } from 'next'
import { blogs } from '../data/blogs'
import { getServerSupabaseClient } from '../lib/supabaseServer'

export const revalidate = 1

async function fetchSupabaseSlugs(table: string, slugField = 'slug') {
  try {
    const supabase = getServerSupabaseClient()
    if (!supabase) return []
    const { data, error } = await supabase
      .from(table)
      .select(slugField)
      .order('created_at', { ascending: false })
    if (error) return []
    return Array.isArray(data) ? data.map((row) => row?.[slugField]).filter(Boolean) : []
  } catch {
    return []
  }
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')

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
  const toolSlugs = await fetchSupabaseSlugs('tools_extended')
  const locationSlugs = await fetchSupabaseSlugs('locations')
  const locationNames = await fetchSupabaseSlugs('locations', 'name')
  const normalizedLocationSlugs = locationSlugs.length
    ? locationSlugs
    : locationNames.map((name) => slugify(String(name)))
  const courseEntries: MetadataRoute.Sitemap = courseSlugs.map((slug) => ({
    url: `${baseUrl}/courses/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const toolEntries: MetadataRoute.Sitemap = toolSlugs.map((slug) => ({
    url: `${baseUrl}/tools/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const locationEntries: MetadataRoute.Sitemap = normalizedLocationSlugs.map((slug) => ({
    url: `${baseUrl}/digital-marketing-courses-${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [
    ...staticEntries,
    ...blogEntries,
    ...supabaseBlogEntries,
    ...courseEntries,
    ...toolEntries,
    ...locationEntries,
  ]
}
