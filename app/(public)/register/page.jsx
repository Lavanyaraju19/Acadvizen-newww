import { RegisterClientPage } from '../../client-pages'
import { buildMetadata } from '../../lib/seo'

export const dynamic = 'force-static'

export const metadata = buildMetadata({
  title: 'Register',
  description: 'Register for Acadvizen digital marketing programs and begin your learning journey.',
  path: '/register',
})

export default function Page() {
  return <RegisterClientPage />
}

