export const revalidate = 0
export const dynamic = 'force-dynamic'

import DynamicPageRenderer from '../../../components/cms/DynamicPageRenderer'
import { fetchCmsPageBySlug } from '../../../lib/cmsServer'
import CoursesLegacyClient from '../../legacy-fallback/CoursesLegacyClient'
import { buildCmsPageMetadata } from '../../lib/cmsPageRoute'
import { isPublicCmsEnabled } from '../../lib/publicCms'

export async function generateMetadata() {
  return buildCmsPageMetadata('courses', '/courses', {
    title: 'Courses',
    description: 'Explore digital marketing courses, curriculum depth, and project-led outcomes.',
  })
}

export default async function Page() {
  if (!isPublicCmsEnabled()) {
    return <CoursesLegacyClient />
  }

  const cmsPage = await fetchCmsPageBySlug('courses')
  // Only use CMS renderer if the page has actual sections with content.
  // If sections array is empty, fall back to legacy client to avoid blank page.
  return cmsPage?.sections?.length ? <DynamicPageRenderer page={cmsPage} /> : <CoursesLegacyClient />
}
