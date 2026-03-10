export const revalidate = 1;

import { HomeClientPage } from './client-pages'
import { buildMetadata } from './lib/seo'
import { PublicLayout } from '../src/components/Layout/PublicLayout'

export const metadata = buildMetadata({
  title: 'Acadvizen - AI Digital Marketing Course',
  description: 'Learn AI-powered digital marketing with placements in Bangalore.',
  path: '/',
})

export default function Page() {
  return (
    <PublicLayout>
      <HomeClientPage />
    </PublicLayout>
  )
}

