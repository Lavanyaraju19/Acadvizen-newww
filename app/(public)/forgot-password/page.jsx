export const revalidate = 1;

import { ForgotPasswordClientPage } from '../../client-pages'
import { buildMetadata } from '../../lib/seo'

export const dynamic = 'force-static'

export const metadata = buildMetadata({
  title: 'Forgot Password',
  description: 'Recover your Acadvizen account password securely.',
  path: '/forgot-password',
})

export default function Page() {
  return <ForgotPasswordClientPage />
}


