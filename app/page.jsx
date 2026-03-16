export const revalidate = 0
export const dynamic = 'force-dynamic'

import DynamicPageRenderer from '../components/cms/DynamicPageRenderer'
import { fetchCmsPageBySlug } from '../lib/cmsServer'
import { PublicLayout } from '../src/components/Layout/PublicLayout'
import HomeLegacyClient from './legacy-fallback/HomeLegacyClient'
import { buildCmsPageMetadata } from './lib/cmsPageRoute'
import { isPublicCmsEnabled } from './lib/publicCms'

export async function generateMetadata() {
  return buildCmsPageMetadata('home', '/', {
    title: 'Home',
    description: 'Learn AI-powered digital marketing with placements in Bangalore.',
  })
}

export default async function Page() {
  if (!isPublicCmsEnabled()) {
    return <PublicLayout><HomeLegacyClient /></PublicLayout>
  }

  const cmsPage = await fetchCmsPageBySlug('home')
  return <PublicLayout>{cmsPage ? <DynamicPageRenderer page={cmsPage} /> : <HomeLegacyClient />}</PublicLayout>
}
