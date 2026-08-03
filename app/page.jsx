export const revalidate = 0
export const dynamic = 'force-dynamic'

import HomePage from '../src/legacy/pages/HomePage'
import { fetchAllHomepageData } from '../lib/homepageCmsData'
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
  // Fetch all CMS data for homepage
  const cmsData = await fetchAllHomepageData()

  return (
    <PublicLayout>
      <HomePage cmsData={cmsData} />
    </PublicLayout>
  )
}
