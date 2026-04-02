export const revalidate = 0
export const dynamic = 'force-dynamic'

import DynamicPageRenderer from '../../../components/cms/DynamicPageRenderer'
import { fetchCmsPageBySlug } from '../../../lib/cmsServer'
import SoftSkillsLegacyClient from '../../legacy-fallback/SoftSkillsLegacyClient'
import { buildCmsPageMetadata } from '../../lib/cmsPageRoute'
import { isPublicCmsEnabled } from '../../lib/publicCms'

export async function generateMetadata() {
  return buildCmsPageMetadata('soft-skills', '/soft-skills', {
    title: 'Soft Skills',
    description: 'Soft skills training for career-ready digital marketing learners.',
  })
}

export default async function Page() {
  if (!isPublicCmsEnabled()) {
    return <SoftSkillsLegacyClient />
  }

  const cmsPage = await fetchCmsPageBySlug('soft-skills')
  return cmsPage ? <DynamicPageRenderer page={cmsPage} /> : <SoftSkillsLegacyClient />
}
