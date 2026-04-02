export const revalidate = 0
export const dynamic = 'force-dynamic'

import DynamicPageRenderer from '../../../components/cms/DynamicPageRenderer'
import { fetchCmsPageBySlug } from '../../../lib/cmsServer'
import ProjectsLegacyClient from '../../legacy-fallback/ProjectsLegacyClient'
import { buildCmsPageMetadata } from '../../lib/cmsPageRoute'
import { isPublicCmsEnabled } from '../../lib/publicCms'

export async function generateMetadata() {
  return buildCmsPageMetadata('projects', '/projects', {
    title: 'Projects',
    description: 'Explore AI-led digital marketing projects and case studies.',
  })
}

export default async function Page() {
  if (!isPublicCmsEnabled()) {
    return <ProjectsLegacyClient />
  }

  const cmsPage = await fetchCmsPageBySlug('projects')
  return cmsPage ? <DynamicPageRenderer page={cmsPage} /> : <ProjectsLegacyClient />
}
