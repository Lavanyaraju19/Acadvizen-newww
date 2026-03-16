export const revalidate = 0
export const dynamic = 'force-dynamic'

import DynamicPageRenderer from '../../../components/cms/DynamicPageRenderer'
import { fetchCmsPageBySlug } from '../../../lib/cmsServer'
import { PlacementClientPage } from '../../client-pages'
import { buildCmsPageMetadata } from '../../lib/cmsPageRoute'
import { isPublicCmsEnabled } from '../../lib/publicCms'

export async function generateMetadata() {
  return buildCmsPageMetadata('placement', '/placement', {
    title: 'Placement',
    description: 'Placement support with mock interviews, recruiter connects, and success stories.',
  })
}

export default async function Page() {
  if (!isPublicCmsEnabled()) return <PlacementClientPage />
  const cmsPage = await fetchCmsPageBySlug('placement')
  return cmsPage ? <DynamicPageRenderer page={cmsPage} /> : <PlacementClientPage />
}
