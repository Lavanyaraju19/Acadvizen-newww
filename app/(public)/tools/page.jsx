export const revalidate = 0
export const dynamic = 'force-dynamic'

import DynamicPageRenderer from '../../../components/cms/DynamicPageRenderer'
import { fetchCmsPageBySlug } from '../../../lib/cmsServer'
import ToolsLegacyClient from '../../legacy-fallback/ToolsLegacyClient'
import { buildCmsPageMetadata } from '../../lib/cmsPageRoute'
import { isPublicCmsEnabled } from '../../lib/publicCms'

export async function generateMetadata() {
  return buildCmsPageMetadata('tools', '/tools', {
    title: 'Tools',
    description:
      'Browse AI and digital marketing tools covered in Acadvizen programs, with categories and practical use cases.',
  })
}

export default async function Page() {
  if (!isPublicCmsEnabled()) {
    return <ToolsLegacyClient />
  }

  const cmsPage = await fetchCmsPageBySlug('tools')
  // Only use CMS renderer if the page has actual sections with content.
  // If sections array is empty, fall back to legacy client to avoid blank page.
  return cmsPage?.sections?.length ? <DynamicPageRenderer page={cmsPage} /> : <ToolsLegacyClient />
}
