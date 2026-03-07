export const revalidate = 1;

import { HomeClientPage } from './client-pages'
import { PublicLayout } from '../src/components/Layout/PublicLayout'

export const metadata = {
  title: 'Acadvizen - AI Digital Marketing Course',
  description: 'Learn AI-powered digital marketing with placements in Bangalore.',
}

export default function Page() {
  return (
    <PublicLayout>
      <HomeClientPage />
    </PublicLayout>
  )
}

