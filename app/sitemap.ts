import type { MetadataRoute } from 'next'
import { buildPublicSitemapEntries } from '../lib/publicSitemap'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return (await buildPublicSitemapEntries()) as MetadataRoute.Sitemap
}
