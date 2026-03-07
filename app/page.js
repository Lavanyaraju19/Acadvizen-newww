import { HomeClientPage } from './client-pages'
import { buildMetadata } from './lib/seo'
import { PublicLayout } from '../src/components/Layout/PublicLayout'

export const dynamic = 'force-static'

export const metadata = buildMetadata({
  title: 'Master AI-Powered Digital Marketing Course',
  description:
    'Build your own learning path with global industry experts, internship support, and placements at Acadvizen Bangalore.',
  path: '/',
})

export default function Home() {
  return (
    <PublicLayout>
      <HomeClientPage />
    </PublicLayout>
  )
}
