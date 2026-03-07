export const revalidate = 1;

import { HireFromUsClientPage } from '../../client-pages'
import { buildMetadata } from '../../lib/seo'

export const dynamic = 'force-static'

export const metadata = buildMetadata({
  title: 'Hire From Us',
  description:
    'Hire job-ready digital marketing talent from Acadvizen with practical project and placement-readiness training.',
  path: '/hire-from-us',
})

export default function Page() {
  return <HireFromUsClientPage />
}


