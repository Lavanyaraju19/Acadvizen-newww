export const revalidate = 1;

import { PrivacyPolicyClientPage } from '../../client-pages'
import { buildMetadata } from '../../lib/seo'

export const dynamic = 'force-static'

export const metadata = buildMetadata({
  title: 'Privacy Policy',
  description: 'Read the Acadvizen privacy policy and data handling practices.',
  path: '/privacy-policy',
})

export default function Page() {
  return <PrivacyPolicyClientPage />
}


