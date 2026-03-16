export const revalidate = 0
export const dynamic = 'force-dynamic'

import DynamicPageRenderer from '../../../components/cms/DynamicPageRenderer'
import { fetchCmsPageBySlug } from '../../../lib/cmsServer'
import { CoursesClientPage } from '../../client-pages'
import { buildCmsPageMetadata } from '../../lib/cmsPageRoute'
import { isPublicCmsEnabled } from '../../lib/publicCms'

export async function generateMetadata() {
  return buildCmsPageMetadata('courses', '/courses', {
    title: 'Courses',
    description: 'Explore digital marketing courses, curriculum depth, and project-led outcomes.',
  })
}

export default async function Page() {
  if (!isPublicCmsEnabled()) return <CoursesClientPage />
  const cmsPage = await fetchCmsPageBySlug('courses')
  return cmsPage ? <DynamicPageRenderer page={cmsPage} /> : <CoursesClientPage />
}
