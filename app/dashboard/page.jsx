import { DashboardClientPage } from '../client-pages'
import { buildMetadata } from '../lib/seo'

export const metadata = buildMetadata({
  title: 'Student Dashboard',
  description: 'Access your Acadvizen student dashboard, courses, tools, and resources.',
  path: '/dashboard',
})

export default function Page() {
  return <DashboardClientPage />
}

