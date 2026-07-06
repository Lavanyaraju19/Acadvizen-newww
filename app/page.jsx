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
    title: 'Acadvizen: Digital Marketing Course in Bangalore with AI Training',
    description: 'Join Acadvizen\'s Digital Marketing Course in Bangalore with AI Training. Learn SEO, Google Ads, Meta Ads, AI Automation, Website Development, Content Marketing, Analytics, and more through live projects, internships, and placement assistance.',
  })
}

export default async function Page() {
  console.log("=== PRODUCTION DEBUG ===");
  console.log("NEXT_PUBLIC_ENABLE_CMS_PUBLIC =", process.env.NEXT_PUBLIC_ENABLE_CMS_PUBLIC);
  console.log("isPublicCmsEnabled() =", isPublicCmsEnabled());
  console.log("========================");

  if (!isPublicCmsEnabled()) {
    return <PublicLayout><HomeLegacyClient /></PublicLayout>
  }

  const cmsPage = await fetchCmsPageBySlug('home')
  return <PublicLayout>{cmsPage ? <DynamicPageRenderer page={cmsPage} /> : <HomeLegacyClient />}</PublicLayout>
}
