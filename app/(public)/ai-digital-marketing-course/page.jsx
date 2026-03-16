export const revalidate = 0
export const dynamic = 'force-dynamic'

import DynamicPageRenderer from '../../../components/cms/DynamicPageRenderer'
import { fetchCmsPageBySlug } from '../../../lib/cmsServer'
import HomeLegacyClient from '../../legacy-fallback/HomeLegacyClient'
import { buildCmsPageMetadata } from '../../lib/cmsPageRoute'
import { isPublicCmsEnabled } from '../../lib/publicCms'

export async function generateMetadata() {
  return buildCmsPageMetadata('ai-digital-marketing-course', '/ai-digital-marketing-course', {
    title: 'AI Digital Marketing Course',
    description: 'Learn AI-powered digital marketing workflows across SEO, ads, content, analytics, and automation.',
  })
}

export default async function Page() {
  if (!isPublicCmsEnabled()) {
    return <HomeLegacyClient />
  }

  const cmsPage = await fetchCmsPageBySlug('ai-digital-marketing-course')
  return cmsPage ? <DynamicPageRenderer page={cmsPage} /> : <HomeLegacyClient />
}
