export const revalidate = 0
export const dynamic = 'force-dynamic'

import HomePage from '../src/legacy/pages/HomePage'
import { fetchAllHomepageData } from '../lib/homepageCmsData'
import { fetchSiteCmsData } from '../lib/siteCmsServer'
import { PublicLayout } from '../src/components/Layout/PublicLayout'
import { buildMetadata } from './lib/seo'

export async function generateMetadata() {
  return {
    ...buildMetadata({
      title: 'Acadvizen: Digital Marketing Course in Bangalore with AI Training',
      description: 'Join Acadvizen\'s Digital Marketing Course in Bangalore with AI Training. Learn SEO, Google Ads, Meta Ads, AI Automation, Website Development, Content Marketing, Analytics, and more through live projects, internships, and placement assistance.',
      path: '/',
    }),
    keywords: 'digital marketing course in bangalore, digital marketing training with AI, AI marketing course bangalore, SEO course bangalore, Google Ads training, Meta Ads course, digital marketing with placement',
  }
}

export default async function Page() {
  // Fetch homepage content and shared header/footer/site data in parallel - both are
  // independent reads, so there is no reason to wait on one before starting the other.
  const [cmsData, siteCmsData] = await Promise.all([
    fetchAllHomepageData(),
    fetchSiteCmsData(),
  ])

  return (
    <PublicLayout initialSiteCmsData={siteCmsData}>
      <HomePage cmsData={cmsData} />
    </PublicLayout>
  )
}
