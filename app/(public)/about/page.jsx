export const revalidate = 0
export const dynamic = 'force-dynamic'

import DynamicPageRenderer from '../../../components/cms/DynamicPageRenderer'
import { fetchCmsPageBySlug } from '../../../lib/cmsServer'
import AboutLegacyClient from '../../legacy-fallback/AboutLegacyClient'
import { buildCmsPageMetadata } from '../../lib/cmsPageRoute'
import { isPublicCmsEnabled } from '../../lib/publicCms'

export async function generateMetadata() {
  return buildCmsPageMetadata('about', '/about', {
    title: 'About Us',
    description: 'Learn about our mission, mentors, and digital marketing training approach.',
  })
}

export default async function Page() {
  if (!isPublicCmsEnabled()) {
    return <AboutLegacyClient />
  }

  const cmsPage = await fetchCmsPageBySlug('about')
  // Only use CMS renderer if the page has actual sections with content.
  // If sections array is empty, fall back to legacy client to avoid blank page.
  return cmsPage?.sections?.length ? <DynamicPageRenderer page={cmsPage} /> : <AboutLegacyClient />
}
