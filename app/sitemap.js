export const revalidate = 1

import { blogs } from '../data/blogs'

const SITE_URL = 'https://acadvizen.com'

/**
 * Next.js metadata sitemap route.
 * Next automatically converts this to XML and serves /sitemap.xml
 * with Content-Type: application/xml.
 *
 * @returns {import('next').MetadataRoute.Sitemap}
 */
export default function sitemap() {
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

  const staticEntries = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
    changeFrequency: route === '/' ? 'daily' : 'weekly',
    priority: route === '/' ? 1 : 0.8,
  }))

  const blogEntries = (blogs || [])
    .filter((post) => post?.slug)
    .map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.updated_at || post.created_at || now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

  return [...staticEntries, ...blogEntries]
}
