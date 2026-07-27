export const revalidate = 0
export const dynamic = 'force-dynamic'

import DynamicPageRenderer from '../../../components/cms/DynamicPageRenderer'
import { fetchCmsPageBySlug } from '../../../lib/cmsServer'
import HomeLegacyClient from '../../legacy-fallback/HomeLegacyClient'
import { buildCmsPageMetadata } from '../../lib/cmsPageRoute'
import { isPublicCmsEnabled } from '../../lib/publicCms'

export async function generateMetadata() {
  return buildCmsPageMetadata('digital-marketing-course-in-bangalore', '/digital-marketing-course-in-bangalore', {
    title: 'Digital Marketing Course in Bangalore',
    description: 'Hands-on digital marketing training in Bangalore with projects and placement support.',
  })
}

export default async function Page() {
  if (!isPublicCmsEnabled()) {
    return <HomeLegacyClient />
  }

  const cmsPage = await fetchCmsPageBySlug('digital-marketing-course-in-bangalore')
  // Only use CMS renderer if the page has actual sections with content.
  // If sections array is empty, fall back to legacy client to avoid blank page.
  return cmsPage?.sections?.length ? <DynamicPageRenderer page={cmsPage} /> : <HomeLegacyClient />
}
