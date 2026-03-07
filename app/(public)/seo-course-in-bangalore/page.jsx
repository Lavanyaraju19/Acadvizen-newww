export const revalidate = 1;

import { HomeClientPage } from '../../client-pages'
import { buildMetadata } from '../../lib/seo'

export const dynamic = 'force-static'

export const metadata = buildMetadata({
  title: 'SEO Course in Bangalore',
  description:
    'Master technical SEO, on-page SEO, and content optimization with practical assignments and mentor support in Bangalore.',
  path: '/seo-course-in-bangalore',
})

export default function Page() {
  return <HomeClientPage />
}


