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
    description: 'Hire job-ready digital marketing talent with project and placement-readiness training.',
  })
}

export default async function Page() {
  if (!isPublicCmsEnabled()) {
    return <HireFromUsLegacyClient />
  }

  const cmsPage = await fetchCmsPageBySlug('hire-from-us')
  return cmsPage ? <DynamicPageRenderer page={cmsPage} /> : <HireFromUsLegacyClient />
}
