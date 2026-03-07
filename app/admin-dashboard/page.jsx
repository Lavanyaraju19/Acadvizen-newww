import { AdminCmsClientPage } from '../client-pages'
import { buildMetadata } from '../lib/seo'

export const metadata = buildMetadata({
  title: 'Admin CMS Dashboard',
  description: 'Acadvizen admin CMS dashboard for content and registrations.',
  path: '/admin-dashboard',
})
metadata.robots = {
  index: false,
  follow: false,
}

export default function Page() {
  return <AdminCmsClientPage />
}
