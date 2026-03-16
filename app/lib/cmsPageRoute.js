import { fetchCmsPageBySlug, fetchSeoBySlug } from '../../lib/cmsServer'
import { buildMetadata } from './seo'
import { isPublicCmsEnabled } from './publicCms'

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value === null || value === undefined) continue
    if (typeof value === 'string' && !value.trim()) continue
    return value
  }
  return null
}

export async function buildCmsPageMetadata(slug, path, fallback = {}) {
  if (!isPublicCmsEnabled()) {
    return buildMetadata({
      title: fallback.title || 'Page',
      description: fallback.description || 'Digital marketing page.',
      path,
      image: fallback.image,
    })
  }

  const [page, seo] = await Promise.all([fetchCmsPageBySlug(slug), fetchSeoBySlug(slug)])

  return buildMetadata({
    title: firstNonEmpty(seo?.meta_title, page?.seo_title, page?.title, fallback.title, 'Page'),
    description: firstNonEmpty(
      seo?.meta_description,
      page?.seo_description,
      page?.description,
      fallback.description,
      'Digital marketing page.'
    ),
    path,
    canonical: firstNonEmpty(seo?.canonical_url, page?.canonical_url),
    image: firstNonEmpty(seo?.og_image, page?.og_image, fallback.image),
    ogTitle: firstNonEmpty(seo?.og_title),
    ogDescription: firstNonEmpty(seo?.og_description),
    twitterTitle: firstNonEmpty(seo?.twitter_title),
    twitterDescription: firstNonEmpty(seo?.twitter_description),
    noindex: Boolean(seo?.noindex || page?.noindex),
  })
}
