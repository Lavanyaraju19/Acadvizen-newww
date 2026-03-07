export const revalidate = 1;

import { PlacementClientPage } from '../../client-pages'
import { buildMetadata } from '../../lib/seo'

export const dynamic = 'force-static'

export const metadata = buildMetadata({
  title: 'Placement',
  description:
    'Placement support at Acadvizen with mock interviews, recruiter connects, and success stories from learners.',
  path: '/placement',
})

export default function Page() {
  return <PlacementClientPage />
}


