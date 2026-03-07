export const revalidate = 1;

import { AboutClientPage } from '../../client-pages'
import { buildMetadata } from '../../lib/seo'

export const dynamic = 'force-static'

export const metadata = buildMetadata({
  title: 'About Us',
  description:
    'Learn about Acadvizen, our mission, industry mentors, and AI-enabled digital marketing training approach.',
  path: '/about',
})

export default function Page() {
  return <AboutClientPage />
}


