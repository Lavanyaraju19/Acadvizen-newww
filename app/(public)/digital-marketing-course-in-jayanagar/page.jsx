export const revalidate = 0
export const dynamic = 'force-dynamic'

import DynamicPageRenderer from '../../../components/cms/DynamicPageRenderer'
import { fetchCmsPageBySlug } from '../../../lib/cmsServer'
import HomeLegacyClient from '../../legacy-fallback/HomeLegacyClient'
import { buildCmsPageMetadata } from '../../lib/cmsPageRoute'
import { isPublicCmsEnabled } from '../../lib/publicCms'

export async function generateMetadata() {
  return buildCmsPageMetadata('digital-marketing-course-in-jayanagar', '/digital-marketing-course-in-jayanagar', {
    title: 'Digital Marketing Course in Jayanagar',
    description: 'Hands-on digital marketing training with live projects, internship, and career support.',
  })
}

export default async function Page() {
  if (!isPublicCmsEnabled()) {
    return <HomeLegacyClient />
  }

  const cmsPage = await fetchCmsPageBySlug('digital-marketing-course-in-jayanagar')
  return cmsPage ? <DynamicPageRenderer page={cmsPage} /> : <HomeLegacyClient />
}
