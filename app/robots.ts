import { MetadataRoute } from 'next'
import { getPublicRobotsConfig } from '../lib/publicRobots'

export const revalidate = 0
export const dynamic = 'force-dynamic'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://acadvizen.com').replace(/\/+$/, '')

// Reads the Admin > Robots.txt setting (global_settings.robots_txt) so the live
// /robots.txt always reflects what was saved in the dashboard, instead of a hardcoded file.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const config = await getPublicRobotsConfig()
  return {
    rules: config.rules,
    sitemap: config.sitemaps?.length ? config.sitemaps : `${SITE_URL}/sitemap.xml`,
    ...(config.host ? { host: config.host } : {}),
  }
}
