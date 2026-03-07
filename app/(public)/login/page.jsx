import { LoginClientPage } from '../../client-pages'
import { buildMetadata } from '../../lib/seo'

export const dynamic = 'force-static'

export const metadata = buildMetadata({
  title: 'Student Login',
  description: 'Secure student login for Acadvizen dashboard access.',
  path: '/login',
})

export default function Page() {
  return <LoginClientPage />
}

