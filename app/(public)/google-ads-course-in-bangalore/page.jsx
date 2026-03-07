import { HomeClientPage } from '../../client-pages'
import { buildMetadata } from '../../lib/seo'

export const dynamic = 'force-static'

export const metadata = buildMetadata({
  title: 'Google Ads Course in Bangalore',
  description:
    'Build high-converting Google Ads campaigns with practical optimization workflows and performance tracking in Bangalore.',
  path: '/google-ads-course-in-bangalore',
})

export default function Page() {
  return <HomeClientPage />
}

