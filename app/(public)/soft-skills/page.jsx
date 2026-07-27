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
    description: 'Enhance your soft skills training with Acadvizen.',
  })
}

export default async function Page() {
  if (!isPublicCmsEnabled()) {
    return <SoftSkillsLegacyClient />
  }

  const cmsPage = await fetchCmsPageBySlug('soft-skills')
  // Only use CMS renderer if the page has actual sections with content.
  // If sections array is empty, fall back to legacy client to avoid blank page.
  return cmsPage?.sections?.length ? <DynamicPageRenderer page={cmsPage} /> : <SoftSkillsLegacyClient />
}
