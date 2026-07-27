export const revalidate = 0
export const dynamic = 'force-dynamic'

import DynamicPageRenderer from '../../../components/cms/DynamicPageRenderer'
import { fetchCmsPageBySlug } from '../../../lib/cmsServer'
import HireFromUsLegacyClient from '../../legacy-fallback/HireFromUsLegacyClient'
import { buildCmsPageMetadata } from '../../lib/cmsPageRoute'
import { isPublicCmsEnabled } from '../../lib/publicCms'

export async function generateMetadata() {
  return buildCmsPageMetadata('hire-from-us', '/hire-from-us', {
    title: 'Hire From Us',
    description: 'Hire skilled digital marketing talent from Acadvizen.',
  })
}

export default async function Page() {
  if (!isPublicCmsEnabled()) {
    return <HireFromUsLegacyClient />
  }

  const cmsPage = await fetchCmsPageBySlug('hire-from-us')
  // Only use CMS renderer if the page has actual sections with content.
  // If sections array is empty, fall back to legacy client to avoid blank page.
  return cmsPage?.sections?.length ? <DynamicPageRenderer page={cmsPage} /> : <HireFromUsLegacyClient />
}
