export const revalidate = 0
export const dynamic = 'force-dynamic'

import DynamicPageRenderer from '../../../components/cms/DynamicPageRenderer'
import { fetchCmsPageBySlug } from '../../../lib/cmsServer'
import { HomeClientPage } from '../../client-pages'
import { buildCmsPageMetadata } from '../../lib/cmsPageRoute'
import { isPublicCmsEnabled } from '../../lib/publicCms'

export async function generateMetadata() {
  return buildCmsPageMetadata('digital-marketing-course-in-bangalore', '/digital-marketing-course-in-bangalore', {
    title: 'Digital Marketing Course in Bangalore',
    description: 'Hands-on digital marketing training in Bangalore with projects and placement support.',
  })
}

export default async function Page() {
  if (!isPublicCmsEnabled()) return <HomeClientPage />
  const cmsPage = await fetchCmsPageBySlug('digital-marketing-course-in-bangalore')
  return cmsPage ? <DynamicPageRenderer page={cmsPage} /> : <HomeClientPage />
}
