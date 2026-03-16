export const revalidate = 0
export const dynamic = 'force-dynamic'

import DynamicPageRenderer from '../../../components/cms/DynamicPageRenderer'
import { fetchCmsPageBySlug } from '../../../lib/cmsServer'
import HomeLegacyClient from '../../legacy-fallback/HomeLegacyClient'
import { buildCmsPageMetadata } from '../../lib/cmsPageRoute'
import { isPublicCmsEnabled } from '../../lib/publicCms'

export async function generateMetadata() {
  return buildCmsPageMetadata('google-ads-course-in-bangalore', '/google-ads-course-in-bangalore', {
    title: 'Google Ads Course in Bangalore',
    description: 'Build high-converting Google Ads campaigns with practical optimization workflows.',
  })
}

export default async function Page() {
  if (!isPublicCmsEnabled()) {
    return <HomeLegacyClient />
  }

  const cmsPage = await fetchCmsPageBySlug('google-ads-course-in-bangalore')
  return cmsPage ? <DynamicPageRenderer page={cmsPage} /> : <HomeLegacyClient />
}
