export const revalidate = 1;

import { redirect } from 'next/navigation'
import { buildMetadata } from '../lib/seo'

export const metadata = buildMetadata({
  title: 'Admin Dashboard',
  description: 'Acadvizen CMS admin dashboard.',
  path: '/admin-dashboard',
})
metadata.robots = {
  index: false,
  follow: false,
}

export default function Page() {
  redirect('/admin')
}

