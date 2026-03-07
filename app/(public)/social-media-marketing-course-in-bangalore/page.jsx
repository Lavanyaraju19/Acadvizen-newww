export const revalidate = 1;

import { HomeClientPage } from '../../client-pages'
import { buildMetadata } from '../../lib/seo'

export const dynamic = 'force-static'

export const metadata = buildMetadata({
  title: 'Social Media Marketing Course in Bangalore',
  description:
    'Learn social media strategy, paid campaigns, and creative performance marketing through live projects in Bangalore.',
  path: '/social-media-marketing-course-in-bangalore',
})

export default function Page() {
  return <HomeClientPage />
}


