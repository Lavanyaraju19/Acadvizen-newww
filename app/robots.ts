import { MetadataRoute } from 'next'

// Static route file - no revalidation needed
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin-login', '/admin-dashboard'],
      },
    ],
    sitemap: 'https://acadvizen.com/sitemap.xml',
  }
}
