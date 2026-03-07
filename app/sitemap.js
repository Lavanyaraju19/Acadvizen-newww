import { blogs } from '../data/blogs'

const SITE_URL = 'https://acadvizen.com'

export default function sitemap() {
  const now = new Date()

  const staticRoutes = ['/', '/about', '/blog', '/courses', '/contact']

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
