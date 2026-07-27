export const revalidate = 0
export const dynamic = 'force-dynamic'

import DynamicPageRenderer from '../../../components/cms/DynamicPageRenderer'
import { fetchCmsPageBySlug } from '../../../lib/cmsServer'
import HomeLegacyClient from '../../legacy-fallback/HomeLegacyClient'
import { buildCmsPageMetadata } from '../../lib/cmsPageRoute'
import { isPublicCmsEnabled } from '../../lib/publicCms'

export async function generateMetadata() {
  return buildCmsPageMetadata('seo-course-in-bangalore', '/seo-course-in-bangalore', {
    title: 'SEO Course in Bangalore',
    description: 'Master technical SEO, on-page SEO, and content optimization with practical assignments.',
  })
}

export default async function Page() {
  if (!isPublicCmsEnabled()) {
    return <HomeLegacyClient />
  }

  const cmsPage = await fetchCmsPageBySlug('seo-course-in-bangalore')
  // Only use CMS renderer if the page has actual sections with content.
  // If sections array is empty, fall back to legacy client to avoid blank page.
  return cmsPage?.sections?.length ? <DynamicPageRenderer page={cmsPage} /> : <HomeLegacyClient />
}
