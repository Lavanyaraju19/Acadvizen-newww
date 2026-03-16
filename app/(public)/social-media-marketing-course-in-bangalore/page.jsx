export const revalidate = 0
export const dynamic = 'force-dynamic'

import DynamicPageRenderer from '../../../components/cms/DynamicPageRenderer'
import { fetchCmsPageBySlug } from '../../../lib/cmsServer'
import { HomeClientPage } from '../../client-pages'
import { buildCmsPageMetadata } from '../../lib/cmsPageRoute'
import { isPublicCmsEnabled } from '../../lib/publicCms'

export async function generateMetadata() {
  return buildCmsPageMetadata(
    'social-media-marketing-course-in-bangalore',
    '/social-media-marketing-course-in-bangalore',
    {
      title: 'Social Media Marketing Course in Bangalore',
      description: 'Learn social media strategy, paid campaigns, and creative performance marketing through live projects.',
    }
  )
}

export default async function Page() {
  if (!isPublicCmsEnabled()) return <HomeClientPage />
  const cmsPage = await fetchCmsPageBySlug('social-media-marketing-course-in-bangalore')
  return cmsPage ? <DynamicPageRenderer page={cmsPage} /> : <HomeClientPage />
}
