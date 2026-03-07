import type { MetadataRoute } from 'next'
import { blogs as localBlogs } from '../data/blogs'

const SITE_URL = 'https://www.acadvizen.com'

const staticRoutes = [
  '/',
  '/about',
  '/contact',
  '/courses',
  '/tools',
  '/blog',
  '/placement',
  '/hire-from-us',
  '/login',
  '/register',
  '/forgot-password',
  '/privacy-policy',
  '/terms-of-service',
  '/dashboard',
  '/sales',
  '/digital-marketing-course-in-bangalore',
  '/digital-marketing-course-in-jayanagar',
  '/seo-course-in-bangalore',
  '/social-media-marketing-course-in-bangalore',
  '/google-ads-course-in-bangalore',
  '/ai-digital-marketing-course',
  '/digital-marketing-internship-in-bangalore',
]
const fallbackCourseSlugs = ['basic', 'advanced', 'master']

async function fetchSupabaseSlugs(table: string, slugColumn = 'slug'): Promise<string[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return []

  try {
    const res = await fetch(
      `${url}/rest/v1/${table}?select=${slugColumn}&limit=1000&order=created_at.desc`,
      {
        headers: {
          apikey: anon,
          Authorization: `Bearer ${anon}`,
        },
        next: { revalidate: 900 },
      }
    )
    if (!res.ok) return []
    const rows = (await res.json()) as Record<string, string>[]
    return rows.map((row) => row?.[slugColumn]).filter(Boolean)
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date()

  const [blogPostSlugs, blogsTableSlugs, courseSlugs, pageSlugs, toolsExtendedSlugs, toolsTableSlugs] = await Promise.all([
    fetchSupabaseSlugs('blog_posts'),
    fetchSupabaseSlugs('blogs'),
    fetchSupabaseSlugs('courses'),
    fetchSupabaseSlugs('pages'),
    fetchSupabaseSlugs('tools_extended'),
    fetchSupabaseSlugs('tools'),
  ])

  const fallbackBlogSlugs = localBlogs.map((blog) => blog.slug)
  const allBlogSlugs = Array.from(new Set([...blogPostSlugs, ...blogsTableSlugs, ...fallbackBlogSlugs]))
  const allToolSlugs = Array.from(new Set([...toolsExtendedSlugs, ...toolsTableSlugs]))

  const allCourseSlugs = Array.from(new Set([...courseSlugs, ...fallbackCourseSlugs]))

  const dynamicRoutes = [
    ...allBlogSlugs.map((slug) => `/blog/${slug}`),
    ...allCourseSlugs.map((slug) => `/courses/${slug}`),
    ...allToolSlugs.map((slug) => `/tools/${slug}`),
    ...pageSlugs.map((slug) => `/${slug}`),
  ]

  const allRoutes = Array.from(new Set([...staticRoutes, ...dynamicRoutes]))

  return allRoutes
    .filter((route) => !route.startsWith('/admin'))
    .map((route) => ({
      url: `${SITE_URL}${route}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: route === '/' ? 1 : 0.7,
    }))
}
