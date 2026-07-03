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
    title: 'Digital Marketing Course in Bangalore with AI Training',
    description: 'Join Acadvizen\'s Digital Marketing Course in Bangalore with AI Training. Learn SEO, Google Ads, Meta Ads, AI Automation, Website Development, Content Marketing, Analytics, and more through live projects, internships, and placement assistance.',
  })
}

export default async function Page() {
  if (!isPublicCmsEnabled()) {
    return <PublicLayout><HomeLegacyClient /></PublicLayout>
  }

  const cmsPage = await fetchCmsPageBySlug('home')
  return <PublicLayout>{cmsPage ? <DynamicPageRenderer page={cmsPage} /> : <HomeLegacyClient />}</PublicLayout>
}
