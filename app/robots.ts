import { MetadataRoute } from 'next'

export const revalidate = 1

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
