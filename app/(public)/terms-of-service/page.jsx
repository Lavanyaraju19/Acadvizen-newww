export const revalidate = 1;

import { TermsOfServiceClientPage } from '../../client-pages'
import { buildMetadata } from '../../lib/seo'

export const dynamic = 'force-static'

export const metadata = buildMetadata({
  title: 'Terms of Service',
  description: 'Read the Acadvizen terms of service.',
  path: '/terms-of-service',
})

export default function Page() {
  return <TermsOfServiceClientPage />
}


