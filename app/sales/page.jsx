export const revalidate = 1;

import { SalesClientPage } from '../client-pages'
import { buildMetadata } from '../lib/seo'

export const metadata = buildMetadata({
  title: 'Sales Dashboard',
  description: 'Acadvizen sales view for lead and admissions workflows.',
  path: '/sales',
})

export default function Page() {
  return <SalesClientPage />
}

