import type { MetadataRoute } from 'next'
import { blogs as localBlogs } from '../data/blogs'
import { getServerSupabaseClient } from '../lib/supabaseServer'
import { canonicalizeKnownBlogSlug } from '../lib/blogSlugResolver'

export const revalidate = 0
export const dynamic = 'force-dynamic'

const BASE_URL = 'https://acadvizen.com'

async function fetchRows(table: string, fields = 'slug', filter?: { column: string; value: unknown }) {
  try {
    const supabase = getServerSupabaseClient()
    if (!supabase) return []
    let query = supabase.from(table).select(fields)
    if (filter) query = query.eq(filter.column, filter.value)
    const { data, error } = await query
    if (error) return []
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function toEntry(path: string, priority = 0.7, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] = 'weekly') {
  return {
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  const [
    pages,
    locationPages,
    blogs,
    courses,
    tools,
    locations,
    blogCategories,
    blogTags,
    authors,
  ] = await Promise.all([
    fetchRows('pages', 'slug', { column: 'status', value: 'published' }),
    fetchRows('location_pages', 'slug', { column: 'status', value: 'published' }),
    fetchRows('blogs', 'slug', { column: 'status', value: 'published' }),
    fetchRows('courses', 'slug', { column: 'is_active', value: true }),
    fetchRows('tools_extended', 'slug', { column: 'is_active', value: true }),
    fetchRows('locations', 'slug'),
    fetchRows('blog_categories', 'slug'),
    fetchRows('blog_tags', 'slug'),
    fetchRows('authors', 'slug'),
  ])

  const localBlogSlugs = localBlogs.map((blog) => blog.slug).filter(Boolean)

  const sitemapEntries: MetadataRoute.Sitemap = [
    ...staticRoutes.map((route) => toEntry(route, route === '/' ? 1 : 0.8, route === '/' ? 'daily' : 'weekly')),
    ...Array.from(new Set((pages as Array<{ slug?: string }>).map((row) => row.slug).filter(Boolean))).map((slug) =>
      toEntry(`/${slug}`, 0.8, 'weekly')
    ),
    ...Array.from(new Set((locationPages as Array<{ slug?: string }>).map((row) => row.slug).filter(Boolean))).map((slug) =>
      toEntry(`/${slug}`, 0.8, 'weekly')
    ),
    ...Array.from(
      new Set([
        ...(blogs as Array<{ slug?: string }>).map((row) => canonicalizeKnownBlogSlug(row.slug)).filter(Boolean),
        ...localBlogSlugs,
      ])
    ).map((slug) => toEntry(`/blog/${slug}`, 0.7, 'weekly')),
    ...Array.from(new Set((courses as Array<{ slug?: string }>).map((row) => row.slug).filter(Boolean))).map((slug) =>
      toEntry(`/courses/${slug}`, 0.8, 'weekly')
    ),
    ...Array.from(new Set((tools as Array<{ slug?: string }>).map((row) => row.slug).filter(Boolean))).map((slug) =>
      toEntry(`/tools/${slug}`, 0.7, 'weekly')
    ),
    ...Array.from(new Set((locations as Array<{ slug?: string }>).map((row) => row.slug).filter(Boolean))).map((slug) =>
      toEntry(`/digital-marketing-courses-${slug}`, 0.7, 'weekly')
    ),
    ...Array.from(new Set((blogCategories as Array<{ slug?: string }>).map((row) => row.slug).filter(Boolean))).map((slug) =>
      toEntry(`/blog/category/${slug}`, 0.6, 'weekly')
    ),
    ...Array.from(new Set((blogTags as Array<{ slug?: string }>).map((row) => row.slug).filter(Boolean))).map((slug) =>
      toEntry(`/blog/tag/${slug}`, 0.6, 'weekly')
    ),
    ...Array.from(new Set((authors as Array<{ slug?: string }>).map((row) => row.slug).filter(Boolean))).map((slug) =>
      toEntry(`/blog/author/${slug}`, 0.5, 'weekly')
    ),
  ]

  const deduped = new Map<string, MetadataRoute.Sitemap[number]>()
  for (const entry of sitemapEntries) deduped.set(entry.url, entry)
  return Array.from(deduped.values())
}
